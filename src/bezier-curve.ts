import p5 from 'p5';
import { Clickable, Draggable, Drawable } from './ui-interfaces';
import { DragVertex } from './vertex';
import { drawLineAndDotBetween, isCloseToZero, lightenDarkenColor } from './util'

export class BezierCurve implements Drawable, Clickable, Draggable {
    private controlVertices: DragVertex[];

    //config for lines between control points and dots rendered onto them for visualization
    private lineWidth: number;
    private lineColor: p5.Color;
    private dotDiameter: number;
    private dotColor: p5.Color;
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

    private tIncrement = 0.0075;

    private sliderLabel: p5.Element;
    private slider: p5.Element;
    private playPauseButton: p5.Element;
    private fasterButton: p5.Element;
    private slowerButton: p5.Element;

    private set animationRunning(newVal: boolean) {
        this._animationRunning = newVal;
        if (this.animationRunning) this.playPauseButton.html('<span class="material-icons">pause</span>');
        else this.playPauseButton.html('<span class="material-icons">play_arrow</span>');
    }

    private get animationRunning(): boolean {
        return this._animationRunning;
    }
    private _animationRunning: boolean;

    constructor(private p5: p5, parentContainerId: string, w: number, h: number, shift: number, x: number, y: number) {
        this.lineWidth = p5.width * 0.0025;
        this.lineColor = p5.color('#E1B000');
        this.dotDiameter = p5.width * 0.015;
        this.dotColor = p5.color('#E1B000');
        this.colorOfPointOnBezier = p5.color('#C64821');

        this.controlVertices = [
            new DragVertex(p5, p5.createVector(x, y + h), 'anchor', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)), this.dotDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x - shift, y), 'bezier control point 1', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)),  this.dotDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x + w - shift, y), 'bezier control point 2', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)),  this.dotDiameter / 2, false, false),
            new DragVertex(p5, p5.createVector(x + w, y + h), 'bezier anchor', p5.color('#2AB7A9'), p5.color(lightenDarkenColor('#2AB7A9', -20)),  this.dotDiameter / 2, false, false)
        ];

        const div = p5.createDiv();
        div.parent(parentContainerId);
        div.class('flex-row center-cross-axis');

        this.sliderLabel = p5.createSpan(`t: ${this.t.toFixed(2)}`);
        this.sliderLabel.parent(div);

        this.slider = p5.createSlider(0, 1, 0, 0.0025);
        this.slider.parent(div);
        this.slider.style('flex-grow', '2');
        this.slider.mousePressed(() => this.animationRunning = false);

        this.slowerButton = p5.createButton('-');
        this.slowerButton.parent(div);
        this.slowerButton.html('<span class="material-icons">fast_rewind</span>');
        this.slowerButton.mouseClicked(() => {
            this.animationRunning = true;
            this.tIncrement -= 0.0025;
            if (isCloseToZero(this.tIncrement)) this.tIncrement = -0.0025;
        });

        this.playPauseButton = p5.createButton('<span class="material-icons">play_arrow</span>');
        this.playPauseButton.parent(div);
        this.playPauseButton.mouseClicked(() => {
            this.animationRunning = !this.animationRunning;
        });

        this.fasterButton = p5.createButton('+');
        this.fasterButton.parent(div);
        this.fasterButton.html('<span class="material-icons">fast_forward</span>');
        this.fasterButton.mouseClicked(() => {
            this.animationRunning = true;
            this.tIncrement += 0.0025;
            if (isCloseToZero(this.tIncrement)) this.tIncrement = 0.0025;
        });

        this._animationRunning = false;
    }

    handlePressed(): void {
        for (let i = 0; i < this.controlVertices.length; i++) {
            let v = this.controlVertices[i];
            v.handlePressed();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one vertex is being dragged
            if (v.dragging) break;
        }
    }

    handleReleased(): void {
        this.controlVertices.forEach(v => v.handleReleased());
    }

    handleMoved(): void {
        this.controlVertices.forEach(v => v.handleMoved());
    }

    public get hovering(): boolean {
        return this.controlVertices.some(v => v.hovering);
    };

    public get dragging(): boolean {
        return this.controlVertices.some(v => v.dragging);
    };

    draw(): void {
        if (this.animationRunning) this.t = (this.t + this.tIncrement);
        else {
            this.t = +this.slider.value();
        }

        this.drawBezierLine();

        this.drawDeCasteljauVisualization();

        this.drawControlVertices();
    }

    private drawBezierLine() {
        this.p5.push();
        this.p5.strokeWeight(this.lineWidth * 2);
        this.p5.stroke(30);
        this.p5.noFill();
        this.p5.beginShape();
        //From p5 reference: The first time bezierVertex() is used within a beginShape() call,
        //  it must be prefaced with a call to vertex() to set the first anchor point
        this.p5.vertex(this.controlVertices[0].x, this.controlVertices[0].y);
        this.p5.bezierVertex(
            this.controlVertices[1].x, this.controlVertices[1].y,
            this.controlVertices[2].x, this.controlVertices[2].y,
            this.controlVertices[3].x, this.controlVertices[3].y
        );
        this.p5.endShape();
        this.p5.pop();
    }

    private drawDeCasteljauVisualization() {
        this.deCasteljau(this.controlVertices.map(v => v.position));
    }

    private deCasteljau(controlVertexPositions: p5.Vector[]) {
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
                this.p5, v, controlVertexPositions[i + 1], this.t, this.lineWidth, this.lineColor, this.dotDiameter, this.dotColor
            );
            controlVerticesForNextIteration.push(pointBetweenCurrAndNext);
        });
        this.deCasteljau(controlVerticesForNextIteration);
    }

    private drawControlVertices() {
        this.controlVertices.forEach(v => v.draw());
    }
}