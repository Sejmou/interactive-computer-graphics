import p5 from "p5";
import { Touchable, Drawable, Draggable, Clickable } from './ui-interfaces';
import { indexToLowercaseLetter } from "./util";
import { DragVertex } from "./vertex";

export class Polygon implements Drawable {
    //TODO: swap vertexPositions with actual vertices (Vertex class)
    constructor(protected p5: p5, private vertexPositions: p5.Vector[], public color: p5.Color = p5.color(255), public stroke: boolean = false) { }

    draw(): void {
        this.p5.push();
        if (!this.stroke) this.p5.noStroke();
        this.p5.fill(this.color);
        this.p5.beginShape();
        this.vertexPositions.forEach(pos => this.p5.vertex(pos.x, pos.y));
        this.p5.endShape(this.p5.CLOSE);
        this.p5.pop();
    }
}

export class DragPolygon extends Polygon implements Draggable, Clickable, Touchable {
    public vertices: DragVertex[];

    public get hovering(): boolean {
        return this.vertices.some(v => v.hovering);
    };

    public get dragging(): boolean {
        return this.vertices.some(v => v.dragging);
    };

    constructor(p5: p5, vertexPositions: p5.Vector[], color: p5.Color = p5.color(255), stroke: boolean = false) {
        super(p5, vertexPositions, color, stroke);
        this.vertices = vertexPositions.map((pos, i) => new DragVertex(p5, pos, indexToLowercaseLetter(i)));
    }

    public drawVertices() {
        this.vertices.forEach(v => v.draw());
    }

    handleMousePressed(): void {
        for (let i = 0; i < this.vertices.length; i++) {
            let v = this.vertices[i];
            v.handleMousePressed();//after this call v.dragging might be true!

            //we don't want several vertices to be dragged at the same time
            //this causes buggy behavior (we can't separate vertices anymore if they are stacked on top of each other)
            //therefore we break out of this loop as soon as one vertex is being dragged
            if (v.dragging) break;
        }
    }

    handleMouseReleased(): void {
        this.vertices.forEach(v => v.handleMouseReleased());
    }

    handleTouchStarted(): void {
        this.vertices.forEach(v => v.handleTouchStarted());
    }

    handleTouchReleased(): void {
        this.vertices.forEach(v => v.handleTouchReleased());
    }
}