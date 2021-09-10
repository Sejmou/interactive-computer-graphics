import colors from "../../../../../global-styles/color_exports.scss";
import p5 from "p5";
import { Clickable, Draggable, Drawable, PositionDisplayMode, showsPositionCoordinates, Touchable } from "../../../utils/interactivity/ui";
import { Container } from "../../../utils/interactivity/container";
import { MyObservable, MyObserver } from "../../../utils/interactivity/my-observable";
import { areColorsTooSimilar, lightenDarkenColor, luminanceFromP5Color, randomColorHexString } from "../../../utils/color";
import { p5TouchPoint } from "../../../utils/interactivity/p5/misc";
import { DragVertex } from "../../../utils/interactivity/p5/vertex";
import { ControlsForParameterT } from "./controls-for-t";
import { Curve } from "./curve";
import { CurveDrawingVisualization } from "./curve-drawing-vis";
import { InfluenceVisualizerForActiveControlPoint } from "./active-ctrl-pt-influence-vis";

export type DemoChange = 'controlPointsChanged' | 'rangeOfTChanged' | 'knotVectorChanged' | 'degreeChanged' | 'curveTypeChanged' | 'showCurveDrawingVisualizationChanged' | 'ctrlPtInfluenceFunctionsChanged';

/**
 * Associates each curve control point with its "influence function" (a term I came up with myself, not used in literature afaik) that defines how much that control point contributes to the shape of the curve for the current value of t
 * 
 * "Control point influence functions" may be Bézier polynomials (Bézier), B-Spline basis functions or weighted basis functions (NURBS)
 */
export interface ControlPointInfluenceFunctionData {
    controlPoint: DragVertex;
    influenceFunction: (t: number) => number;
    influenceFunctionAsLaTeXString: string;
}

interface ControlPointColor {
    color: p5.Color,
    taken: boolean
}

/**
 * Base class for each curve demo. It manages the core state and logic of each curve demo.
 * 
 * Handles the array of control points (also makes sure each control point gets a unique color that is distinguishable from that of its immediate neighbors).
 * 
 * Requires an instance of Curve that draws the curve presented in the demo. Instances of CurveDrawingVisualization and InfluenceVisualizerForActiveControlPoint also have to be provided and are drawn if needed (showCurveDrawingVisualization, showInfluenceVisForCurrentlyActiveCtrlPt).
 * 
 * Control point labels (P_0, ...., P_n) can be toggled on/off. The control point positions can also be displayed, if desired (in pixel coordinates or normalized coordinates).
 */
export abstract class CurveDemo implements Drawable, Touchable, Draggable, Clickable, Container<DragVertex>, MyObservable<DemoChange>, showsPositionCoordinates {
    private _curve?: Curve;

    private get curve() {
        if (!this._influenceVisForActiveCtrlPt) this._curve = this.initCurve();
        return this._curve;
    }

    /**
     * I had issues with the order of initializations in the constructor of this abstract base class and its subclasses.
     * The base class can't set the curve directly, as the curve actually needs the subclass instance and not the base class (had compiler errors too)
     * 
     * So, inheriting concrete classes should create an instance of Curve here, passing themselves as constructor param
     */
    protected abstract initCurve(): Curve;


    private curveDrawingVisualization: CurveDrawingVisualization | undefined;


    private _influenceVisForActiveCtrlPt?: InfluenceVisualizerForActiveControlPoint;

    private get influenceVisForActiveCtrlPt() {
        if (!this._influenceVisForActiveCtrlPt) this._influenceVisForActiveCtrlPt = this.initInfluenceVisForActiveCtrlPt();
        return this._influenceVisForActiveCtrlPt;
    }

    /**
     * I had issues with the order of initializations in the constructor of this abstract base class and its subclasses.
     * The base class can't set the influenceVisForActiveCtrlPt directly, as the influenceVisForActiveCtrlPt actually needs the subclass instance and not the base class (had compiler errors too)
     * 
     * So, inheriting concrete classes should create an instance of InfluenceVisualizerForActiveControlPoint here, passing themselves as constructor param
     */
    protected abstract initInfluenceVisForActiveCtrlPt(): InfluenceVisualizerForActiveControlPoint;


