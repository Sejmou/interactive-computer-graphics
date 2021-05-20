import p5 from 'p5';
import { Touchable, Draggable, Drawable, Container, Clickable, MyObservable, MyObserver, PositionDisplayMode } from './ui-interfaces';
import { DragVertex } from './vertex';
import { colorsTooSimilar, drawCircle, drawLineVector, extractColorChannelsFromRGBAString, indexToLowercaseLetter, lightenDarkenColor, lightenDarkenP5Color, luminanceFromP5Color, p5TouchPoint, randomColorHexString } from './util';
import colors from '../../global-styles/color_exports.scss';

export type BezierDemoChange = 'controlPointsChanged';

//TODO: add curveDegreeTextContainer back
// this.curveDegreeTextContainer.html(`Number of control vertices: ${numOfVertices}`);

interface ControlPointColor {
    color: p5.Color,
    taken: boolean
}

export class BezierDemo implements Drawable, Touchable, Draggable, Clickable, Container<DragVertex>, MyObservable<BezierDemoChange> {
    private _basePointDiameter: number;

    public get basePointDiameter(): number {
        return this._basePointDiameter;
    }

    private _baseLineWidth: number;
    public get baseLineWidth(): number {
        return this._baseLineWidth;
    }

    private _controlPoints: DragVertex[] = [];

    //others should only be able to read data from vertices, but not change them directly
    //also, mutations of the array should not be allowed
    public get controlPoints(): readonly DragVertex[] {
        return this._controlPoints;
    }

    /**
     * defines whether the labels of the control points and point on the bezier curve should be displayed
     */
    /**
     * defines whether the labels of the control points and point on the bezier curve should be displayed
     */

    private _showPointLabels: boolean = false;
    /**
     * defines whether the labels of the control points and point on the bezier curve should be displayed
     */
    public get showPointLabels(): boolean {
        return this._showPointLabels;
    }
    public set showPointLabels(value: boolean) {
        this._showPointLabels = value;
        this._controlPoints.forEach(v => v.showLabel = value);
    }

    private _showPointPositions: boolean = false;
    public get showPointPositions(): boolean {
        return this._showPointPositions;
    }
    public set showPointPositions(value: boolean) {
        this._showPointPositions = value;
        this._controlPoints.forEach(v => v.showPosition = value);
    }

    private _positionDisplayMode: PositionDisplayMode = "absolute";
    public get positionDisplayMode(): PositionDisplayMode {
        return this._positionDisplayMode;
    }
    public set positionDisplayMode(value: PositionDisplayMode) {
        this._positionDisplayMode = value;
        this._controlPoints.forEach(v => v.positionDisplayMode = value);
    }

    private controlPointColors: ControlPointColor[];


    private bezierCurve: BezierCurve;
    private deCasteljauVis: DeCasteljauVisualization;
    private controlsForT: ControlsForParameterT;

    public set t(newVal: number) {
        this._t = newVal;
        if (this._t > 1) this._t = 0;
        if (this.t < 0) this._t = 1;
        this.controlsForT.updateSlider();
    };

    public get t(): number {
        return this._t;
    }

    private _t: number = 0;

    constructor(private p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        this._basePointDiameter = p5.width * 0.015;
        this._baseLineWidth = p5.width * 0.0025;
        this.controlPointColors = this.initControlPointColors();
        this.showPointLabels = false;
        this.showPointPositions = false;
        this.positionDisplayMode = 'relative to canvas';

        this.bezierCurve = new BezierCurve(p5, this);
        this.deCasteljauVis = new DeCasteljauVisualization(p5, this);
        this.controlsForT = new ControlsForParameterT(p5, this, parentContainerId, baseAnimationSpeedMultiplier);
    }

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

            //we don't really need the bezier line or De Casteljau visualization if we have a single point
            if (this.controlPoints.length > 1) this.bezierCurve.draw();
            if (this.controlPoints.length > 1) this.deCasteljauVis.draw();

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

    handleCurveDegreeChange() {
        const numOfVertices = this.controlPoints.length;
        this._controlPoints.forEach((v, i) => v.label = `P_{${i}}`);
        this.deCasteljauVis.onlyDrawPointOnBezier = numOfVertices < 3;
        this.controlsForT.visible = numOfVertices > 1;
        this.notifyObservers('controlPointsChanged');
    }

    private observers: MyObserver<BezierDemoChange>[] = [];

    subscribe(observer: MyObserver<BezierDemoChange>): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: MyObserver<BezierDemoChange>): void {
        this.observers = this.observers.filter(o => o !== observer);
    }

    notifyObservers(change: BezierDemoChange): void {
        this.observers.forEach(o => o.update(change));
    }
}



class BezierCurve implements Drawable {
    //TODO: maybe make this settable from outside so that users can see how changes in evaluationSteps change smoothness of bezier curve?
    /**
     * Signifies on how many steps of t between 0 and 1 (inclusive) the bezier curve will be evaluated
     * The less steps the less smooth the curve becomes
     */
    private evaluationSteps: number;


