import p5 from "p5";
import { Clickable, Draggable, Drawable, Touchable } from "./ui-interfaces";

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

    // can be overridden in inheriting classes (e.g. to change color depending on state)
    protected setFillColor(): void {
        this.p5.fill(this.color);
    }
}

export class DragVertex extends Vertex implements Draggable, Clickable, Touchable {
    public get hovering(): boolean {
        return this._hovering;
    }

    
    public get dragging(): boolean {
        return this._dragging;
    }
    
    private _hovering = false;
    private _dragging = false;

    constructor(p5: p5, position: p5.Vector, label: string = '', color: p5.Color = p5.color(255), public activeColor?: p5.Color,
        public baseRadius: number = 5, stroke: boolean = true, showLabel: boolean = true, public activeRadiusMultiplier = 1.5) {
        super(p5, position, label, color, baseRadius, stroke, showLabel);
    }

    public handleMousePressed() {
        if (this._hovering) this._dragging = true;
    }

    private mouseHoveringOver(): boolean {
        const vertexToMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return vertexToMouse <= this.radius;
    }

    handleTouchStarted(): void {
        this._dragging = this.tapped();
    }

    private tapped() {
        setTimeout(() => console.log((this.p5.touches as any[]).map(t => t.id)));
        const touches = this.p5.touches as any[]; // is this a mistake in @types/p5, again?
        // const distancesOfTouchesToVertex = touches.map(t => t.fasd)
        // const vertexToPointTouched = this.p5.dist(
        //     this.position.x, this.position.y,
        //     (this.p5.touches[0] as any).x, (this.p5.touches[0] as any).y // @types not returning proper type, again, urgh... 
        // );
        // return vertexToPointTouched <= (this.radius * 1.5);//more tolerance on touch devices
        return false;
    }

    public handleReleased() {
        this._dragging = false;
    }

    draw(): void {
        this._hovering = this.mouseHoveringOver();
        if (this._hovering || this.dragging) this.radius = this.baseRadius * this.activeRadiusMultiplier;
        else this.radius = this.baseRadius;
        if (this.dragging) this.updatePos();
        super.draw();
    }

    protected setFillColor() {
        if (this.activeColor && (this.dragging || this.hovering)) this.p5.fill(this.activeColor);
        else this.p5.fill(this.color);
    }

    updatePos() {
        if (this.p5.touches.length > 0 && this.hovering) { // user touched screen
            this.position.x = (this.p5.touches[0] as any).x; // @types not returning proper type, again, urgh...
            this.position.y = (this.p5.touches[0] as any).y;
        }
        else {
            this.position.x = this.p5.mouseX;
            this.position.y = this.p5.mouseY;
        }
    }
}