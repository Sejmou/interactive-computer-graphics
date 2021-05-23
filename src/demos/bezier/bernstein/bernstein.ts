import './bernstein.scss';
import p5 from "p5";
import { BezierDemo } from "../../ts/curves/bezier-curve";
import { Sketch } from '../../ts/sketch';
import { Clickable, Draggable, Drawable, MyObservable, MyObserver, Touchable } from '../../ts/ui-interfaces';
import { binomial, drawLineXYCoords, lightenDarkenP5Color, p5TouchPoint, renderTextWithSubscript } from '../../ts/util';
import colors from '../../../global-styles/color_exports.scss';
import { DragVertex } from '../../ts/vertex';
import { DemoChange } from '../../ts/curves/base-curve';


const demoContainerId = 'demo';

const descriptionId = 'demo-description'
const descriptionParagraph = document.getElementById(descriptionId);
if (descriptionParagraph) descriptionParagraph.innerHTML = String.raw`In math terms, a Bézier curve of degree \(n\) is expressed as \[ C(t) = \sum_{i=0}^{n}{b_{i,n}(t) \cdot P_{i}}. \]
Each \( b_{i,n}(t) \) is the <b>Bernstein polynomial</b> of \(P_i\), a particular control point of the Bézier curve. \( P_i \) is a 2D vector \( (x, y)\).<br>The Bernstein polynomial represents the 'influence' of the control point on the shape of the Bézier curve for the current value of \(t\).`;
MathJax.typeset([`#${descriptionId}`]);

//add container for bernstein polynomial visualization
const bernsteinGraphContainer = document.createElement('div');
const bernsteinGraphContainerId = 'bernstein-visualization';
bernsteinGraphContainer.id = bernsteinGraphContainerId;
bernsteinGraphContainer.className = 'flex-col center-cross-axis';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', bernsteinGraphContainer);


async function createDemo() {
    //override default sketch width for bezier sketch
    const bezierSketchWidth = (p5: p5) => Math.min(0.55 * p5.windowWidth, 600);
    //setting frame rate to 30 as steady 60 fps are not possible somehow (too many calculations?)
    const bezierSketch = new Sketch(demoContainerId, bezierSketchWidth, undefined, undefined, 30);
    await bezierSketch.create();
    //bezierDemo animation has to be twice as fast as we use only half the FPS
    const bezierDemo = bezierSketch.add((p5, containerId) => new BezierDemo(p5, containerId, 2));
    bezierDemo.showPointLabels = true;
    bezierDemo.showPointPositions = true;

    const bernsteinVisSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.35, 400);
    const bernsteinVisSketchHeight = bernsteinVisSketchWidth;
    const bernsteinVisSketch = new Sketch(bernsteinGraphContainerId, bernsteinVisSketchWidth, bernsteinVisSketchHeight, () => null, 30);
    await bernsteinVisSketch.create();
    const bernsteinVis = bernsteinVisSketch.add((p5) => new BernsteinPolynomialVisualization(p5, bezierDemo));

    //this isn't actually added to the canvas or anything, however it needs to be updated every time t of bezier demo changes -> easiest solution: update on every draw() by adding to sketch
    bernsteinVisSketch.add(() => new BernsteinCurveFormulas(bernsteinVis, bernsteinGraphContainerId));

    bezierSketch.add((p5) => new ControlPointInfluenceVisualization(p5, bernsteinVis));

    document.querySelector('#cover')?.remove();
}

createDemo();





interface BernsteinPolynomialData {
    controlPoint: DragVertex,
    bernsteinPolynomialFunction: (t: number) => number,
    bernsteinPolynomialFunctionAsLaTeXString: string
}

type BernsteinPolynomialChange = 'bernsteinPolynomialsChanged';

export class BernsteinPolynomialVisualization implements Drawable, MyObserver<DemoChange>, MyObservable<BernsteinPolynomialChange> {
    public bernsteinPolynomialDataPoints: BernsteinPolynomialData[] = [];

    private bernsteinGraphPlotter: BernsteinGraphPlotter;

    public get t() {
        return this.demo.t;
    }

    constructor(p5: p5, private demo: BezierDemo) {
        this.bernsteinGraphPlotter = new BernsteinGraphPlotter(p5, this);

        this.bernsteinPolynomialDataPoints = this.getUpdatedDataPoints();

        //we want to get notified if the number of control points changes
        this.demo.subscribe(this);
    }

    draw() {
        this.bernsteinGraphPlotter.draw();
    }

    update(change: DemoChange): void {
        if (change === 'controlPointsChanged') {
            this.bernsteinPolynomialDataPoints = this.getUpdatedDataPoints();
            this.notifyObservers('bernsteinPolynomialsChanged');
        }
    }

