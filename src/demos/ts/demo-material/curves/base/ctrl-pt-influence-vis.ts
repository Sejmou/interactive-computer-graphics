import p5 from "p5";
import { Clickable, Draggable, Drawable, MyObserver, Touchable } from "../../../utils/ui";
import { lightenDarkenP5Color } from "../../../utils/color";
import { drawLineXYCoords, p5TouchPoint } from "../../../utils/p5";
import { DragVertex } from "../../../utils/vertex";
import { CurveDemo, DemoChange } from "./demo";



export interface ControlPointInfluenceData {
    controlPoint: DragVertex;
    currentCtrlPtInfluence: () => number;
}

export abstract class ControlPointInfluenceBarVisualization implements MyObserver<DemoChange>, Drawable, Draggable, Touchable, Clickable {
    private barBorderColor: p5.Color;
    private barHeight = 60;
    private barWidth = 30;
    private borderThickness = 5;

    private ctrlPtInfluenceDataPoints: ControlPointInfluenceData[] = [];
    private influenceBars: ControlPointInfluenceBar[] = [];

    constructor(private p5: p5, private demo: CurveDemo, public visible: boolean = true) {
        this.barBorderColor = p5.color(120);
        this.demo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data == 'ctrlPtInfluenceFunctionsChanged') this.updateInfluenceDataAndBars();
    }

    /**
     * Called when reacting to relevant demo changes that require an update of the ctrlPtInfluenceDataPoints
     */
    private updateInfluenceDataAndBars() {
        this.ctrlPtInfluenceDataPoints = this.getCurrentControlPointInfluenceDataPoints();
        //needed so that positions of influence bars don't reset if new vertices get added
        const ctrlPtsAndOffsetsOfInfluenceBars = this.influenceBars.map(b => ({ ctrlPt: b.assignedControlPoint, offsetX: b.offsetFromCtrlPtPosX, offsetY: b.offsetFromCtrlPtPosY }));
        this.influenceBars = this.ctrlPtInfluenceDataPoints.map(d => {
            const alreadyDisplayedCtrlPt = ctrlPtsAndOffsetsOfInfluenceBars.find(co => co.ctrlPt === d.controlPoint);
            if (alreadyDisplayedCtrlPt)
                return new ControlPointInfluenceBar(this.p5, d, { offsetFromCtrlPtPosX: alreadyDisplayedCtrlPt.offsetX, offsetFromCtrlPtPosY: alreadyDisplayedCtrlPt.offsetY });
            else
                return new ControlPointInfluenceBar(this.p5, d);
        });
    }

    protected abstract getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[];

    draw(): void {
        if (!this.demo.valid || !this.visible) return;
        this.influenceBars.forEach(b => b.draw());
        if (this.influenceBars.length > 1)
            this.drawSummaryBar();
    }

    /**
     * draws a single bar summarizing the influence each control point currently has (each control point gets a slice)
     */
    private drawSummaryBar() {
        this.p5.push();
        this.p5.noStroke();
        this.p5.rectMode(this.p5.CORNER);
        const summaryBarX = this.p5.width - this.barWidth - 2 * this.borderThickness;
        const summaryBarY = this.p5.height - this.barHeight - 2 * this.borderThickness;
        this.p5.fill(this.barBorderColor);
        this.p5.rect(summaryBarX, summaryBarY, this.barWidth + this.borderThickness, this.barHeight + this.borderThickness);
        let yOffset = 0;
        this.ctrlPtInfluenceDataPoints.forEach(d => {
            const fillHeight = d.currentCtrlPtInfluence() * (this.barHeight - this.borderThickness);
            this.p5.fill(d.controlPoint.color);
            this.p5.rect(summaryBarX + this.borderThickness, summaryBarY + this.barHeight - fillHeight - yOffset, this.barWidth - this.borderThickness, fillHeight);
            yOffset += fillHeight;
        });
        this.p5.pop();
    }

    get hovering(): boolean {
        return this.influenceBars.some(b => b.hovering);
    };

    get dragging(): boolean {
        return this.influenceBars.some(b => b.dragging);
    };

    handleTouchStarted(): void {
        const bars = this.influenceBars.slice();
        for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            b.handleTouchStarted(); //after this call v.dragging might be true!


            //dragging several things at once is not desired behavior, break out of the loop
            if (b.dragging)
                break;
        }
    }

    handleTouchReleased(): void {
        this.influenceBars.forEach(b => b.handleTouchReleased());
    }

    handleMousePressed(): void {
        const bars = this.influenceBars.slice();
        for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            b.handleMousePressed(); //after this call v.dragging might be true!


            //dragging several things at once is not desired behavior, break out of the loop
            if (b.dragging)
                break;
        }
    }

    handleMouseReleased(): void {
        this.influenceBars.forEach(b => b.handleMouseReleased());
    }
}
/**
 * parameters used for initial configuration of influence bar
 */
interface InfluenceBarConfig {
    offsetFromCtrlPtPosX?: number;
    offsetFromCtrlPtPosY?: number;
    height?: number;
    width?: number;
    borderColor?: p5.Color;
    borderThickness?: number;
}
class ControlPointInfluenceBar implements Drawable, Draggable, Touchable, Clickable {
    private borderColor: p5.Color = this.p5.color(120);
    private height: number = 60;
    private width: number = 30;
    private borderThickness: number = 5;
    private fillBackgroundColor: p5.Color;

    private _offsetFromCtrlPtPosX: number;
    public get offsetFromCtrlPtPosX() {
        return this._offsetFromCtrlPtPosX;
    }