    /**
     * range of numbers from 0 to 1 (inclusive) in steps of size 1/evaluationSteps https://stackoverflow.com/a/10050831
     */
    private zeroToOne: number[];

    private color: p5.Color;

    constructor(private p5: p5, private demo: BezierDemo) {
        this.evaluationSteps = 100;
        this.zeroToOne = [...Array(this.evaluationSteps + 1).keys()].map(num => num / this.evaluationSteps);
        this.color = p5.color(30);
    }

    public draw() {
        if (this.demo.controlPoints.length === 0 || this.demo.controlPoints.length === 1) return;
        const points = this.zeroToOne.map(t => this.findPointOnCurveWithDeCasteljau(this.demo.controlPoints.map(v => v.position), t));
        points.forEach((p, i) => {
            if (i === points.length - 1) return;
            drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2);
        });
    }

    private findPointOnCurveWithDeCasteljau(ctrlPtPositions: p5.Vector[], t: number): p5.Vector {
        if (ctrlPtPositions.length === 1) return ctrlPtPositions[0]
        let ctrlPtsForNextIter = ctrlPtPositions.slice(0, -1).map((v, i) => {
            const lerpCurrAndNextAtT = p5.Vector.lerp(v, ctrlPtPositions[i + 1], t) as unknown as p5.Vector;//again, fail in @types/p5???
            return lerpCurrAndNextAtT;
        });
        return this.findPointOnCurveWithDeCasteljau(ctrlPtsForNextIter, t);
    }
}



class DeCasteljauVisualization implements Drawable {
    //config for lines between control points and current point between them (dependent on current value of t) rendered onto them for visualization
    private color: p5.Color;
    private colorOfPointOnBezier: p5.Color;
    public onlyDrawPointOnBezier = false;

    constructor(private p5: p5, private bezierCurve: BezierDemo) {
        this.color = p5.color('#E1B000');
        this.colorOfPointOnBezier = p5.color(colors.errorColor);
    }

    public draw() {
        this.recursiveDraw(this.bezierCurve.controlPoints.map(v => v.position));
    }

    private recursiveDraw(ctrlPtPositions: p5.Vector[]) {
        if (ctrlPtPositions.length <= 1) {
            //this shouldn't normally be reached
            return;
        }

        const interpolatedPositionsOfAdjacentCtrlPts = ctrlPtPositions.slice(0, -1).map((v, i) => p5.Vector.lerp(v, ctrlPtPositions[i + 1], this.bezierCurve.t) as unknown as p5.Vector);//again, fail in @types/p5???

        interpolatedPositionsOfAdjacentCtrlPts.forEach((pos, i) => {
            if (!this.onlyDrawPointOnBezier) drawLineVector(this.p5, ctrlPtPositions[i], ctrlPtPositions[i + 1], this.color, this.bezierCurve.baseLineWidth);
            if (interpolatedPositionsOfAdjacentCtrlPts.length === 1) this.drawPointOnBezierCurve(interpolatedPositionsOfAdjacentCtrlPts[0]);
            else drawCircle(this.p5, pos, this.color, this.bezierCurve.basePointDiameter);
        });

        this.recursiveDraw(interpolatedPositionsOfAdjacentCtrlPts);
    }

    private drawPointOnBezierCurve(pos: p5.Vector) {
        const posX = pos.x;
        const posY = pos.y;

        drawCircle(this.p5, pos, this.colorOfPointOnBezier, this.bezierCurve.basePointDiameter * 1.5);
        const showLabel = this.bezierCurve.showPointLabels;
        const showPosition = this.bezierCurve.showPointPositions;
        const positionDisplayMode = this.bezierCurve.positionDisplayMode;
        if (showLabel || showPosition) {
            const label = `${showLabel ? 'C(t) ' : ''}${showPosition ? `${positionDisplayMode === 'absolute' ? `(${posX}, ${posY})` : `(${(posX / this.p5.width).toFixed(2)}, ${(posY / this.p5.height).toFixed(2)})`
                }` : ''}`;
            const labelPosX = posX + 10;
            const labelPosY = posY - 10;
            this.p5.push();
            this.p5.text(label, labelPosX, labelPosY);
            this.p5.pop();
        }
    }
}



class ControlsForParameterT {
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


    constructor(p5: p5, private demo: BezierDemo, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
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

        this.visible = false;


        this.fasterButton = p5.createButton('<span class="material-icons">fast_forward</span>');
        this.fasterButton.parent(this.controlsContainer);
        this.fasterButton.mouseClicked(() => this.fastForwardClicked());

        if (baseAnimationSpeedMultiplier) this.baseAnimationSpeedPerFrame *= baseAnimationSpeedMultiplier;
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