import colors from "../../../global-styles/color_exports.scss";
import p5 from "p5";
import { Clickable, Container, Draggable, Drawable, MyObservable, MyObserver, PositionDisplayMode, Touchable } from "../ui-interfaces";
import { colorsTooSimilar, lightenDarkenColor, luminanceFromP5Color, p5TouchPoint, randomColorHexString } from "../util";
import { DragVertex } from "../vertex";

export type DemoChange = 'controlPointsChanged';

interface ControlPointColor {
    color: p5.Color,
    taken: boolean
}

export abstract class CurveDemo implements Drawable, Touchable, Draggable, Clickable, Container<DragVertex>, MyObservable<DemoChange> {
    private curve: Curve;
    private curveDrawingVisualization: CurveDrawingVisualization;

    get tMin(): number {
        return this._tMin;
    };
    protected _tMin: number;

    get tMax(): number {
        return this._tMax;
    }
    protected _tMax: number;
    

    public set t(newVal: number) {
        this._t = newVal;
        if (this._t > this.tMax) this._t = this.tMax;
        if (this.t < this.tMin) this._t = this.tMin;
        this.controlsForT.updateSlider();
    };
    public get t(): number {
        return this._t;
    }
    private _t: number = 0;
    private controlsForT: ControlsForParameterT;

    private _controlPoints: DragVertex[] = [];
    /**
     * The control points of the curve.
     * Others should only be able to read data from the control points, but not change them directly.
     * Also, mutations of the array should not be allowed.
     */
    public get controlPoints(): readonly DragVertex[] {
        return this._controlPoints;
    }

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

    showCurveDrawingVisualization: boolean = true;

    private _positionDisplayMode: PositionDisplayMode = "absolute";
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
        this.positionDisplayMode = 'relative to canvas';

        this.controlsForT = new ControlsForParameterT(p5, this, parentContainerId, baseAnimationSpeedMultiplier);
        this.curve = this.addCurve();
        this.curveDrawingVisualization = this.addCurveDrawingVisualization();
    }

    protected abstract addCurve(): Curve;
    protected abstract addCurveDrawingVisualization(): CurveDrawingVisualization;

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
        return this.controlPoints.some(v => v.hovering);
    };

    public get dragging(): boolean {
        return this.controlPoints.some(v => v.dragging);
    };

    draw(): void {
        if (this.controlPoints.length > 0) {
            this.controlsForT.updateT();

            if (this.controlPoints.length >= 2) this.curve.draw();
            if (this.showCurveDrawingVisualization) this.curveDrawingVisualization.draw();

            this.drawControlPoints();
        } else {
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text('Click or touch anywhere on the canvas to add a point', this.p5.width / 2, this.p5.height / 2);
            this.p5.pop();
        }
    }

    private drawControlPoints() {
        this.controlPoints.forEach(v => v.draw());
    }

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
        this.handleCurveDegreeChange();
    }

    remove(element: DragVertex): void {
        this._controlPoints = this._controlPoints.filter(v => v !== element);
        const idxOfColorOfElementToRemove = this.controlPointColors.findIndex(c => c.color === element.color);
        if (idxOfColorOfElementToRemove !== -1) this.controlPointColors[idxOfColorOfElementToRemove].taken = false;
        this.handleCurveDegreeChange();
    }

    private handleCurveDegreeChange() {
        const numOfVertices = this.controlPoints.length;
        this._controlPoints.forEach((v, i) => v.label = `P_{${i}}`);
        this.controlsForT.visible = numOfVertices > 1;
        this.additionalCurveDegreeChangeHandling();
        this.notifyObservers('controlPointsChanged');
    }

    //overriden by subclasses, if necessary
    protected additionalCurveDegreeChangeHandling() {}


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

            while ((prevColor && colorsTooSimilar(color, prevColor)) || (nextColor && colorsTooSimilar(color, nextColor) || luminanceFromP5Color(color) > 180)) {
                if (prevColor) console.log(`color of previous control point: ${prevColor.toString()}`);
                if (nextColor) console.log(`color of next control point: ${nextColor.toString()}`);
                console.log(`current control point's color ${color.toString()} with luminance ${luminanceFromP5Color(color)} was too bright or too similar, finding better fit...`);

                color = this.p5.color(randomColorHexString());
                console.log(`new color: ${color.toString()} (luminance: ${luminanceFromP5Color(color)})`);
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

    notifyObservers(change: DemoChange): void {
        this.observers.forEach(o => o.update(change));
    }
}





class ControlsForParameterT implements MyObserver<DemoChange> {
    private baseAnimationSpeedPerFrame = 0.005;
    private static animationSpeedMultipliers = [-4, -2, -1.5, -1, -0.5, -0.25, -0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 4];
    private currAnimationSpeedMultiplierIndex = ControlsForParameterT.animationSpeedMultipliers.findIndex(_ => _ === 1);

