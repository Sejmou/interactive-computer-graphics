import p5 from "p5";
import { Clickable, Draggable, Drawable, Editable, Hoverable, PositionDisplayMode, Touchable } from "./sketch/sketch-content";
import { Container, ContainerElement } from "../interactivity/container";
import { Subject, Observer } from "../interactivity/observer-pattern";
import { clamp } from "../math";
import { p5TouchPoint, renderTextWithSubscript } from "./misc";
import colors from "../../../../global-styles/color_exports.scss";

type AddOrRemove = 'add' | 'remove';


export class Vertex implements Drawable {
    public get x() {
        return this.position.x;
    }

    public get y() {
        return this.position.y;
    }

    /**
     * x and y in range [0, 1]; a position of (0, 0) would mean top left corner of the canvas, (1, 1) means bottom right corner of canvas
     */
    public get positionRelativeToCanvas() {
        return this.p5.createVector(this.x / this.p5.width, this.y / this.p5.height);
    }

    /**
     * how the position should be displayed if showPosition is true
     */
    public positionDisplayMode: PositionDisplayMode = 'pixel coordinates';

    private labelBackgroundColor = this.p5.color(255, 255, 255, 190);

    constructor(protected p5: p5, public position: p5.Vector, public label: string = '',
        public color: p5.Color = p5.color(255), protected radius: number = 5, public stroke: boolean = true, public showLabel: boolean = true, public showPosition: boolean = false) { }

    draw(): void {
        this.p5.push();
        if (!this.stroke) this.p5.noStroke();
        this.setFillColor();
        this.p5.circle(this.position.x, this.position.y, 2 * this.radius);
        this.p5.fill(0);
        if (this.showLabel || this.showPosition) {
            const label = `${this.label && this.showLabel ? this.label + ' ' : ''}${this.showPosition ?
                this.positionDisplayMode === 'normalized coordinates' ? `(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`
                    : `(${(this.positionRelativeToCanvas.x).toFixed(2)}, ${(this.positionRelativeToCanvas.y).toFixed(2)})` : ''}`;
            const labelWidth = this.p5.textWidth(label);
            const labelPosX = this.position.x + 10;
            const labelPosY = this.position.y + 5;

            // draw background box to make label more readable if crossing line
            if (!this.showPosition) { // TODO: find reason why it looks wrong when using position too
                this.p5.push();
                this.p5.fill(this.labelBackgroundColor);
                this.p5.noStroke();
                this.p5.rectMode(this.p5.CENTER);
                this.p5.rect(labelPosX + labelWidth / 4, labelPosY + 2, labelWidth / 2 + 6, 20, 5);
                this.p5.pop();
            }

            if (label.includes('_')) {//use subscript
                renderTextWithSubscript(this.p5, label, labelPosX, labelPosY);
            } else {
                this.p5.text(label, labelPosX, labelPosY);
            }
        }
        this.p5.pop();
    }

    // can be overridden in inheriting classes (e.g. to change color depending on state)
    protected setFillColor(): void {
        this.p5.fill(this.color);
    }
}

export class DragVertex extends Vertex implements Draggable, Clickable, Touchable, Editable, ContainerElement<DragVertex>, Observer<AddOrRemove> {
    public get hovering(): boolean {
        return this.mouseHoveringOver();
    }


    public get dragging(): boolean {
        return this._dragging;
    }

    private _dragging = false;

    public editable = false;
    private editMode = false;

    /**
     * time (in ms) until edit mode is automatically deactivated (after last relevant interaction with vertex)
     */
    private editModeCoolDownPeriodLength = 1000;
    /**
     * set to current value of Date.now() in draw() (number of milliseconds elapsed since January 1, 1970) every time a relevant interaction with DragVertex happens
     */
    private lastInteractionTime = this.editModeCoolDownPeriodLength + 1;

    private editableAndInteractionInEditModeCooldownPeriod(): boolean {
        return this.editable && ((Date.now() - this.lastInteractionTime) < this.editModeCoolDownPeriodLength);
    }