    get tMin(): number {
        return this._tMin;
    };
    protected _tMin: number;

    get tMax(): number {
        return this._tMax;
    }
    protected _tMax: number;

    /**
     * not necessarily the same as tMin (have a look at open B-splines, for example!)
     */
    public abstract firstTValueWhereCurveDefined: number;

    /**
     * not necessarily the same as tMax (have a look at open B-splines, for example!)
     */
    public abstract lastTValueWhereCurveDefined: number;

    /**
     * A curve can also be "invalid" (or "undefined") under certain circumstances. Trying to evaluate it or use its properties wouldn't make sense.
     * For example, one cannot render curves whose degree is higher than its number of control points!
     */
    public abstract valid: boolean;

    public set t(newVal: number) {
        this._t = newVal;
        if (this._t > this.tMax) this._t = this.tMin;
        if (this.t < this.tMin) this._t = this.tMax;
        this.controlsForT.updateSlider();
    };
    public get t(): number {
        return this._t;
    }
    private _t: number = 0;
    private controlsForT: ControlsForParameterT;

    protected controlsContainerId: string;

    protected _controlPoints: DragVertex[] = [];

    /**
     * The control points of the curve.
     * Others should only be able to read data from the control points, but not change them directly.
     * Also, mutations of the array should not be allowed.
     */
    public get controlPoints(): readonly DragVertex[] {
        return this._controlPoints;
    }

    /**
     * Gets a point on the curve using whatever algorithm the concrete curve uses for finding it (e.g. DeCasteljau for Bézier curves, De Boors's Algorithm for B-Spline curves)
     * 
     * @param t the curve parameter (has to be between the curve's tMin and tMax)
     */
    public abstract getPointOnCurve(t: number): p5.Vector;

    /**
     * The functions defining how much influence each control point has on the curve (e.g. Bernstein polynomials for Bézier curves, B-Spline basis functions). Summing all influence functions for a particular (valid) value of t together results in the point on the curve. Array length should be exactly the number of control points (as long as influence functions are defined/curve is valid)
     */
    public abstract get ctrlPtInfluenceFunctions(): ((t: number) => number)[];

    /**
     * The formulas for the influence functions (see ctrlPtInfluenceFunctions) as LaTeX strings. Array length should be exactly the number of control points (as long as influence functions are defined/curve is valid)
     */
    public abstract get ctrlPtInfluenceFuncsAsLaTeXStrings(): string[];

    /**
     * Combines all data related to the functions defining how much influence each control point has on the curve (e.g. Bernstein polynomials for Bézier curves, B-Spline basis functions).
     * Array length should be exactly the number of control points (as long as influence functions are defined/curve is valid)
     */
    public abstract get ctrlPtInfluenceFunctionData(): ControlPointInfluenceFunctionData[];


    private _basePointDiameter: number;
    public get basePointDiameter(): number {
        return this._basePointDiameter;
    }

    private _baseLineWidth: number;
    public get baseLineWidth(): number {
        return this._baseLineWidth;
    }

    private _showPointLabels: boolean = false;
    /**
     * defines whether the labels of the control points should be displayed
     */
    public get showPointLabels(): boolean {
        return this._showPointLabels;
    }
    public set showPointLabels(value: boolean) {
        this._showPointLabels = value;
        this._controlPoints.forEach(v => v.showLabel = value);
    }

    private _showPointPositions: boolean = false;
    /**
     * defines whether the positions of the control points should be displayed
     */
    public get showPointPositions(): boolean {
        return this._showPointPositions;
    }
    public set showPointPositions(value: boolean) {
        this._showPointPositions = value;
        this._controlPoints.forEach(v => v.showPosition = value);
    }

