import p5 from 'p5';
import { Clickable, Draggable, Drawable } from './app';
import { DragVertex } from './vertex';
import { drawLineAndDotBetween } from './util'

export class BezierCurve implements Drawable, Clickable, Draggable {
    private controlVertices: DragVertex[];

    //config for lines between control points and dots rendered onto them for visualization
    private lineWidth: number;
    private lineColor: p5.Color;
    private dotDiameter: number;
    private dotColor: p5.Color;
    private colorOfPointOnBezier: p5.Color;

    private t: number = 0;

    constructor(private p5: p5, w: number, h: number, shift: number, x: number, y: number) {
        this.lineWidth = p5.width * 0.0025;
        this.lineColor = p5.color('#E1B000');
        this.dotDiameter = p5.width * 0.015;
        this.dotColor = p5.color('#E1B000');
        this.colorOfPointOnBezier = p5.color('#c64821');

        this.controlVertices = [
            new DragVertex(p5, p5.createVector(x, y + h), 'anchor', p5.color(255, 0, 0), p5.color(150, 0, 0), this.dotDiameter / 2, false),
            new DragVertex(p5, p5.createVector(x - shift, y), 'bezier control point 1', p5.color(0, 255, 0), p5.color(0, 150, 0), this.dotDiameter / 2, false),
            new DragVertex(p5, p5.createVector(x + w - shift, y), 'bezier control point 2', p5.color(0, 255, 0), p5.color(0, 150, 0), this.dotDiameter / 2, false),
            new DragVertex(p5, p5.createVector(x + w, y + h), 'bezier anchor', p5.color(0, 0, 255), p5.color(0, 0, 150), this.dotDiameter / 2, false)
        ];
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

    handleMouseMoved(): void {
        this.controlVertices.forEach(v => v.handleMouseMoved());
    }

    public get hovering(): boolean {
        return this.controlVertices.some(v => v.hovering);
    };

    public get dragging(): boolean {
        return this.controlVertices.some(v => v.dragging);
    };

    draw(): void {
        const p5 = this.p5;
        p5.background(240);

        this.t = p5.frameCount % 100 / 100;

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