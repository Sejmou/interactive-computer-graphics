import p5 from 'p5';
import { Touchable, Draggable, Drawable, Container, Clickable, MyObservable, MyObserver } from './ui-interfaces';
import { DragVertex } from './vertex';
import { drawCircle, drawLineVector, indexToLowercaseLetter, lightenDarkenP5Color, p5TouchPoint } from './util';
import colors from '../../global-styles/color_exports.scss';

export type BezierDemoChange = 'controlVerticesChanged';

//TODO: add curveDegreeTextContainer back
// this.curveDegreeTextContainer.html(`Number of control vertices: ${numOfVertices}`);

export class BezierDemo implements Drawable, Touchable, Draggable, Clickable, Container<DragVertex>, MyObservable<BezierDemoChange> {
    private _basePointDiameter: number;

    public get basePointDiameter(): number {
        return this._basePointDiameter;
    }

    private _baseLineWidth: number;
    public get baseLineWidth(): number {
        return this._baseLineWidth;
    }

    private _controlVertices: DragVertex[] = [];
    //others should only be able to read data from vertices, but not change them directly
    public get controlVertices(): Readonly<DragVertex>[] {
        return this._controlVertices;
    }

    private controlVertexColor: p5.Color;

    private _showVertexLabels: boolean = false;
    public get showVertexLabels(): boolean {
        return this._showVertexLabels;
    }
    public set showVertexLabels(value: boolean) {
        this._showVertexLabels = value;
        this._controlVertices.forEach(v => v.showLabel = value);
    }


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

    constructor(private p5: p5, parentContainerId?: string) {
        this._basePointDiameter = p5.width * 0.015;
        this._baseLineWidth = p5.width * 0.0025;
        this.controlVertexColor = p5.color(colors.primaryColor);

        this.bezierCurve = new BezierCurve(p5, this);
        this.deCasteljauVis = new DeCasteljauVisualization(p5, this);
        this.controlsForT = new ControlsForParameterT(p5, this, parentContainerId);
    }

    handleMousePressed(): void {
        if (this.controlVertices.length === 0) {
            const newVertex = this.addVertexAtPos(this.p5.mouseX, this.p5.mouseY);
            //we want to allow the user to drag the added vertex immediately, therefore we call handleTouchStarted() on it
            newVertex.handleMousePressed();
            return;
        }

        //operating on a copy of the array as vertices might get added or removed while iterating over the array
        //this could potentially lead to a lot of confusing/unpredictable behavior
        //e.g. handleMousePressed() could get called infinitely on the same vertex, or not get called on some vertices, or on newly added vertices (which were not actuall clicked on of course) 
        const vertices = this.controlVertices.slice();
        for (let i = 0; i < vertices.length; i++) {
            let v = vertices[i];
            v.handleMousePressed();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one vertex is being dragged
            if (v.dragging) break;
        }
    }

    addVertexAtPos(x: number, y: number): DragVertex {
        const newVertex = this.createVertexWithPos(x, y);
        this._controlVertices = [...this._controlVertices, newVertex];
        newVertex.label = indexToLowercaseLetter(this._controlVertices.findIndex(v => v === newVertex));
        this.handleCurveDegreeChange();
        return newVertex;
    }

    handleMouseReleased(): void {
        this.controlVertices.forEach(v => v.handleMouseReleased());
    }

    handleTouchStarted(): void {
        if (this.controlVertices.length === 0) {
            const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?

            if (touches.length === 0) {
                console.warn('touches was unexpectedly empty');
            } else {
                const newVertex = this.addVertexAtPos(touches[0].x, touches[0].y);
                //we want to allow the user to drag the added vertex immediately, therefore we call handleTouchStarted() on it
                newVertex.handleTouchStarted();
            }
            return;
        }

        //operating on a copy of the array as vertices might get added or removed while iterating over the array
        //this could potentially lead to a lot of confusing/unpredictable behavior
        const vertices = this.controlVertices.slice();
        for (let i = 0; i < vertices.length; i++) {
            let v = vertices[i];
            v.handleTouchStarted();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one vertex is being dragged
            if (v.dragging) break;
        }
    }

    handleTouchReleased(): void {
        this.controlVertices.forEach(v => v.handleTouchReleased());
    }

    public get hovering(): boolean {
        return this.controlVertices.some(v => v.hovering);
    };

    public get dragging(): boolean {
        return this.controlVertices.some(v => v.dragging);
    };

    draw(): void {
        if (this.controlVertices.length > 0) {
            this.controlsForT.updateT();

            //we don't really need the bezier line or De Casteljau visualization if we have a single point
            if (this.controlVertices.length > 1) this.bezierCurve.draw();
            if (this.controlVertices.length > 1) this.deCasteljauVis.draw();

            this.drawControlVertices();
        } else {
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text('Click or touch anywhere on the canvas to add a vertex', this.p5.width / 2, this.p5.height / 2);
            this.p5.pop();
        }
    }

