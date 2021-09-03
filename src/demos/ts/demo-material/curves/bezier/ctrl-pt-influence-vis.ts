import p5 from "p5";
import { Clickable, Draggable, Drawable, MyObserver, Touchable } from '../../../utils/ui';
import { lightenDarkenP5Color } from "../../../utils/color";
import { drawLineXYCoords, p5TouchPoint } from "../../../utils/p5";
import { BernsteinPolynomialVisualization, BernsteinPolynomialChange, BernsteinPolynomialData } from './bernstein-influence-vis';



export class ControlPointInfluenceVisualization implements Drawable, MyObserver<BernsteinPolynomialChange>, Draggable, Touchable, Clickable {
    private barBorderColor: p5.Color;
    private barHeight = 60;
    private barWidth = 30;
    private borderThickness = 5;

    private influenceBars: ControlPointInfluenceBar[] = [];

    constructor(private p5: p5, private bernsteinVis: BernsteinPolynomialVisualization) {
        this.updateInfluenceBars();
        this.barBorderColor = p5.color(120);
        bernsteinVis.subscribe(this);
    }

    update(data: BernsteinPolynomialChange): void {
        if (data === 'bernsteinPolynomialsChanged') {
            this.updateInfluenceBars();
        }
    }

    private updateInfluenceBars() {
        this.influenceBars = this.bernsteinVis.bernsteinPolynomialDataPoints.map(d => new ControlPointInfluenceBar(this.p5, d, this.bernsteinVis));
    }

    draw(): void {
        this.influenceBars.forEach(b => b.draw());

        //draw summary bar
        this.p5.push();
        this.p5.noStroke();
        this.p5.rectMode(this.p5.CORNER);
        const summaryBarX = this.p5.width - this.barWidth - 2 * this.borderThickness;
        const summaryBarY = this.p5.height - this.barHeight - 2 * this.borderThickness;
        this.p5.fill(this.barBorderColor);
        this.p5.rect(summaryBarX, summaryBarY, this.barWidth + this.borderThickness, this.barHeight + this.borderThickness);
        let yOffset = 0;
        this.bernsteinVis.bernsteinPolynomialDataPoints.forEach((d, i) => {
            const fillHeight = d.bernsteinPolynomialFunction(this.bernsteinVis.t) * (this.barHeight - this.borderThickness);
            this.p5.fill(d.controlPoint.color);
            this.p5.rect(summaryBarX + this.borderThickness, summaryBarY + this.borderThickness + yOffset, this.barWidth - this.borderThickness, fillHeight);
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
 * data used for initial configuration of influence bar
 */
interface InfluenceBarConfig {
    height: number;
    width: number;
    borderColor: p5.Color;
    borderThickness: number;
}
class ControlPointInfluenceBar implements Drawable, Draggable, Touchable, Clickable {
    public data: BernsteinPolynomialData;
    private borderColor: p5.Color = this.p5.color(120);
    private height: number = 60;
    private width: number = 30;
    private borderThickness: number = 5;
    private fillBackgroundColor: p5.Color;

    private offsetFromCtrlPtPosX: number;
    private offsetFromCtrlPtPosY: number;

    private get x(): number {
        return this.data.controlPoint.x + this.offsetFromCtrlPtPosX;
    }

    private get y(): number {
        return this.data.controlPoint.y + this.offsetFromCtrlPtPosY;
    }

    /**
     * defined if user is dragging bar on touch screen
     */
    private touchPointID?: number;

    constructor(private p5: p5, data: BernsteinPolynomialData, private bernsteinVis: BernsteinPolynomialVisualization, config?: InfluenceBarConfig) {
        this.data = data;

        if (config) {
            if (config.borderColor)
                this.borderColor = config.borderColor;
            if (config.borderThickness)
                this.borderThickness = config.borderThickness;
            if (config.height)
                this.height = config.height;
            if (config.width)
                this.width = config.width;
        }

        this.fillBackgroundColor = p5.color(lightenDarkenP5Color(this.p5, this.borderColor, 20));

        this.offsetFromCtrlPtPosX = -this.width * 1.25;
        this.offsetFromCtrlPtPosY = this.width / 2;
    }

    draw(): void {
        if (this.dragging) {
            this.updatePos();
            drawLineXYCoords(this.p5, this.x, this.y, this.data.controlPoint.x, this.data.controlPoint.y, this.data.controlPoint.color, 1);
        }

        const c = this.data.controlPoint;
        const ctrlPtInfluence = this.data.bernsteinPolynomialFunction(this.bernsteinVis.t);
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
                this.offsetFromCtrlPtPosX = touchPoint.x - this.dragPtOffsetX - ctrlPt.x;
                this.offsetFromCtrlPtPosY = touchPoint.y - this.dragPtOffsetY - ctrlPt.y;
            }
            else
                console.warn(`touchPoint with ID ${this.touchPointID} not found!`);
        }
        else {
            this.offsetFromCtrlPtPosX = this.p5.mouseX - this.dragPtOffsetX - ctrlPt.x;
            this.offsetFromCtrlPtPosY = this.p5.mouseY - this.dragPtOffsetY - ctrlPt.y;
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
