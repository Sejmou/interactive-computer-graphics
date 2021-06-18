import colors from "../../../global-styles/color_exports.scss";
import p5 from "p5";
import { Clickable, Container, Draggable, Drawable, MyObservable, MyObserver, PositionDisplayMode, Touchable } from "../ui-interfaces";
import { colorsTooSimilar, createArrayOfEquidistantAscendingNumbersInRange, drawLineXYCoords, lightenDarkenColor, lightenDarkenP5Color, luminanceFromP5Color, p5TouchPoint, randomColorHexString } from "../util";
import { DragVertex } from "../vertex";

export type DemoChange = 'controlPointsChanged' | 'rangeOfTChanged' | 'knotVectorChanged' | 'degreeChanged' | 'curveTypeChanged';

interface ControlPointColor {
    color: p5.Color,
    taken: boolean
}

export abstract class CurveDemo implements Drawable, Touchable, Draggable, Clickable, Container<DragVertex>, MyObservable<DemoChange> {
    private curve: Curve | undefined;
    private curveDrawingVisualization: CurveDrawingVisualization | undefined;

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

        const controlsContainer = this.p5.createDiv();
        this.controlsContainerId = 'controls-container';
        controlsContainer.id(this.controlsContainerId);
        if (parentContainerId) controlsContainer.parent(parentContainerId);
        controlsContainer.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select');