    private drawControlVertices() {
        this.controlVertices.forEach(v => v.draw());
    }

    addElementAfter(element: DragVertex): void {
        const i = this.controlVertices.findIndex(e => e === element);
        if (i === -1) {
            console.warn('could not find provided element in control vertices of bezier, cancelling adding...');
            return;
        }

        //add vertex at point where user clicked on or touched add button
        const touches = this.p5.touches as p5TouchPoint[];
        const touchInteraction = touches.length > 0;
        const x = touchInteraction ? touches[0].x : this.p5.mouseX;
        const y = touchInteraction ? touches[0].y : this.p5.mouseY;
        const newVertex = this.createVertexWithPos(x, y);

        this.controlVertices.splice(i + 1, 0, newVertex);
        if (touchInteraction) newVertex.handleTouchStarted();
        else newVertex.handleMousePressed();

        this.handleCurveDegreeChange();
    }

    private createVertexWithPos(x: number, y: number): DragVertex {
        const vertex = new DragVertex(this.p5, this.p5.createVector(x, y));
        vertex.color = this.controlVertexColor;
        vertex.activeColor = lightenDarkenP5Color(this.p5, this.controlVertexColor, -20);
        vertex.baseRadius = this.basePointDiameter / 2;
        vertex.stroke = false;
        vertex.showLabel = this._showVertexLabels;
        vertex.editable = true;
        vertex.assign(this);
        return vertex;
    }

    remove(element: DragVertex): void {
        this._controlVertices = this._controlVertices.filter(v => v !== element);
        this.handleCurveDegreeChange();
    }

    handleCurveDegreeChange() {
        const numOfVertices = this.controlVertices.length;
        this._controlVertices.forEach((v, i) => v.label = `${indexToLowercaseLetter(i)}`);
        this.deCasteljauVis.onlyDrawPointOnBezier = numOfVertices < 3;
        this.controlsForT.visible = numOfVertices > 1;
        this.notifyObservers('controlVerticesChanged');
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
        if (this.demo.controlVertices.length === 0 || this.demo.controlVertices.length === 1) return;
        const points = this.zeroToOne.map(t => this.findPointOnCurveWithDeCasteljau(this.demo.controlVertices.map(v => v.position), t));
        points.forEach((p, i) => {
            if (i === points.length - 1) return;
            drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2);
        });
    }

    private findPointOnCurveWithDeCasteljau(controlVertexPositions: p5.Vector[], t: number): p5.Vector {
        if (controlVertexPositions.length === 1) return controlVertexPositions[0]
        let controlVerticesForNextIteration: p5.Vector[] = [];
        controlVertexPositions.forEach((v, i) => {
            if (i === controlVertexPositions.length - 1) return;
            const lerpCurrAndNextAtT = p5.Vector.lerp(v, controlVertexPositions[i + 1], t) as unknown as p5.Vector;//again, fail in @types/p5???
            controlVerticesForNextIteration.push(lerpCurrAndNextAtT);
        });
        return this.findPointOnCurveWithDeCasteljau(controlVerticesForNextIteration, t);
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
        this.recursiveDraw(this.bezierCurve.controlVertices.map(v => v.position));
    }

    private recursiveDraw(controlVertexPositions: p5.Vector[]) {
        if (controlVertexPositions.length === 0) return;
        if (controlVertexPositions.length === 1) {
            //draw point on bezier curve
            drawCircle(this.p5, controlVertexPositions[0], this.colorOfPointOnBezier, this.bezierCurve.basePointDiameter * 1.5);
            return;
        }
        let vertexPositionsForNextIteration: p5.Vector[] = [];
        controlVertexPositions.forEach((v, i) => {
            if (i === controlVertexPositions.length - 1) return;
            const posBetweenCurrAndNextAtT = p5.Vector.lerp(v, controlVertexPositions[i + 1], this.bezierCurve.t) as unknown as p5.Vector;//again, fail in @types/p5???
            if (!this.onlyDrawPointOnBezier) {
                drawLineVector(this.p5, v, controlVertexPositions[i + 1], this.color, this.bezierCurve.baseLineWidth);
                drawCircle(this.p5, posBetweenCurrAndNextAtT, this.color, this.bezierCurve.basePointDiameter);
            }
            vertexPositionsForNextIteration.push(posBetweenCurrAndNextAtT);
        });
        this.recursiveDraw(vertexPositionsForNextIteration);
    }
}



class ControlsForParameterT {
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


    constructor(p5: p5, private demo: BezierDemo, parentContainerId?: string) {
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
    }

    public updateT() {
        if (this.animationRunning) this.demo.t += (0.005 * ControlsForParameterT.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]);
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