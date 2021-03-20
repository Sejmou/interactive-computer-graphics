import p5 from "p5";
import { Clickable, Drawable, Draggable } from './app';
import { indexToLowercaseLetter } from "./util";
import { DragVertex } from "./vertex";

export class Polygon implements Drawable {
    constructor(protected p5: p5, private vertexPositions: p5.Vector[]) { }

    draw(): void {
        this.p5.push();
        this.p5.beginShape();
        this.vertexPositions.forEach(pos => this.p5.vertex(pos.x, pos.y));
        this.p5.endShape(this.p5.CLOSE);
    }
}

export class DragPolygon extends Polygon implements Draggable, Clickable {
    public vertices: DragVertex[];

    public get hovering(): boolean {
        return this.vertices.some(v => v.hovering);
    };

    public get dragging(): boolean {
        return this.vertices.some(v => v.dragging);
    };

    constructor(p5: p5, vertexPositions: p5.Vector[]) {
        super(p5, vertexPositions);
        this.vertices = vertexPositions.map((pos, i) => new DragVertex(p5, pos, indexToLowercaseLetter(i)));
    }

    public drawVertices() {
        this.vertices.forEach(v => v.draw());
    }

    handleMouseMoved(): void {
        this.vertices.forEach(v => v.handleMouseMoved());
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
}