        this.controlsForT = new ControlsForParameterT(p5, this, this.controlsContainerId, baseAnimationSpeedMultiplier);
    }

    protected setCurve(curve: Curve) {
        this.curve = curve;
    };

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
            if (this.showCurveDrawingVisualization) this.curveDrawingVisualization?.draw();
        }
        else this.displayMessage(this.curveInvalidMessage);

        this.drawControlPoints();
    }

    private drawControlPoints() {
        this.controlPoints.forEach(v => v.draw());
    }

    /**
     * shown in the middle of the canvas when the this.valid is false
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

    //overriden by subclasses, if necessary
    protected additionalCtrlPtAmountChangeHandling() { }


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

    /**
     * needed so that animation keeps same speed, even if interval for t becomes larger or smaller
     */
    private speedCompensationForSizeOfTInterval: number;
    private static animationSpeedMultipliers = [-4, -2, -1.5, -1, -0.5, -0.25, -0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 4];
    private currAnimationSpeedMultiplierIndex = ControlsForParameterT.animationSpeedMultipliers.findIndex(_ => _ === 1);

    private controlsForTContainer: p5.Element;
    private sliderLabel: p5.Element;
    private slider: p5.Element;
    private playPauseButton: p5.Element;
    private fasterButton: p5.Element;
    private slowerButton: p5.Element;

    public set visible(visible: boolean) {
        this.controlsForTContainer.style('visibility', visible ? 'visible' : 'hidden');
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


    constructor(private p5: p5, private demo: CurveDemo, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        this.speedCompensationForSizeOfTInterval = this.demo.tMax - this.demo.tMin;

        this.controlsForTContainer = p5.createDiv();

        if (parentContainerId) this.controlsForTContainer.parent(parentContainerId);
        this.controlsForTContainer.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select full-width');
        this.controlsForTContainer.id('controls-for-t');


        this.sliderLabel = p5.createSpan(`t: ${this.demo.t.toFixed(2)}`);
        this.sliderLabel.parent(this.controlsForTContainer);

        this.slider = this.createSlider();

        this.slowerButton = p5.createButton('<span class="material-icons">fast_rewind</span>');
        this.slowerButton.parent(this.controlsForTContainer);
        this.slowerButton.mouseClicked(() => this.rewindClicked());

        this.playPauseButton = p5.createButton('<span class="material-icons">play_arrow</span>');
        this.playPauseButton.parent(this.controlsForTContainer);
        this.playPauseButton.mouseClicked(() => this.animationRunning = !this.animationRunning);

        demo.subscribe(this);
        this.updateVisibility();


        this.fasterButton = p5.createButton('<span class="material-icons">fast_forward</span>');
        this.fasterButton.parent(this.controlsForTContainer);
        this.fasterButton.mouseClicked(() => this.fastForwardClicked());

        if (baseAnimationSpeedMultiplier) this.baseAnimationSpeedPerFrame *= baseAnimationSpeedMultiplier;
    }

    private createSlider(): p5.Element {
        const slider = this.p5.createSlider(this.demo.tMin, this.demo.tMax, this.demo.t, 0);
        slider.style('flex-grow', '2');
        slider.mousePressed(() => this.animationRunning = false);
        slider.parent(this.controlsForTContainer);
        return slider;
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') this.updateVisibility();
        if (data === 'rangeOfTChanged') {
            this.speedCompensationForSizeOfTInterval = this.demo.tMax - this.demo.tMin;
            this.updateSliderRange();
        }
    }
    private updateVisibility() {
        this.visible = this.demo.valid;
    }

    private updateSliderRange() {
        this.slider.remove();
        this.slider = this.createSlider();

        //this is necessary to preserve the order of elements in the controlsContainer
        this.slowerButton.parent(this.controlsForTContainer);
        this.playPauseButton.parent(this.controlsForTContainer);
        this.fasterButton.parent(this.controlsForTContainer);
    }

    public updateT() {
        if (this.animationRunning) {
            this.demo.t += (this.baseAnimationSpeedPerFrame * this.speedCompensationForSizeOfTInterval * ControlsForParameterT.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]);
        }
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
    public get noOfEvaluationSteps(): number {
        return this._noOfEvaluationSteps;
    };
    public set noOfEvaluationSteps(newVal: number) {
        this._noOfEvaluationSteps = newVal;
        this.calculateEvaluationSteps();
    }
    private _noOfEvaluationSteps: number;


    /**
     * ascending range of numbers in the interval for t in steps of size 1/noOfEvaluationSteps. https://stackoverflow.com/a/10050831
     * Might be modified during runtime for certain types of curves
     */
    protected evaluationSteps: number[];

    protected color: p5.Color;

    constructor(protected p5: p5, protected demo: CurveDemo, evaluationSteps?: number, color?: p5.Color) {
        this._noOfEvaluationSteps = evaluationSteps ?? 100;
        this.evaluationSteps = createArrayOfEquidistantAscendingNumbersInRange(this.noOfEvaluationSteps, this.demo.firstTValueWhereCurveDefined, this.demo.lastTValueWhereCurveDefined);
        this.color = color ?? p5.color(30);
    }

    /**
     * Creates an array of evaluation steps for the curve, depending on this.noOfEvaluationSteps and tMin and tMax of the demo.
     * Should be called whenever the range for the parameter t changes
     * 
     * @returns array of evaluation steps
     */
    protected calculateEvaluationSteps(): number[] {
        return createArrayOfEquidistantAscendingNumbersInRange(this.noOfEvaluationSteps, this.demo.firstTValueWhereCurveDefined, this.demo.lastTValueWhereCurveDefined);
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





export interface ControlPointInfluenceData {
    controlPoint: DragVertex,
    currentCtrlPtInfluence: () => number
}

export abstract class ControlPointInfluenceVisualization implements Drawable, Draggable, Touchable, Clickable {
    private barBorderColor: p5.Color;
    private barHeight = 60;
    private barWidth = 30;
    private borderThickness = 5;

    private ctrlPtInfluenceDataPoints: ControlPointInfluenceData[] = [];
    private influenceBars: ControlPointInfluenceBar[] = [];

    constructor(private p5: p5, private demo: CurveDemo, public visible: boolean = true) {
        this.barBorderColor = p5.color(120);
    }

    /**
     * Call this when reacting to relevant demo changes that require an update of the ctrlPtInfluenceDataPoints
     */
    protected updateInfluenceDataAndBars() {
        this.ctrlPtInfluenceDataPoints = this.getCurrentControlPointInfluenceDataPoints();
        //needed so that positions of influence bars don't reset if new vertices get added
        const ctrlPtsAndOffsetsOfInfluenceBars = this.influenceBars.map(b => ({ ctrlPt: b.assignedControlPoint, offsetX: b.offsetFromCtrlPtPosX, offsetY: b.offsetFromCtrlPtPosY }));
        this.influenceBars = this.ctrlPtInfluenceDataPoints.map(d => {
            const alreadyDisplayedCtrlPt = ctrlPtsAndOffsetsOfInfluenceBars.find(co => co.ctrlPt === d.controlPoint);
            if (alreadyDisplayedCtrlPt) return new ControlPointInfluenceBar(this.p5, d, { offsetFromCtrlPtPosX: alreadyDisplayedCtrlPt.offsetX, offsetFromCtrlPtPosY: alreadyDisplayedCtrlPt.offsetY });
            else return new ControlPointInfluenceBar(this.p5, d);
        });
    }

    protected abstract getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[];

    draw(): void {
        if (!this.demo.valid || !this.visible) return;
        this.influenceBars.forEach(b => b.draw());
        if (this.influenceBars.length > 1) this.drawSummaryBar();
    }

    /**
     * draws a single bar summarizing the influence each control point currently has (each control point gets a slice) 
     */
    private drawSummaryBar() {
        this.p5.push();
        this.p5.noStroke();
        this.p5.rectMode(this.p5.CORNER);
        const summaryBarX = this.p5.width - this.barWidth - 2 * this.borderThickness;
        const summaryBarY = this.p5.height - this.barHeight - 2 * this.borderThickness;
        this.p5.fill(this.barBorderColor);
        this.p5.rect(summaryBarX, summaryBarY, this.barWidth + this.borderThickness, this.barHeight + this.borderThickness);
        let yOffset = 0;
        this.ctrlPtInfluenceDataPoints.forEach(d => {
            const fillHeight = d.currentCtrlPtInfluence() * (this.barHeight - this.borderThickness);
            this.p5.fill(d.controlPoint.color);
            this.p5.rect(summaryBarX + this.borderThickness, summaryBarY + this.barHeight - fillHeight - yOffset, this.barWidth - this.borderThickness, fillHeight);
            yOffset += fillHeight;
        });
        this.p5.pop();
    }

    get hovering(): boolean {
        return this.influenceBars.some(b => b.hovering);
    };

    get dragging(): boolean {
        return this.influenceBars.some(b => b.dragging);
    };

    handleTouchStarted(): void {
        const bars = this.influenceBars.slice();
        for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            b.handleTouchStarted();//after this call v.dragging might be true!

            //dragging several things at once is not desired behavior, break out of the loop
            if (b.dragging) break;
        }
    }

    handleTouchReleased(): void {
        this.influenceBars.forEach(b => b.handleTouchReleased())
    }

    handleMousePressed(): void {
        const bars = this.influenceBars.slice();
        for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            b.handleMousePressed();//after this call v.dragging might be true!

            //dragging several things at once is not desired behavior, break out of the loop
            if (b.dragging) break;
        }
    }

    handleMouseReleased(): void {
        this.influenceBars.forEach(b => b.handleMouseReleased());
    }
}



