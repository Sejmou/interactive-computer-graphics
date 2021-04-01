import p5 from "p5";
import { Clickable, Draggable, Drawable, Touchable } from "./ui-interfaces";
import { clamp } from "./util";

//For some reason this is not defined in @types/p5...
//A touch point on the screen, relative to (0, 0) of the canvas
interface p5TouchPoint {
    x: number,
    y: number,
    id: number
}

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
        this.setFillColor();
        this.p5.circle(this.position.x, this.position.y, 2 * this.radius);
        this.p5.fill(0);
        if (this.showLabel) {
            this.p5.text(
                `${this.label ? this.label + ' ' : ''}(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`,
                this.position.x + 5, this.position.y - 5
            );
        }
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

    //!= null/undefined if user drags vertex on touch device
    private touchPointID?: number | null;

    constructor(p5: p5, position: p5.Vector, label: string = '', color: p5.Color = p5.color(255), public activeColor?: p5.Color,
        public baseRadius: number = 5, stroke: boolean = true, showLabel: boolean = true, public activeRadiusMultiplier = 1.5, public radiusForTouchDrag = 15) {
        super(p5, position, label, color, baseRadius, stroke, showLabel);
    }

    public handleMousePressed() {
        if (this.hovering) this._dragging = true;
    }

    private mouseHoveringOver(): boolean {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (this.touchPointID != null) return false;
        const vertexToMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return vertexToMouse <= this.radius;
    }

    handleTouchStarted(): void {
        this.checkForTap();
    }

    private checkForTap() {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (touches.length === 0) {
            console.warn('touches was unexpectedly empty');
            return;
        }
        const touchesAndDistancesToVertex = touches.map(t => ({ ...t, distance: this.p5.dist(this.x, this.y, t.x, t.y) }));
        const nearestTouch = touchesAndDistancesToVertex.reduce((prev, curr) => curr.distance < prev.distance ? curr : prev);
        if (nearestTouch.distance <= 20) {//"touch tolerance" should generally be bigger on touch devices (compared to mouse cursor)
            this._dragging = true;
            this.touchPointID = nearestTouch.id;
        };
    }

    public handleReleased() {
        this._dragging = false;
        this.touchPointID = null;
    }

    draw(): void {
        this._hovering = this.mouseHoveringOver();

        if (this.touchPointID != null) this.radius = this.radiusForTouchDrag;
        else if (this._hovering || this.dragging) this.radius = this.baseRadius * this.activeRadiusMultiplier;
        else this.radius = this.baseRadius;

        if (this.dragging) this.updatePos();
        super.draw();
    }

    protected setFillColor() {
        if (this.activeColor && (this.dragging || this.hovering)) this.p5.fill(this.activeColor);
        else this.p5.fill(this.color);
    }

    updatePos() {
        if (this.touchPointID) {
            const touchPoint = (this.p5.touches as p5TouchPoint[]).find(t => t.id === this.touchPointID);
            if (touchPoint) {
                this.position.x = touchPoint.x;
                this.position.y = touchPoint.y;
            }
            else console.warn(`touchPoint with ID ${this.touchPointID} not found!`);
            return;
        }
        else {
            this.position.x = this.p5.mouseX;
            this.position.y = this.p5.mouseY;
        }

        //make sure we never leave the canvas
        this.position.x = clamp(this.x, 0, this.p5.width);
        this.position.y = clamp(this.y, 0, this.p5.height);
    }
}