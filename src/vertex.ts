import p5 from "p5";
import { Clickable, Draggable, Drawable } from "./ui-interfaces";

export class Vertex implements Drawable {
    public get x() {
        return this.position.x;
    }

    public get y() {
        return this.position.y;
    }

    constructor(protected p5: p5, public position: p5.Vector, protected label: string = '',
        public color: p5.Color = p5.color(255), protected radius: number = 5, public stroke: boolean = true, public showLabel: boolean = true) { }

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
        const _hovering = distVertexMouse <= this.radius;
        if (_hovering) this.radius = this.baseRadius * this.activeRadiusMultiplier;
        else this.radius = this.baseRadius;
        return _hovering;
    }

    public get dragging(): boolean {
        return this._dragging;
    }

    private _dragging = false;

    constructor(p5: p5, position: p5.Vector, label: string = '', color: p5.Color = p5.color(255), public activeColor?: p5.Color,
        public baseRadius: number = 5, stroke: boolean = true, showLabel: boolean = true, public activeRadiusMultiplier = 1.5) {
        super(p5, position, label, color, baseRadius, stroke, showLabel);
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

    public handlePressed() {
        if (this.hovering) this._dragging = true;
    }

    public handleReleased() {
        this._dragging = false;
    }

    //we don't really need to do anything here - position gets updated in draw() if necessary 
    public handleMoved() { }
}