/**
 * parameters used for initial configuration of influence bar
 */
interface InfluenceBarConfig {
    offsetFromCtrlPtPosX?: number,
    offsetFromCtrlPtPosY?: number,
    height?: number,
    width?: number,
    borderColor?: p5.Color,
    borderThickness?: number
}

class ControlPointInfluenceBar implements Drawable, Draggable, Touchable, Clickable {
    private borderColor: p5.Color = this.p5.color(120);
    private height: number = 60;
    private width: number = 30;
    private borderThickness: number = 5;
    private fillBackgroundColor: p5.Color;

    private _offsetFromCtrlPtPosX: number;
    public get offsetFromCtrlPtPosX() {
        return this._offsetFromCtrlPtPosX;
    }

    private _offsetFromCtrlPtPosY: number;
    public get offsetFromCtrlPtPosY() {
        return this._offsetFromCtrlPtPosY;
    }

    public get assignedControlPoint() {
        return this.data.controlPoint;
    }

    private get x(): number {
        return this.data.controlPoint.x + this._offsetFromCtrlPtPosX
    }

    private get y(): number {
        return this.data.controlPoint.y + this._offsetFromCtrlPtPosY
    }

    /**
     * defined if user is dragging bar on touch screen
     */
    private touchPointID?: number;

    constructor(private p5: p5, private data: ControlPointInfluenceData, config?: InfluenceBarConfig) {
        this._offsetFromCtrlPtPosX = -this.width * 1.25;
        this._offsetFromCtrlPtPosY = this.width / 2;
        this.fillBackgroundColor = p5.color(lightenDarkenP5Color(this.p5, this.borderColor, 20));

        if (config) {
            if (config.offsetFromCtrlPtPosX) this._offsetFromCtrlPtPosX = config.offsetFromCtrlPtPosX;
            if (config.offsetFromCtrlPtPosY) this._offsetFromCtrlPtPosY = config.offsetFromCtrlPtPosY;
            if (config.borderColor) this.borderColor = config.borderColor;
            if (config.borderThickness) this.borderThickness = config.borderThickness;
            if (config.height) this.height = config.height;
            if (config.width) this.width = config.width;
        }
    }

    draw(): void {
        if (this.dragging) {
            this.updatePos();
            drawLineXYCoords(this.p5, this.x, this.y, this.data.controlPoint.x, this.data.controlPoint.y, this.data.controlPoint.color, 1);
        }

        const c = this.data.controlPoint;
        const ctrlPtInfluence = this.data.currentCtrlPtInfluence();
        const maxFillHeight = this.height - this.borderThickness;
        const fillHeight = ctrlPtInfluence * maxFillHeight;

        this.p5.push();
        this.p5.noStroke();
        this.p5.rectMode(this.p5.CENTER);
        this.p5.fill(this.borderColor);
        this.p5.rect(this.x, this.y, this.width, this.height);
        this.p5.fill(this.fillBackgroundColor);
        this.p5.rect(this.x, this.y + (this.height - maxFillHeight) / 2 - this.borderThickness / 2, this.width - this.borderThickness, maxFillHeight);
        this.p5.fill(c.color);
        if (fillHeight == 0) {
            this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
            this.p5.text('no influence', this.x, this.y + this.height / 2 + this.borderThickness * 2);
        }
        else this.p5.rect(this.x, this.y + (this.height - fillHeight) / 2 - this.borderThickness / 2, this.width - this.borderThickness, fillHeight);
        this.p5.pop();
    }

