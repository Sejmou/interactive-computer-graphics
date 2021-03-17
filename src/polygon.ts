import p5 from "p5";
import P5 from "p5";
import { Drawable } from './app';

export class Polygon implements Drawable {
    constructor(protected p5: p5, private vertexPositions: p5.Vector[]) {}

    draw(): void {
        const p5 = this.p5;
        p5.push();

		p5.beginShape();
        this.vertexPositions.forEach(pos => p5.vertex(pos.x, pos.y));
        // p5.fill(0);
        p5.endShape(p5.CLOSE);
    }
}

export class DragPolygon extends Polygon {
    public vertices: DragVertex[];

    draw() {
        super.draw();
        this.vertices.forEach(v => v.draw());
    }

    constructor(p5: p5, private canvas: p5.Renderer, vertexPositions: p5.Vector[]) {
        super(p5, vertexPositions);
        this.vertices = vertexPositions.map(pos => new DragVertex(p5, pos));
        this.canvas.mousePressed(() => this.handleCanvasMousePressed());
        this.canvas.mouseReleased(() => this.handleCanvasMouseReleased());
        this.canvas.mouseMoved(() => this.handleCanvasMouseMoved());
    }

    private handleCanvasMousePressed() {
        this.vertices.forEach(v => {
            if (v.hovering) v.dragging = true;
        });
    }

    private handleCanvasMouseReleased() {
        this.vertices.forEach(v => v.dragging = false);
    }

    private handleCanvasMouseMoved() {
        if (this.vertices.some(v => v.hovering)) this.p5.cursor(this.p5.MOVE);
        else this.p5.cursor('default');
    }
}

export class DragVertex implements Drawable {
    private dragCircleRadius = 5;

    public get hovering(): boolean {
        const distVertexMouse = this.p5.dist(this.pos.x, this.pos.y, this.p5.mouseX, this.p5.mouseY);
        return distVertexMouse <= this.dragCircleRadius;
    }

    public get x() {
        return this.pos.x;
    }

    public get y() {
        return this.pos.y;
    }

    public dragging: boolean = false;

    constructor(protected p5: P5, protected pos: p5.Vector) {}

    draw(): void {
        if (this.dragging) this.updatePos();
        this.p5.circle(this.pos.x, this.pos.y, 2 * this.dragCircleRadius);
    }

    updatePos() {
        this.pos.x = this.p5.mouseX;
        this.pos.y = this.p5.mouseY;
    }

}