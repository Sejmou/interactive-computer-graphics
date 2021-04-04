import p5 from 'p5';
import { Touchable, Draggable, Drawable, Editable, MyObserverForType } from './ui-interfaces';
import { DragVertex } from './vertex';
import { drawLine, drawLineAndDotBetween, lightenDarkenColor } from './util'


export class BezierCurve implements Drawable, Touchable, Draggable, Editable, MyObserverForType<DragVertex> {
    private static animationSpeedMultipliers = [-4, -2, -1.5, -1, -0.5, -0.25, -0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 4];

    //create range of numbers from 0 to 1 (inclusive) in 0.02 steps https://stackoverflow.com/a/10050831
    private static readonly zeroToOne = [...Array(51).keys()].map(num => num / 50);

    private controlVertices: DragVertex[];

    //config for lines between control points and dots rendered onto them for visualization
    private controlPolygonLineWidth: number;
    private controlPolygonLineColor: p5.Color;
    private dotDiameter: number;
    private dotColor: p5.Color;

    private bezierCurveColor: p5.Color;
    private bezierCurveWidth: number;
    private colorOfPointOnBezier: p5.Color;

    private set t(newVal: number) {
        this._t = newVal;
        if (this._t > 1) this._t = 0;
        if (this.t < 0) this._t = 1;
        this.sliderLabel.html(`t: ${this._t.toFixed(2)}`);
        this.slider.value(this._t);
    };

    private get t(): number {
        return this._t;
    }

    private _t: number = 0;

    private currAnimationSpeedMultiplierIndex = BezierCurve.animationSpeedMultipliers.findIndex(_ => _ === 1);

    private sliderLabel: p5.Element;
    private slider: p5.Element;
    private playPauseButton: p5.Element;
    private fasterButton: p5.Element;
    private slowerButton: p5.Element;

    private curveDegreeTextContainer: p5.Element;
    private editButton: p5.Element;

    public get editMode(): boolean {
        return this._editMode;
    };

    public set editMode(newVal: boolean) {
        this._editMode = newVal;
        this.editButton.html(this._editMode ? 'Done' : 'Edit vertices');
        this.controlVertices.forEach(v => v.editMode = this._editMode);
    }

    private _editMode = false;

    private set animationRunning(newVal: boolean) {
        this._animationRunning = newVal;
        if (this.animationRunning) this.playPauseButton.html('<span class="material-icons">pause</span>');
        else this.playPauseButton.html('<span class="material-icons">play_arrow</span>');
    }

    private get animationRunning(): boolean {
        return this._animationRunning;
    }
    private _animationRunning: boolean = false;

