import p5 from 'p5';
import { Touchable, Draggable, Drawable, Container } from './ui-interfaces';
import { DragVertex } from './vertex';
import { drawLine, drawLineAndPointBetweenAtT, lightenDarkenColor, lightenDarkenP5Color, p5TouchPoint } from './util'


export class BezierCurve implements Drawable, Touchable, Draggable, Container<DragVertex> {
    private static animationSpeedMultipliers = [-4, -2, -1.5, -1, -0.5, -0.25, -0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 4];

    //create range of numbers from 0 to 1 (inclusive) in 0.02 steps https://stackoverflow.com/a/10050831
    private static readonly zeroToOne = [...Array(51).keys()].map(num => num / 50);

    private pointDiameter: number;

    private controlVertices: DragVertex[];
    private controlVertexColor: p5.Color;

    //config for lines between control points and current point between them (dependent on current value of t) rendered onto them for visualization
    private controlPolygonLineWidth: number;
    private controlPolygonLineColor: p5.Color;
    private controlPolygonLinePointAtTColor: p5.Color;

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
        this.pointDiameter = p5.width * 0.015;
        this.controlPolygonLinePointAtTColor = p5.color('#E1B000');
        this.colorOfPointOnBezier = p5.color('#C64821');

        this.bezierCurveColor = p5.color(30);
        this.bezierCurveWidth = this.controlPolygonLineWidth * 2;

        this.controlVertexColor = p5.color('#2AB7A9');

        this.controlVertices = [
            new DragVertex(p5, p5.createVector(x, y + h), 'anchor', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.pointDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x - shift, y), 'bezier control point 1', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.pointDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x + w - shift, y), 'bezier control point 2', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.pointDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x + w, y + h), 'bezier anchor', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.pointDiameter / 2, false, false)
        ];

        this.controlVertices.forEach(v => v.assign(this));

        this.curveDegreeTextContainer = p5.createDiv(`Curve degree: ${this.controlVertices.length}`);
        this.curveDegreeTextContainer.parent(divAboveCanvas);


        const div = p5.createDiv();
        div.parent(parentContainerId);
        div.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select');


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
        if (this.controlVertices.length === 0) {
            this.addVertexAtMousePos();
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

    private addVertexAtMousePos() {
        this.controlVertices = [ ...this.controlVertices, this.createVertexWithPos(this.p5.mouseX, this.p5.mouseY) ];
        this.updateCurveDegreeText();
    }

    handleMouseReleased(): void {
        this.controlVertices.forEach(v => v.handleMouseReleased());
    }

    handleTouchStarted(): void {
        if (this.controlVertices.length === 0) {
            this.addVertexAtFirstTouchPoint();
            return;
        }
        this.controlVertices.forEach(v => v.handleTouchStarted());
    }

    private addVertexAtFirstTouchPoint() {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (touches.length === 0) {
            console.warn('touches was unexpectedly empty');
            return;
        }
        this.controlVertices = [...this.controlVertices, this.createVertexWithPos(touches[0].x, touches[0].y)];
        this.updateCurveDegreeText();
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
            if (this.animationRunning) this.t += (0.005 * BezierCurve.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]);
            else this.t = +this.slider.value();

            this.drawBezierLine();
            this.drawDeCasteljauVisualization(this.controlVertices.map(v => v.position));

            this.drawControlVertices();
        } else {
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text('Click or touch anywhere on the canvas to add a vertex', this.p5.width / 2, this.p5.height / 2);
            this.p5.pop();
        }
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
            this.p5.circle(controlVertexPositions[0].x, controlVertexPositions[0].y, this.pointDiameter * 1.5);
            this.p5.pop();
            return;
        }
        let controlVerticesForNextIteration: p5.Vector[] = [];
        controlVertexPositions.forEach((v, i) => {
            if (i === controlVertexPositions.length - 1) return;
            const pointBetweenCurrAndNext = drawLineAndPointBetweenAtT(
                this.p5, v, controlVertexPositions[i + 1], this.t, this.controlPolygonLineWidth, this.controlPolygonLineColor, this.pointDiameter, this.controlPolygonLinePointAtTColor
            );
            controlVerticesForNextIteration.push(pointBetweenCurrAndNext);
        });
        this.drawDeCasteljauVisualization(controlVerticesForNextIteration);
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
        this.controlVertices.splice(i + 1, 0, this.createVertexWithPos(element.x + 10, element.y));
        this.updateCurveDegreeText();
    }

    private createVertexWithPos(x: number, y: number): DragVertex {
        const vertex = new DragVertex(this.p5, this.p5.createVector(x, y));
        vertex.label = 'new point!';
        vertex.color = this.controlVertexColor;
        vertex.activeColor = lightenDarkenP5Color(this.p5, this.controlVertexColor, -20);
        vertex.baseRadius = this.pointDiameter / 2;
        vertex.stroke = false;
        vertex.showLabel = false;
        vertex.assign(this);
        return vertex;
    }

    remove(element: DragVertex): void {
        this.controlVertices = this.controlVertices.filter(v => v !== element);
        this.updateCurveDegreeText();
    }

    updateCurveDegreeText() {
        this.curveDegreeTextContainer.html(`Curve degree: ${this.controlVertices.length}`);
    }
}