    public getUpdatedDataPoints(): BernsteinPolynomialData[] {
        if (this.demo.controlPoints.length < 2) {
            return [];
        }

        const ctrlPts = this.demo.controlPoints;
        const n = ctrlPts.length - 1;
        const updatedDataPoints = ctrlPts.map((pt, i) => {
            const bernsteinPolynomialFunction = (t: number) => binomial(n, i) * Math.pow(t, i) * Math.pow((1 - t), n - i);
            const bernsteinPolynomialFunctionAsLaTeXString = String.raw`\( b_{${i},${n}} = \binom{${n}}{${i}} \cdot t^{${i}} \cdot (1-t)^{${n - i}} = \)`;

            return {
                controlPoint: pt,
                bernsteinPolynomialFunction,
                bernsteinPolynomialFunctionAsLaTeXString
            }
        });

        return updatedDataPoints;
    }

    private observers: MyObserver<BernsteinPolynomialChange>[] = [];

    subscribe(observer: MyObserver<BernsteinPolynomialChange>): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: MyObserver<BernsteinPolynomialChange>): void {
        this.observers = this.observers.filter(o => o !== observer);
    }

    notifyObservers(data: BernsteinPolynomialChange): void {
        this.observers.forEach(o => o.update(data));
    }
}





interface BernsteinCurveData {
    controlPoint: DragVertex;
    yValues: number[];
}

class BernsteinGraphPlotter implements Drawable, MyObserver<BernsteinPolynomialChange> {
    /**
     * range of numbers from 0 to 1 (inclusive) in steps of size 1/noOfStepsForT https://stackoverflow.com/a/10050831
     */
    private tValues: number[];
    private noOfStepsForT: number = 100;

    private lineThroughTColor: p5.Color;
    private axisRulerOffsetFromBorder: number;
    private axisRulerAndLabelColor: p5.Color;
    private distFromZeroToOneXAxis: number;
    private distFromZeroToOneYAxis: number;

    private bernsteinCurveDataPoints: BernsteinCurveData[] = [];

    constructor(private p5: p5, private bernsteinVis: BernsteinPolynomialVisualization) {
        this.tValues = [...Array(this.noOfStepsForT + 1).keys()].map(num => num / this.noOfStepsForT);

        this.lineThroughTColor = this.p5.color(colors.errorColor);

        this.axisRulerOffsetFromBorder = this.p5.width / 15;
        this.axisRulerAndLabelColor = p5.color(30);
        this.distFromZeroToOneXAxis = this.p5.width - this.axisRulerOffsetFromBorder * 1.5;
        this.distFromZeroToOneYAxis = this.p5.height - this.axisRulerOffsetFromBorder * 1.5;

        this.computeBernsteinCurves();
        bernsteinVis.subscribe(this);
    }

    update(data: BernsteinPolynomialChange): void {
        if (data === 'bernsteinPolynomialsChanged') {
            this.computeBernsteinCurves();
        }
    }

    computeBernsteinCurves() {
        this.bernsteinCurveDataPoints = this.bernsteinVis.bernsteinPolynomialDataPoints.map(
            d => ({
                controlPoint: d.controlPoint,
                yValues: this.tValues.map(t => d.bernsteinPolynomialFunction(t))
            })
        )
    }

    draw(): void {
        if (this.bernsteinCurveDataPoints.length > 0) {
            this.drawBernsteinCurves();
            this.drawAxisRulersAndLabels();
            this.drawLineAtT();
        }

        else this.renderInfoText();
    }


    private drawBernsteinCurves() {
        this.bernsteinCurveDataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1) return;
                const t = this.tValues[i];
                const nextY = yVals[i + 1];
                const nextT = this.tValues[i + 1];
                const x1 = t * this.distFromZeroToOneXAxis + this.axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this.axisRulerOffsetFromBorder - y * this.distFromZeroToOneYAxis;
                const x2 = nextT * this.distFromZeroToOneXAxis + this.axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this.axisRulerOffsetFromBorder - nextY * this.distFromZeroToOneYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });
    }

    private drawAxisRulersAndLabels() {
        //horizontal line
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder,
            this.p5.width, this.p5.height - this.axisRulerOffsetFromBorder, this.axisRulerAndLabelColor, 1);
        //vertical line
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder, 0, this.axisRulerAndLabelColor, 1);


        //ruler markers
        const steps = 10;
        const rulerMarkerSize = this.axisRulerOffsetFromBorder * 0.075;

        const rulerMarkerIncrementX = this.distFromZeroToOneXAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder,
                this.axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder + (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize),
                this.axisRulerAndLabelColor, 1);
        }

        const rulerMarkerIncrementY = this.distFromZeroToOneYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize), this.p5.height - this.axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('t', this.axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height);
        this.p5.text('0.5', this.axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder / 2);
        this.p5.text('1', this.axisRulerOffsetFromBorder + steps * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder / 2);

        this.p5.text('0.5', this.axisRulerOffsetFromBorder / 2, this.p5.height - this.axisRulerOffsetFromBorder - steps / 2 * rulerMarkerIncrementY);
        this.p5.text('1', this.axisRulerOffsetFromBorder / 2, this.p5.height - this.axisRulerOffsetFromBorder - steps * rulerMarkerIncrementY);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        renderTextWithSubscript(this.p5, 'b_{i,n}', this.axisRulerOffsetFromBorder / 10, this.axisRulerOffsetFromBorder * 1.5 + this.distFromZeroToOneYAxis / 2);
        this.p5.pop();
    }

    private drawLineAtT() {
        const currT = this.bernsteinVis.t;
        const x = this.axisRulerOffsetFromBorder + currT * this.distFromZeroToOneXAxis;
        drawLineXYCoords(this.p5, x, 0, x, this.p5.height, this.lineThroughTColor, 2);
    }

    private renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add at least two control points to the canvas on the left!\nThe Bernstein polynomials will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}