    private checkForRelevantInteraction() {
        if (this.hovering || this.dragging || this.touchPointID || (this.editMode && (this.addButton.hovering || this.deleteButton.hovering))) {
            this.lastInteractionTime = Date.now();
        }
    }


    private addButton: ActionButton;
    private deleteButton: ActionButton;

    private container: Container<DragVertex> | undefined;

    /**
     * needed to fix problem where this.hovering was true despite the user having interacted via touch screen and not mouse cursor
     * p5 apparently automatically sets p5's mouseX and mouseY to touch position (if only one touch point is used)
     */
    private lastInteraction: 'touch' | 'cursor' | undefined;

    /**
     * != null/undefined if user drags vertex on touch device
     */
    private touchPointID?: number | null;
    /**
     * max. distance of touch point from center of vertex up until which touch will be registered
     */
    private maxDistForRegisteringTouch = 20;

    constructor(p5: p5, position: p5.Vector, label: string = '', color: p5.Color = p5.color(255), public activeColor?: p5.Color,
        public baseRadius: number = 5, stroke: boolean = true, showLabel: boolean = true, public activeRadiusMultiplier = 1.5, public radiusForTouchDrag = 15) {
        super(p5, position, label, color, baseRadius, stroke, showLabel);

        //make sure vertex isn't created outside the canvas
        this.position.x = clamp(this.x, 0, this.p5.width);
        this.position.y = clamp(this.y, 0, this.p5.height);

        this.addButton = new ActionButton(p5, p5.createVector(this.position.x - 10, this.position.y - 10), this.baseRadius);
        this.addButton.action = 'add';
        this.addButton.color = p5.color(colors.successColor);
        this.addButton.subscribe(this);

        this.deleteButton = new ActionButton(p5, p5.createVector(this.position.x + 10, this.position.y - 10), this.baseRadius);
        this.deleteButton.subscribe(this);
    }

    public handleMousePressed() {
        this.lastInteraction = 'cursor';
        if (this.editMode) {
            this.addButton.handleMousePressed();
            this.deleteButton.handleMousePressed();
        }
        if (this.hovering) this._dragging = true;
    }

    public handleMouseReleased() {
        this._dragging = false;
        this.touchPointID = null;
    }

    private mouseHoveringOver(): boolean {
        if (this.lastInteraction === 'touch') return false;
        const vertexToMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return vertexToMouse <= this.radius;
    }

    handleTouchStarted(): void {
        this.checkForTap();
        if (this.editMode) {
            this.addButton.handleTouchStarted();
            this.deleteButton.handleTouchStarted();
        }
        this.lastInteraction = 'touch';
    }

    handleTouchReleased(): void {
        this.touchPointID = null;
        this._dragging = false;
    }

    private checkForTap() {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (touches.length === 0) {
            console.warn('touches was unexpectedly empty');
            return;
        }
        const touchesAndDistancesToVertex = touches.map(t => ({ ...t, distance: this.p5.dist(this.x, this.y, t.x, t.y) }));
        const nearestTouch = touchesAndDistancesToVertex.reduce((prev, curr) => curr.distance < prev.distance ? curr : prev);
        if (nearestTouch.distance <= this.maxDistForRegisteringTouch) {//"touch tolerance" should generally be bigger on touch devices (compared to mouse cursor)
            this._dragging = true;
            this.touchPointID = nearestTouch.id;

        };
    }

    assignTo(container: Container<DragVertex>): void {
        this.container = container;
    }

    /**
     * called when either add or delete button is clicked
     */
    update(action: AddOrRemove): void {
        if (action == 'add') {
            this.container?.addElementAfter(this);
            this.lastInteractionTime = this.editModeCoolDownPeriodLength + 1;//trick to deactivate edit mode on dragVertex
        }
        if (action == 'remove') this.container?.remove(this);
    }