    private controlsContainer: p5.Element;
    private sliderLabel: p5.Element;
    private slider: p5.Element;
    private playPauseButton: p5.Element;
    private fasterButton: p5.Element;
    private slowerButton: p5.Element;

    public set visible(visible: boolean) {
        this.controlsContainer.style('visibility', visible ? 'visible' : 'hidden');
    };

    private set animationRunning(newVal: boolean) {
        this._animationRunning = newVal;
        if (this._animationRunning) this.playPauseButton.html('<span class="material-icons">pause</span>');
        else this.playPauseButton.html('<span class="material-icons">play_arrow</span>');
    }

    private get animationRunning(): boolean {
        return this._animationRunning;
    }
    private _animationRunning: boolean = false;


    constructor(p5: p5, private demo: CurveDemo, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        this.controlsContainer = p5.createDiv();

        if (parentContainerId) this.controlsContainer.parent(parentContainerId);
        this.controlsContainer.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select');


        this.sliderLabel = p5.createSpan(`t: ${this.demo.t.toFixed(2)}`);
        this.sliderLabel.parent(this.controlsContainer);

        this.slider = p5.createSlider(0, 1, 0, 0.00125);
        this.slider.parent(this.controlsContainer);
        this.slider.style('flex-grow', '2');
        this.slider.mousePressed(() => this.animationRunning = false);

        this.slowerButton = p5.createButton('<span class="material-icons">fast_rewind</span>');
        this.slowerButton.parent(this.controlsContainer);
        this.slowerButton.mouseClicked(() => this.rewindClicked());

        this.playPauseButton = p5.createButton('<span class="material-icons">play_arrow</span>');
        this.playPauseButton.parent(this.controlsContainer);
        this.playPauseButton.mouseClicked(() => this.animationRunning = !this.animationRunning);

        demo.subscribe(this);
        this.updateVisibility();


        this.fasterButton = p5.createButton('<span class="material-icons">fast_forward</span>');
        this.fasterButton.parent(this.controlsContainer);
        this.fasterButton.mouseClicked(() => this.fastForwardClicked());

        if (baseAnimationSpeedMultiplier) this.baseAnimationSpeedPerFrame *= baseAnimationSpeedMultiplier;
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') this.updateVisibility();
    }
    private updateVisibility() {
        this.visible = this.demo.controlPoints.length >= 2;
    }

    public updateT() {
        if (this.animationRunning) this.demo.t += (this.baseAnimationSpeedPerFrame * ControlsForParameterT.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]);
        else this.demo.t = +this.slider.value();
    }

    public updateSlider() {
        this.sliderLabel.html(`t: ${this.demo.t.toFixed(2)}`);
        this.slider.value(this.demo.t);
    }

    private fastForwardClicked() {
        this.animationRunning = true;
        if (this.currAnimationSpeedMultiplierIndex < ControlsForParameterT.animationSpeedMultipliers.length - 1) this.currAnimationSpeedMultiplierIndex++;
    }

    private rewindClicked() {
        this.animationRunning = true;
        if (this.currAnimationSpeedMultiplierIndex > 0) this.currAnimationSpeedMultiplierIndex--;
    }
}





export abstract class Curve implements Drawable {
    /**
     * Signifies on how many steps of t the bezier curve will be evaluated.
     * The less steps the less smooth the curve becomes.
     */
    private noOfEvaluationSteps: number;


    /**
     * ascending range of numbers in the interval for t in steps of size 1/noOfEvaluationSteps. https://stackoverflow.com/a/10050831
     * Might be modified during runtime of for certain types of curves
     */
    protected evaluationSteps: number[];

    protected color: p5.Color;

    constructor(protected p5: p5, protected demo: CurveDemo, evaluationSteps?: number, color?: p5.Color) {
        this.noOfEvaluationSteps = evaluationSteps ?? 100;
        this.evaluationSteps = this.calculateEvaluationSteps();
        this.color = color ?? p5.color(30);
    }

    protected calculateEvaluationSteps(): number[] {
        return [...Array(this.noOfEvaluationSteps + 1).keys()].slice(0, -1).map(i => (i / this.noOfEvaluationSteps) * (this.demo.tMax - this.demo.tMin))
    }

    public abstract draw(): void;
}





export abstract class CurveDrawingVisualization implements Drawable {
    protected color: p5.Color;
    protected colorOfPointOnCurve: p5.Color;
    public onlyDrawPointOnCurve: boolean = false;

    constructor(protected p5: p5, protected demo: CurveDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        this.color = color ?? p5.color('#E1B000');
        this.colorOfPointOnCurve = colorOfPointOnCurve ?? p5.color(colors.errorColor);
    }

    public abstract draw(): void;
}