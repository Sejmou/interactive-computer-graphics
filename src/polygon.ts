import p5 from "p5";
import P5 from "p5";
import { CanvasEventHandlers, Drawable } from './app';
import { indexToLowercaseLetter } from "./util";

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
    }

    drawVertices() {
        this.vertices.forEach(v => v.draw());
    }

    constructor(p5: p5, private canvasEventHandlers: CanvasEventHandlers, vertexPositions: p5.Vector[]) {
        super(p5, vertexPositions);
        this.vertices = vertexPositions.map((pos, i) => new DragVertex(p5, pos, indexToLowercaseLetter(i)));
        canvasEventHandlers.mousePressed.push(() => this.handleCanvasMousePressed());
        canvasEventHandlers.mouseReleased.push(() => this.handleCanvasMouseReleased());
        canvasEventHandlers.mouseMoved.push(() => this.handleCanvasMouseMoved());
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
        const distVertexMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return distVertexMouse <= this.dragCircleRadius;
    }

    public get x() {
        return this.position.x;
    }

    public get y() {
        return this.position.y;
    }

    public dragging: boolean = false;

    constructor(protected p5: P5, public position: p5.Vector, protected label: string = '', public color: p5.Color = p5.color(255)) {}

    draw(): void {
        if (this.dragging) this.updatePos();
        this.p5.push();
        this.p5.text(`${this.label? this.label + ' ': ''}(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`, this.position.x + 5, this.position.y - 5);
        this.p5.fill(this.color);
        this.p5.circle(this.position.x, this.position.y, 2 * this.dragCircleRadius);
        this.p5.pop();
    }

    updatePos() {
        this.position.x = this.p5.mouseX;
        this.position.y = this.p5.mouseY;
    }

}