class BernsteinCurveFormulas implements Drawable, MyObserver<BernsteinPolynomialChange> {
    private textBoxContainer: HTMLDivElement;
    private containersForBernsteinPolynomialValues: HTMLDivElement[] = [];
    private bezierCurveEquation: HTMLSpanElement;
    private id: string = 'bernstein-polynomials';

    private set visible(visible: boolean) {
        this.textBoxContainer.style.display = visible ? 'block' : 'none';
        if (visible) {
            const n = this.bernsteinVis.bernsteinPolynomialDataPoints.length - 1;
            const controlPoints = this.bernsteinVis.bernsteinPolynomialDataPoints.map(d => d.controlPoint);
            this.bezierCurveEquation.innerHTML =
                String.raw`<br>For the current set of control points the formula is: \[ C(t) = `
                + controlPoints.map((c, i) => String.raw`${i == 0 ? '' : ' + '}b_{${i},${n}} \cdot ${c.label}`).join('')
                + String.raw` \]`;
            MathJax.typeset([`#${this.id}`, `#${this.bezierCurveEquation.id}`]);
        }
        else this.bezierCurveEquation.innerText = '';
    }

    constructor(private bernsteinVis: BernsteinPolynomialVisualization, demoContainerId: string) {
        this.textBoxContainer = document.createElement('div');
        this.textBoxContainer.id = this.id;
        this.bezierCurveEquation = document.createElement('span');
        this.bezierCurveEquation.id = 'bezier-curve-equation';

        descriptionParagraph?.appendChild(this.bezierCurveEquation);
        document.getElementById(demoContainerId)?.appendChild(this.textBoxContainer);

        this.setupTextContainersForCurrBernsteinPolynomials();

        bernsteinVis.subscribe(this);
    }

    draw(): void {
        this.bernsteinVis.bernsteinPolynomialDataPoints.forEach((d, i) =>
            this.containersForBernsteinPolynomialValues[i].innerText = d.bernsteinPolynomialFunction(this.bernsteinVis.t).toFixed(2)
        );
    }


    public update(data: BernsteinPolynomialChange) {
        if (data === 'bernsteinPolynomialsChanged') {
            this.setupTextContainersForCurrBernsteinPolynomials();
        }
    }

    private setupTextContainersForCurrBernsteinPolynomials() {
        this.textBoxContainer.innerHTML = '';//removes any previously existing child nodes

        const zeroToN = [...Array(this.bernsteinVis.bernsteinPolynomialDataPoints.length).keys()];

        this.containersForBernsteinPolynomialValues = zeroToN.map(() => {
            const div = document.createElement('div');
            div.className = 'polynomial-values';
            return div;
        });


        this.bernsteinVis.bernsteinPolynomialDataPoints.forEach((d, i) => {
            const div = document.createElement('div');
            div.className = 'flex-row bernstein-polynomial-container center-cross-axis';
            div.appendChild(document.createTextNode(d.bernsteinPolynomialFunctionAsLaTeXString));
            div.appendChild(this.containersForBernsteinPolynomialValues[i]);
            this.textBoxContainer.appendChild(div);
        });

        this.visible = this.textBoxContainer.innerHTML.length > 0;
    }
}





class ControlPointInfluenceVisualization implements Drawable, MyObserver<BernsteinPolynomialChange>, Draggable, Touchable, Clickable {
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
            b.handleTouchStarted();//after this call v.dragging might be true!

            //dragging several things at once is not desired behavior, break out of the loop
            if (b.dragging) break;
        }
    }

    handleTouchReleased(): void {
        this.influenceBars.forEach(b => b.handleTouchReleased())
    }

    handleMousePressed(): void {
        const bars = this.influenceBars.slice();
        for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            b.handleMousePressed();//after this call v.dragging might be true!

            //dragging several things at once is not desired behavior, break out of the loop
            if (b.dragging) break;
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
        return this.data.controlPoint.x + this.offsetFromCtrlPtPosX
    }

    private get y(): number {
        return this.data.controlPoint.y + this.offsetFromCtrlPtPosY
    }

    /**
     * defined if user is dragging bar on touch screen
     */
    private touchPointID?: number;

    constructor(private p5: p5, data: BernsteinPolynomialData, private bernsteinVis: BernsteinPolynomialVisualization, config?: InfluenceBarConfig) {
        this.data = data;

        if (config) {
            if (config.borderColor) this.borderColor = config.borderColor;
            if (config.borderThickness) this.borderThickness = config.borderThickness;
            if (config.height) this.height = config.height;
            if (config.width) this.width = config.width;
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
            else console.warn(`touchPoint with ID ${this.touchPointID} not found!`);
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
        const rectLeft = this.x - this.width / 2
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