    get hovering(): boolean {
        return this.dragging || this.checkPtInsideRect(this.p5.mouseX, this.p5.mouseY);
    };

    private _dragging = false;
    get dragging(): boolean {
        return this._dragging;
    };

    private updatePos() {
        const ctrlPt = this.data.controlPoint;
        if (this.touchPointID) {
            const touchPoint = (this.p5.touches as p5TouchPoint[]).find(t => t.id === this.touchPointID);
            if (touchPoint) {
                this._offsetFromCtrlPtPosX = touchPoint.x - this.dragPtOffsetX - ctrlPt.x;
                this._offsetFromCtrlPtPosY = touchPoint.y - this.dragPtOffsetY - ctrlPt.y;
            }
            else console.warn(`touchPoint with ID ${this.touchPointID} not found!`);
        }
        else {
            this._offsetFromCtrlPtPosX = this.p5.mouseX - this.dragPtOffsetX - ctrlPt.x;
            this._offsetFromCtrlPtPosY = this.p5.mouseY - this.dragPtOffsetY - ctrlPt.y;
        }
    }

    handleTouchStarted(): void {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (touches.length === 0) {
            console.warn('touches was unexpectedly empty');
            return;
        }
        const ptInsideRect = touches.find(pt => this.checkPtInsideRect(pt.x, pt.y));
        if (ptInsideRect) {
            this.dragPtOffsetX = ptInsideRect.x - this.x;
            this.dragPtOffsetY = ptInsideRect.y - this.y;
            this._dragging = true;
        }
    }

    handleTouchReleased(): void {
        this._dragging = false;
    }

    handleMousePressed(): void {
        const x = this.p5.mouseX;
        const y = this.p5.mouseY;

        const cursorInsideRect = this.checkPtInsideRect(x, y);
        if (cursorInsideRect) {
            this.dragPtOffsetX = x - this.x;
            this.dragPtOffsetY = y - this.y;
            this._dragging = true;
        }
    }

    handleMouseReleased(): void {
        this._dragging = false;
    }

    private checkPtInsideRect(x: number, y: number): boolean {
        const rectLeft = this.x - this.width / 2
        const rectRight = this.x + this.width / 2;
        const rectTop = this.y - this.height / 2;
        const rectBottom = this.y + this.height / 2;

        const inside = x >= rectLeft
            && x <= rectRight
            && y >= rectTop
            && y <= rectBottom;
        return inside;
    }

    private dragPtOffsetX = 0;
    private dragPtOffsetY = 0;
}

export class InfluenceVisVisibilityCheckbox implements MyObserver<DemoChange> {
    private form: HTMLFormElement;

    constructor(private demo: CurveDemo, private influenceVis: ControlPointInfluenceVisualization, controlsParentContainerId?: string) {
        this.demo.subscribe(this);

        const formFieldName = 'showInfluenceBars';

        const checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.name = formFieldName;
        checkBox.checked = this.influenceVis.visible;
        checkBox.className = 'filled-in';
        const desc = document.createElement('span');
        desc.innerText = 'show control point influence bars';
        const label = document.createElement('label');
        label.appendChild(checkBox);
        label.appendChild(desc);
        this.form = document.createElement('form');
        this.form.appendChild(label);
        this.form.addEventListener('change', () => {
            this.influenceVis.visible = new FormData(this.form).get(formFieldName) !== null;
            checkBox.checked = this.influenceVis.visible;
        });
        this.updateCheckboxVisibility();

        if (controlsParentContainerId) {
            const parentContainer = document.getElementById(controlsParentContainerId);
            if (parentContainer) {
                parentContainer.appendChild(this.form);
                return;
            }
            console.warn(`parent container with id '${controlsParentContainerId}' for influence bar checkbox not found`);
        }
        else {
            console.warn('no parent container for influence bar checkbox provided');
        }
        document.appendChild(label);
    }

    update(): void {
        this.updateCheckboxVisibility();
    }

    private updateCheckboxVisibility() {
        if (this.form) {
            if (this.demo.valid) this.form.style.removeProperty('visibility');
            else this.form.style.visibility = 'hidden';
        }
    }
}