    _showCurveDrawingVisualization: boolean = true;
    set showCurveDrawingVisualization(newValue: boolean) {
        const oldValue = this._showCurveDrawingVisualization;
        this._showCurveDrawingVisualization = newValue;
        if (oldValue !== newValue) this.notifyObservers('showCurveDrawingVisualizationChanged');
    }
    get showCurveDrawingVisualization(): boolean {
        return this._showCurveDrawingVisualization;
    };

    showInfluenceVisForCurrentlyActiveCtrlPt = false;//TODO: maybe later add change events too
    public get shouldDrawInfluenceVisForCurrentlyActiveCtrlPt() {
        return this.showInfluenceVisForCurrentlyActiveCtrlPt && (this.hovering || this.dragging);
    }

    private _positionDisplayMode: PositionDisplayMode = "normalized coordinates";
    public get positionDisplayMode(): PositionDisplayMode {
        return this._positionDisplayMode;
    }
    public set positionDisplayMode(value: PositionDisplayMode) {
        this._positionDisplayMode = value;
        this._controlPoints.forEach(v => v.positionDisplayMode = value);
    }


    protected constructor(protected p5: p5, tMin: number, tMax: number, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        this._tMin = tMin;
        this._tMax = tMax;

        this._basePointDiameter = p5.width * 0.015;
        this._baseLineWidth = p5.width * 0.0025;
        this.controlPointColors = this.initControlPointColors();
        this.showPointLabels = false;
        this.showPointPositions = false;
        this.positionDisplayMode = 'pixel coordinates';

        // this.influenceVisForActiveCtrlPt = new InfluenceVisualizerForActiveControlPoint(this.p5, this);

        const controlsContainer = this.p5.createDiv();
        this.controlsContainerId = 't-controls-container';
        controlsContainer.id(this.controlsContainerId);
        if (parentContainerId) controlsContainer.parent(parentContainerId);
        controlsContainer.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select');

        this.controlsForT = new ControlsForParameterT(p5, this, this.controlsContainerId, baseAnimationSpeedMultiplier);
    }

    protected setCurveDrawingVisualization(vis: CurveDrawingVisualization) {
        this.curveDrawingVisualization = vis;
    };

    handleMousePressed(): void {
        if (this.controlPoints.length === 0) {
            const newPt = this.createCtrlPtAtPos(this.p5.mouseX, this.p5.mouseY);
            this.addCtrlPtAtIndex(newPt, 0);
            //we want to allow the user to drag the added control point immediately, therefore we call handleTouchStarted() on it
            newPt.handleMousePressed();
            return;
        }

        //operating on a copy of the array as vertices might get added or removed while iterating over the array
        //this could potentially lead to a lot of confusing/unpredictable behavior
        //e.g. handleMousePressed() could get called infinitely on the same control point, or not get called on some vertices, or on newly added vertices (which were not actuall clicked on of course) 
        const controlPoints = this.controlPoints.slice();
        for (let i = 0; i < controlPoints.length; i++) {
            let v = controlPoints[i];
            v.handleMousePressed();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one control point is being dragged
            if (v.dragging) break;
        }
    }

    handleMouseReleased(): void {
        this.controlPoints.forEach(v => v.handleMouseReleased());
    }

    handleTouchStarted(): void {
        if (this.controlPoints.length === 0) {
            const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?

            if (touches.length === 0) {
                console.warn('touches was unexpectedly empty');
            } else {
                const newPt = this.createCtrlPtAtPos(touches[0].x, touches[0].y);
                this.addCtrlPtAtIndex(newPt, 0);
                //we want to allow the user to drag the added control point immediately, therefore we call handleTouchStarted() on it
                newPt.handleTouchStarted();
            }
            return;
        }

        //operating on a copy of the array as vertices might get added or removed while iterating over the array
        //this could potentially lead to a lot of confusing/unpredictable behavior
        const vertices = this.controlPoints.slice();
        for (let i = 0; i < vertices.length; i++) {
            let v = vertices[i];
            v.handleTouchStarted();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one control point is being dragged
            if (v.dragging) break;
        }
    }