    draw(): void {
        this.editMode = this.editableAndInteractionInEditModeCooldownPeriod();

        if (this.touchPointID != null) this.radius = this.radiusForTouchDrag;
        else if (this.hovering || this.dragging) this.radius = this.baseRadius * this.activeRadiusMultiplier;
        else this.radius = this.baseRadius;

        if (this.dragging) this.updatePos();
        super.draw();

        if (this.editMode) {
            const distFromVertexCenter = this.lastInteraction === 'touch' ? this.maxDistForRegisteringTouch + 5 : 10;
            this.addButton.position.x = this.x - distFromVertexCenter;
            this.addButton.position.y = this.y - distFromVertexCenter;
            this.addButton.draw();
            this.deleteButton.position.x = this.x + distFromVertexCenter;
            this.deleteButton.position.y = this.y - distFromVertexCenter;
            this.deleteButton.draw();
        }

        this.checkForRelevantInteraction();
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


class ActionButton implements Drawable, Clickable, Touchable, Hoverable, Subject<AddOrRemove> {
    public get hovering() {
        return this.mouseHoveringOver();
    }

    private mouseHoveringOver(): boolean {
        if (this.lastInteraction === 'touch') return false;
        const vertexToMouse = this.p5.dist(this.position.x, this.position.y, this.p5.mouseX, this.p5.mouseY);
        return vertexToMouse <= this.baseRadius;
    };

    private observers: Observer<AddOrRemove>[] = [];

    private lastInteraction: 'touch' | 'cursor' | undefined;

    private currentRadius = 3;
    private hoverRadiusMultiplier = 1.5;

    /**
     * max. distance of touch point from center of button up until which touch will be registered
     */
    private maxDistForRegisteringTouch = 20;


    constructor(private p5: p5, public position: p5.Vector, public baseRadius = 3, public action: AddOrRemove = 'remove', public color: p5.Color = p5.color(colors.errorColor)) { }

    draw(): void {
        this.currentRadius = this.hovering ? this.baseRadius * this.hoverRadiusMultiplier : this.baseRadius;

        this.p5.push();
        this.p5.fill(this.color);
        this.p5.noStroke();
        this.p5.circle(this.position.x, this.position.y, this.currentRadius * 2);
        this.p5.stroke(255);

        const distToCircleBorder = this.currentRadius * 0.5;
        const left = this.position.x - this.currentRadius + distToCircleBorder;
        const right = this.position.x + this.currentRadius - distToCircleBorder;
        const top = this.position.y - this.currentRadius + distToCircleBorder;
        const bottom = this.position.y + this.currentRadius - distToCircleBorder;

        if (this.action === 'add') {
            //draw plus sign
            this.p5.line(this.position.x, top, this.position.x, bottom);
            this.p5.line(left, this.position.y, right, this.position.y);
        } else if (this.action === 'remove') {
            //draw cross
            this.p5.line(left, bottom, right, top);
            this.p5.line(left, top, right, bottom);
        }
        this.p5.pop();
    }

    handleMousePressed(): void {
        this.lastInteraction = 'cursor';
        if (this.hovering) this.notifyObservers();
    }

    handleTouchStarted(): void {
        this.lastInteraction = 'touch';
        if (this.tapped) this.notifyObservers();
    }

    handleMouseReleased(): void { }
    handleTouchReleased(): void { }

    subscribe(observer: Observer<AddOrRemove>): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: Observer<AddOrRemove>): void {
        this.observers = this.observers.filter(o => o !== observer);
    }

    notifyObservers(): void {
        this.observers.forEach(o => o.update(this.action));
    }

    //copied most of this method from DragVertex
    private get tapped() {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (touches.length === 0) {
            console.warn('touches was unexpectedly empty');
            return false;
        }
        const touchesAndDistancesToVertex = touches.map(t => ({ ...t, distance: this.p5.dist(this.position.x, this.position.y, t.x, t.y) }));
        const nearestTouch = touchesAndDistancesToVertex.reduce((prev, curr) => curr.distance < prev.distance ? curr : prev);
        return nearestTouch.distance <= this.maxDistForRegisteringTouch; //"touch tolerance" should generally be bigger on touch devices (compared to mouse cursor)
    }

}