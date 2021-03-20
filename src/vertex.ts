import p5 from "p5";
import { Clickable, Draggable, Drawable } from "./app";

export class Vertex implements Drawable {
    public get x() {
        return this.position.x;
    }

    public get y() {
        return this.position.y;
    }

    constructor(protected p5: p5, public position: p5.Vector, protected label: string = '',
        public color: p5.Color = p5.color(255), protected radius: number = 5, private stroke: boolean = true, private showLabel: boolean = true) { }

    draw(): void {
        this.p5.push();
        if (!this.stroke) this.p5.noStroke();
        if (this.showLabel) {
            this.p5.text(
                `${this.label ? this.label + ' ' : ''}(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`,
                this.position.x + 5, this.position.y - 5
            );
        }
        this.setFillColor();
        this.p5.circle(this.position.x, this.position.y, 2 * this.radius);
        this.p5.pop();
    }

    //can be overridden in inheriting classes (e.g. to change color depending on state)
    protected setFillColor(): void {
        this.p5.fill(this.color);
    }
}

export class DragVertex extends Vertex implements Draggable, Clickable {
    public get hovering(): boolean {
        const distVertexMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return distVertexMouse <= this.radius;
    }

    public get dragging(): boolean {
        return this._dragging;
    }

    private _dragging = false;

    constructor(p5: p5, position: p5.Vector, label: string = '', color: p5.Color = p5.color(255), private activeColor?: p5.Color,
        radius: number = 5, stroke: boolean = true, showLabel: boolean = true) {
        super(p5, position, label, color, radius, stroke, showLabel);
    }

    draw(): void {
        if (this.dragging) this.updatePos();
        super.draw();
    }

    protected setFillColor() {
        if (this.activeColor && (this.dragging || this.hovering)) this.p5.fill(this.activeColor);
        else this.p5.fill(this.color);
    } 

    updatePos() {
        this.position.x = this.p5.mouseX;
        this.position.y = this.p5.mouseY;
    }

    public handleMousePressed() {
        if (this.hovering) this._dragging = true;
    }

    public handleMouseReleased() {
        this._dragging = false;
    }

    public handleMouseMoved() { }
}