    constructor(private p5: p5, parentContainerId: string, divAboveCanvas: p5.Element, w: number, h: number, shift: number, x: number, y: number) {
        this.controlPolygonLineWidth = p5.width * 0.0025;
        this.controlPolygonLineColor = p5.color('#E1B000');
        this.dotDiameter = p5.width * 0.015;
        this.dotColor = p5.color('#E1B000');
        this.colorOfPointOnBezier = p5.color('#C64821');

        this.bezierCurveColor = p5.color(30);
        this.bezierCurveWidth = this.controlPolygonLineWidth * 2;

        this.controlVertices = [
            new DragVertex(p5, p5.createVector(x, y + h), 'anchor', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.dotDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x - shift, y), 'bezier control point 1', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.dotDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x + w - shift, y), 'bezier control point 2', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.dotDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x + w, y + h), 'bezier anchor', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.dotDiameter / 2, false, false)
        ];

        this.controlVertices.forEach(v => v.subscribe(this));

        this.editButton = p5.createButton('Edit vertices');
        this.editButton.parent(divAboveCanvas);
        this.editButton.mouseClicked(() => this.editMode = !this.editMode);

        this.curveDegreeTextContainer = p5.createDiv(`Curve degree: ${this.controlVertices.length}`);
        this.curveDegreeTextContainer.parent(divAboveCanvas);


        const div = p5.createDiv();
        div.parent(parentContainerId);
        div.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select');

        //trying to prevent selection of text in controls, especially on touch devices
        div.style('user-select', 'none');
        div.style('-webkit-user-select', 'none');
        div.style('-webkit-touch-callout', 'none');
        div.style('-webkit-user-select', 'none');
        div.style('-moz-user-select', 'none');
        div.style('-moz-touch-callout', 'none');
        div.style('-moz-user-select', 'none');
        div.style('-webkit-tap-highlight-color', 'rgba(255, 255, 255, 0)'); /* mobile webkit */


        this.sliderLabel = p5.createSpan(`t: ${this.t.toFixed(2)}`);
        this.sliderLabel.parent(div);

        this.slider = p5.createSlider(0, 1, 0, 0.00125);
        this.slider.parent(div);
        this.slider.style('flex-grow', '2');
        this.slider.mousePressed(() => this.animationRunning = false);

        this.slowerButton = p5.createButton('<span class="material-icons">fast_rewind</span>');
        this.slowerButton.parent(div);
        this.slowerButton.mouseClicked(() => this.rewindClicked());

        this.playPauseButton = p5.createButton('<span class="material-icons">play_arrow</span>');
        this.playPauseButton.parent(div);
        this.playPauseButton.mouseClicked(() => this.animationRunning = !this.animationRunning);


        this.fasterButton = p5.createButton('<span class="material-icons">fast_forward</span>');
        this.fasterButton.parent(div);
        this.fasterButton.mouseClicked(() => this.fastForwardClicked());
    }


    fastForwardClicked() {
        this.animationRunning = true;
        if (this.currAnimationSpeedMultiplierIndex < BezierCurve.animationSpeedMultipliers.length - 1) this.currAnimationSpeedMultiplierIndex++;
    }

    rewindClicked() {
        this.animationRunning = true;
        if (this.currAnimationSpeedMultiplierIndex > 0) this.currAnimationSpeedMultiplierIndex--;
    }

    handleMousePressed(): void {
        for (let i = 0; i < this.controlVertices.length; i++) {
            let v = this.controlVertices[i];
            v.handleMousePressed();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one vertex is being dragged
            if (v.dragging) break;
        }
    }

    handleMouseReleased(): void {
        this.controlVertices.forEach(v => v.handleMouseReleased());
    }

    handleTouchStarted(): void {
        this.controlVertices.forEach(v => v.handleTouchStarted());
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
        if (this.animationRunning) this.t += (0.005 * BezierCurve.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]);
        else this.t = +this.slider.value();

        this.drawBezierLine();
        this.drawDeCasteljauVisualization(this.controlVertices.map(v => v.position));

        this.drawControlVertices();
    }

    private drawBezierLine() {
        if (this.controlVertices.length === 0 || this.controlVertices.length === 1) return;
        const points = BezierCurve.zeroToOne.map(t => this.findPointOnCurveWithDeCasteljau(this.controlVertices.map(v => v.position), t));
        points.forEach((p, i) => {
            if (i === points.length - 1) return;
            drawLine(this.p5, p, points[i + 1], this.bezierCurveColor, this.bezierCurveWidth);
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

    private drawDeCasteljauVisualization(controlVertexPositions: p5.Vector[]) {
        if (controlVertexPositions.length === 0) return;
        if (controlVertexPositions.length === 1) {
            //draw point on bezier curve
            this.p5.push();
            this.p5.noStroke();
            this.p5.fill(this.colorOfPointOnBezier);
            this.p5.circle(controlVertexPositions[0].x, controlVertexPositions[0].y, this.dotDiameter * 1.5);
            this.p5.pop();
            return;
        }
        let controlVerticesForNextIteration: p5.Vector[] = [];
        controlVertexPositions.forEach((v, i) => {
            if (i === controlVertexPositions.length - 1) return;
            const pointBetweenCurrAndNext = drawLineAndDotBetween(
                this.p5, v, controlVertexPositions[i + 1], this.t, this.controlPolygonLineWidth, this.controlPolygonLineColor, this.dotDiameter, this.dotColor
            );
            controlVerticesForNextIteration.push(pointBetweenCurrAndNext);
        });
        this.drawDeCasteljauVisualization(controlVerticesForNextIteration);
    }

    private drawControlVertices() {
        this.controlVertices.forEach(v => v.draw());
    }

    //called by a DragVertex of this.controlVertices when its delete button has been clicked
    update(updatedVertex: DragVertex): void {
        this.controlVertices = this.controlVertices.filter(v => v !== updatedVertex);
    }
}