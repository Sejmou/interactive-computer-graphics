import p5 from "p5";
import P5 from "p5";
import { Clickable, Drawable, Draggable } from './app';
import { indexToLowercaseLetter } from "./util";

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
        this.vertices.forEach(v => v.handleMousePressed());
    }

    handleMouseReleased(): void {
        this.vertices.forEach(v => v.handleMouseReleased());
    }
}

export class Vertex implements Drawable {
    public get x() {
        return this.position.x;
    }

    public get y() {
        return this.position.y;
    }

    constructor(protected p5: P5, public position: p5.Vector, protected label: string = '',
        public color: p5.Color = p5.color(255), protected radius: number = 5, private showLabel: boolean = true) { }

    draw(): void {
        this.p5.push();
        if (this.showLabel) {
            this.p5.text(
                `${this.label ? this.label + ' ' : ''}(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`,
                this.position.x + 5, this.position.y - 5
            );
        }
        this.p5.fill(this.color);
        this.p5.circle(this.position.x, this.position.y, 2 * this.radius);
        this.p5.pop();
    }
}

export class DragVertex extends Vertex implements Draggable, Clickable {
    public get hovering(): boolean {
        const distVertexMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return distVertexMouse <= this.radius;
    }

    public dragging: boolean = false;

    constructor(p5: P5, position: p5.Vector, label: string = '', color: p5.Color = p5.color(255)) {
        super(p5, position, label, color);
    }

    draw(): void {
        if (this.dragging) this.updatePos();
        super.draw();
    }

    updatePos() {
        this.position.x = this.p5.mouseX;
        this.position.y = this.p5.mouseY;
    }

    public handleMousePressed() {
        if (this.hovering) this.dragging = true;
    }

    public handleMouseReleased() {
        this.dragging = false;
    }

    public handleMouseMoved() {
        if (this.hovering) this.p5.cursor(this.p5.MOVE);
    }
}