    handleTouchReleased(): void {
        this.controlPoints.forEach(v => v.handleTouchReleased());
    }

    public get hovering(): boolean {
        const hovering = this.controlPoints.some(v => v.hovering);
        if (hovering != this.lastHoverState) {
            this.lastHoverState = hovering;
            this.onHoverChange?.();
        }
        return hovering;
    };
    private lastHoverState = false;

    public onHoverChange?: () => void;

    public get dragging(): boolean {
        const dragging = this.controlPoints.some(v => v.dragging);
        if (dragging != this.lastDraggingState) {
            this.lastDraggingState = dragging;
            this.onDraggingChange?.();
        }
        return dragging;
    };
    private lastDraggingState = false;

    public onDraggingChange?: () => void;

    draw(): void {
        this.controlsForT.updateT();
        if (this.controlPoints.length === 0) {
            this.displayMessage(this.noControlPointsMessage);
            return;
        }

        if (this.valid) {
            this.curve?.draw();
            if (this.showInfluenceVisForCurrentlyActiveCtrlPt) this.influenceVisForActiveCtrlPt?.draw();
            if (this.showCurveDrawingVisualization) this.curveDrawingVisualization?.draw();
        }
        else this.displayMessage(this.curveInvalidMessage);

        this.drawControlPoints();
    }

    private drawControlPoints() {
        this.controlPoints.forEach(v => v.draw());
    }

    /**
     * shown in the middle of the canvas when the curve is invalid
     */
    protected get curveInvalidMessage() {
        return 'The curve is invalid/undefined';
    }
    private noControlPointsMessage = 'Click or touch anywhere on the canvas to add a point';