    private _offsetFromCtrlPtPosY: number;
    public get offsetFromCtrlPtPosY() {
        return this._offsetFromCtrlPtPosY;
    }

    public get assignedControlPoint() {
        return this.data.controlPoint;
    }

    private get x(): number {
        return this.data.controlPoint.x + this._offsetFromCtrlPtPosX;
    }

    private get y(): number {
        return this.data.controlPoint.y + this._offsetFromCtrlPtPosY;
    }

    /**
     * defined if user is dragging bar on touch screen
     */
    private touchPointID?: number;

    constructor(private p5: p5, private data: ControlPointInfluenceData, config?: InfluenceBarConfig) {
        this._offsetFromCtrlPtPosX = -this.width * 1.25;
        this._offsetFromCtrlPtPosY = this.width / 2;
        this.fillBackgroundColor = p5.color(lightenDarkenP5Color(this.p5, this.borderColor, 20));

        if (config) {
            if (config.offsetFromCtrlPtPosX)
                this._offsetFromCtrlPtPosX = config.offsetFromCtrlPtPosX;
            if (config.offsetFromCtrlPtPosY)
                this._offsetFromCtrlPtPosY = config.offsetFromCtrlPtPosY;
            if (config.borderColor)
                this.borderColor = config.borderColor;
            if (config.borderThickness)
                this.borderThickness = config.borderThickness;
            if (config.height)
                this.height = config.height;
            if (config.width)
                this.width = config.width;
        }
    }

    draw(): void {
        if (this.dragging) {
            this.updatePos();
            drawLineXYCoords(this.p5, this.x, this.y, this.data.controlPoint.x, this.data.controlPoint.y, this.data.controlPoint.color, 1);
        }

        const c = this.data.controlPoint;
        const ctrlPtInfluence = this.data.currentCtrlPtInfluence();
        const maxFillHeight = this.height - this.borderThickness;
        const fillHeight = ctrlPtInfluence * maxFillHeight;

        this.p5.push();
        this.p5.noStroke();
        this.p5.rectMode(this.p5.CENTER);
        this.p5.fill(this.borderColor);
        this.p5.rect(this.x, this.y, this.width, this.height);
        this.p5.fill(this.fillBackgroundColor);
        this.p5.rect(this.x, this.y + (this.height - maxFillHeight) / 2 - this.borderThickness / 2, this.width - this.borderThickness, maxFillHeight);
        this.p5.fill(c.color);
        if (fillHeight == 0) {
            this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
            this.p5.text('no influence', this.x, this.y + this.height / 2 + this.borderThickness * 2);
        }
        else
            this.p5.rect(this.x, this.y + (this.height - fillHeight) / 2 - this.borderThickness / 2, this.width - this.borderThickness, fillHeight);
        this.p5.pop();
    }

    get hovering(): boolean {
        return this.dragging || this.checkPtInsideRect(this.p5.mouseX, this.p5.mouseY);
    };

    private _dragging = false;
    get dragging(): boolean {
        return this._dragging;
    };

    private updatePos() {
        const ctrlPt = this.data.controlPoint;
        if (this.touchPointID) {
            const touchPoint = (this.p5.touches as p5TouchPoint[]).find(t => t.id === this.touchPointID);
            if (touchPoint) {
                this._offsetFromCtrlPtPosX = touchPoint.x - this.dragPtOffsetX - ctrlPt.x;
                this._offsetFromCtrlPtPosY = touchPoint.y - this.dragPtOffsetY - ctrlPt.y;
            }
            else
                console.warn(`touchPoint with ID ${this.touchPointID} not found!`);
        }
        else {
            this._offsetFromCtrlPtPosX = this.p5.mouseX - this.dragPtOffsetX - ctrlPt.x;
            this._offsetFromCtrlPtPosY = this.p5.mouseY - this.dragPtOffsetY - ctrlPt.y;
        }
    }

    handleTouchStarted(): void {
        const touches = this.p5.touches as p5TouchPoint[]; // return type of p5.touches is certainly not just object[] - is this a mistake in @types/p5, again?
        if (touches.length === 0) {
            console.warn('touches was unexpectedly empty');
            return;
        }
        const ptInsideRect = touches.find(pt => this.checkPtInsideRect(pt.x, pt.y));
        if (ptInsideRect) {
            this.dragPtOffsetX = ptInsideRect.x - this.x;
            this.dragPtOffsetY = ptInsideRect.y - this.y;
            this._dragging = true;
        }
    }

    handleTouchReleased(): void {
        this._dragging = false;
    }

    handleMousePressed(): void {
        const x = this.p5.mouseX;
        const y = this.p5.mouseY;

        const cursorInsideRect = this.checkPtInsideRect(x, y);
        if (cursorInsideRect) {
            this.dragPtOffsetX = x - this.x;
            this.dragPtOffsetY = y - this.y;
            this._dragging = true;
        }
    }

    handleMouseReleased(): void {
        this._dragging = false;
    }

    private checkPtInsideRect(x: number, y: number): boolean {
        const rectLeft = this.x - this.width / 2;
        const rectRight = this.x + this.width / 2;
        const rectTop = this.y - this.height / 2;
        const rectBottom = this.y + this.height / 2;

        const inside = x >= rectLeft
            && x <= rectRight
            && y >= rectTop
            && y <= rectBottom;
        return inside;
    }

    private dragPtOffsetX = 0;
    private dragPtOffsetY = 0;
}