    private displayMessage(message: string) {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text(message, this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }

    /**
     * Adds a new control point after the provided control point. Updates this.controlPoints accordingly.
     * 
     * @param element control point after which a new control point should be added
     * @returns 
     */
    addElementAfter(element: DragVertex): void {
        const i = this.controlPoints.findIndex(e => e === element);
        if (i === -1) {
            console.warn('could not find provided element in control vertices of bezier, cancelling adding...');
            return;
        }

        //add control point where user clicked on or touched add button
        const touches = this.p5.touches as p5TouchPoint[];
        const touchInteraction = touches.length > 0;
        const x = touchInteraction ? touches[0].x : this.p5.mouseX;
        const y = touchInteraction ? touches[0].y : this.p5.mouseY;
        const newPt = this.createCtrlPtAtPos(x, y);
        this.addCtrlPtAtIndex(newPt, i + 1);

        //control point should instantly be dragged after being added, so we call handle...Started() on it
        if (touchInteraction) newPt.handleTouchStarted();
        else newPt.handleMousePressed();
    }

    private createCtrlPtAtPos(x: number, y: number): DragVertex {
        const newPt = new DragVertex(this.p5, this.p5.createVector(x, y));
        newPt.baseRadius = this.basePointDiameter / 2;
        newPt.stroke = false;
        newPt.editable = true;
        newPt.showLabel = this._showPointLabels;
        newPt.showPosition = this._showPointPositions;
        newPt.positionDisplayMode = this._positionDisplayMode;
        newPt.assignTo(this);
        return newPt;
    }

    /**
     * Adds a control point to this.controlPoints at the specified index. Also makes sure that the newly added control point gets a color that is not too similar to that of its neighbors
     * and that the curve degree change is handled appropriately.
     */
    private addCtrlPtAtIndex(newPt: DragVertex, i: number) {
        this._controlPoints.splice(i, 0, newPt);
        newPt.color = this.getColorForCtrlPtAtIndex(i);
        //TODO: figure out how to do darken color so that it works with arbitrarily dark initial colors (lightenDarkenP5Color can't do this atm)
        newPt.activeColor = newPt.color;
        this.handleCtrlPtAmountChange();
    }

    remove(element: DragVertex): void {
        this._controlPoints = this._controlPoints.filter(v => v !== element);
        const idxOfColorOfElementToRemove = this.controlPointColors.findIndex(c => c.color === element.color);
        if (idxOfColorOfElementToRemove !== -1) this.controlPointColors[idxOfColorOfElementToRemove].taken = false;
        this.handleCtrlPtAmountChange();
    }

    private handleCtrlPtAmountChange() {
        const numOfVertices = this.controlPoints.length;
        this._controlPoints.forEach((v, i) => v.label = `P_{${i}}`);
        this.controlsForT.visible = numOfVertices > 1;
        this.additionalCtrlPtAmountChangeHandling();
        this.notifyObservers('controlPointsChanged');
    }

    /**
     * implemented by subclasses, if necessary
     */
    protected abstract additionalCtrlPtAmountChangeHandling(): void;


    //Control point color picking
    private controlPointColors: ControlPointColor[];
    private initControlPointColors(): ControlPointColor[] {
        const colorArr = [
            this.p5.color(colors.primaryColor),
            this.p5.color(lightenDarkenColor(colors.successColor, 15)),
            this.p5.color('#6727e2'),
            this.p5.color('#ff6600'),
            this.p5.color('#c85d84'),
            this.p5.color('#11e8db'),
            this.p5.color('#62421c'),
            this.p5.color('#4e7165'),
            this.p5.color('#1c087b')
        ];

        return colorArr.map(color => ({ color, taken: false }));
    }

    private getColorForCtrlPtAtIndex(i: number): p5.Color {
        //colors should assigned from this.controlPointColors as long as a color is still not taken yet, in the order defined in this.controlPointColors
        //the order defined in this.controlPointColors should be preserved, so:
        //  for example: if we already have two control points A and B a new point C gets added between them, it should NOT get the next available color
        //  from this.controlPointColors, but a random one which is neither too bright nor too similar to A or B
        //  if another control point is added after C, it should also get a new random color with the same conditions stated above

        const idxOfNextAvailableCol = this.controlPointColors.findIndex(c => !c.taken);
        const predefinedColAvailable = idxOfNextAvailableCol !== -1;
        const nextPtColor = this.controlPoints[i + 1]?.color;

        //sorry, this is a bit ugly... :/
        if (
            predefinedColAvailable &&
            (
                !nextPtColor ||
                !this.controlPointColors.map(c => c.color).includes(nextPtColor) //if there is a following control point, its color must not be one of the predefined ones
            )
        ) {
            const selectedColor = this.controlPointColors[idxOfNextAvailableCol];
            selectedColor.taken = true;

            return selectedColor.color;
        }
        else {
            let color = this.p5.color(randomColorHexString());

            //check that whatever color we got, it is not too similar to its neighbours and also not too bright
            //this could probably be written cleaner, sry lol
            let prevColor: p5.Color | null = null;
            let nextColor: p5.Color | null = null;

            if (i > 0) prevColor = this.controlPoints[i - 1].color;
            if (i < this.controlPoints.length - 1) nextColor = this.controlPoints[i + 1].color;

            while ((prevColor && areColorsTooSimilar(color, prevColor)) || (nextColor && areColorsTooSimilar(color, nextColor) || luminanceFromP5Color(color) > 180)) {
                if (prevColor) console.log(`color of previous control point: ${prevColor.toString()}`);
                if (nextColor) console.log(`color of next control point: ${nextColor.toString()}`);
                //console.log(`current control point's color ${color.toString()} with luminance ${luminanceFromP5Color(color)} was too bright or too similar, finding better fit...`);

                color = this.p5.color(randomColorHexString());
                //console.log(`new color: ${color.toString()} (luminance: ${luminanceFromP5Color(color)})`);
            }

            return color;
        }
    }


    private observers: MyObserver<DemoChange>[] = [];

    subscribe(observer: MyObserver<DemoChange>): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: MyObserver<DemoChange>): void {
        this.observers = this.observers.filter(o => o !== observer);
    }

    /**
     * Notifies observers that a particular property of the curve changed
     * @param change The change that occured
     */
    notifyObservers(change: DemoChange): void {
        this.observers.forEach(o => o.update(change));
    }
}