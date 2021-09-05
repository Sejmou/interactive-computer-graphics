import p5 from "p5";
import { Drawable, MyObserver } from '../../../utils/ui';
import { drawLineXYCoords, renderTextWithSubscript } from "../../../utils/p5";
import colors from '../../../../../global-styles/color_exports.scss';
import { DragVertex } from '../../../utils/vertex';
import { DemoChange } from "../base/demo";
import { BezierDemo } from "./demo";



interface BernsteinCurveData {
    controlPoint: DragVertex;
    yValues: number[];
}

export class BernsteinGraphPlotter implements Drawable, MyObserver<DemoChange> {
    /**
     * range of numbers from 0 to 1 (inclusive) in steps of size 1/noOfStepsForT https://stackoverflow.com/a/10050831
     */
    private tValues: number[];
    private noOfStepsForT: number = 100;

    private lineThroughTColor: p5.Color;

    public get axisRulerOffsetFromBorder() {
        return this._axisRulerOffsetFromBorder;
    }
    private _axisRulerOffsetFromBorder: number;
    private axisRulerAndLabelColor: p5.Color;

    public get distFromZeroToOneXAxis() {
        return this._distFromZeroToOneXAxis;
    }
    private _distFromZeroToOneXAxis: number;
    private distFromZeroToOneYAxis: number;

    private bernsteinCurveDataPoints: BernsteinCurveData[] = [];

    constructor(private p5: p5, private bezierDemo: BezierDemo) {
        this.tValues = [...Array(this.noOfStepsForT).keys()].map(num => num / (this.noOfStepsForT - 1));

        this.lineThroughTColor = this.p5.color(colors.errorColor);

        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this.axisRulerAndLabelColor = p5.color(30);
        this._distFromZeroToOneXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this.distFromZeroToOneYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;

        this.computeBernsteinCurves();
        bezierDemo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data === 'ctrlPtInfluenceFunctionsChanged') {
            this.computeBernsteinCurves();
            this.redraw();
        }
    }

    /**
     * Caution: calling this only makes sense if p5 is set to noLoop()!
     */
    redraw() {
        this.p5.redraw();
    }

    canvasResized(): void {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;

        this._distFromZeroToOneXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this.distFromZeroToOneYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;
        this.redraw();
    }

    computeBernsteinCurves() {
        this.bernsteinCurveDataPoints = this.bezierDemo.ctrlPtInfluenceFunctionData.map(
            d => ({
                controlPoint: d.controlPoint,
                yValues: this.tValues.map(t => d.influenceFunction(t))
            })
        );
    }

    draw(): void {
        if (this.bernsteinCurveDataPoints.length > 0) {
            this.drawBernsteinCurves();
            this.drawAxisRulersAndLabels();
        }

        else this.renderInfoText();
    }


    private drawBernsteinCurves() {
        this.bernsteinCurveDataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1)
                    return;
                const t = this.tValues[i];
                const nextY = yVals[i + 1];
                const nextT = this.tValues[i + 1];
                const x1 = t * this._distFromZeroToOneXAxis + this._axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this._axisRulerOffsetFromBorder - y * this.distFromZeroToOneYAxis;
                const x2 = nextT * this._distFromZeroToOneXAxis + this._axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this._axisRulerOffsetFromBorder - nextY * this.distFromZeroToOneYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });
    }

    private drawAxisRulersAndLabels() {
        //horizontal line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this.p5.width, this.p5.height - this._axisRulerOffsetFromBorder, this.axisRulerAndLabelColor, 1);
        //vertical line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this._axisRulerOffsetFromBorder, 0, this.axisRulerAndLabelColor, 1);


        //ruler markers
        const steps = 10;
        const rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        const rulerMarkerIncrementX = this._distFromZeroToOneXAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this._axisRulerOffsetFromBorder,
                this._axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this._axisRulerOffsetFromBorder + (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize),
                this.axisRulerAndLabelColor, 1);
        }

        const rulerMarkerIncrementY = this.distFromZeroToOneYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize), this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('t', this._axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height);
        this.p5.text('0.5', this._axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height - this._axisRulerOffsetFromBorder / 2);
        this.p5.text('1', this._axisRulerOffsetFromBorder + steps * rulerMarkerIncrementX, this.p5.height - this._axisRulerOffsetFromBorder / 2);

        this.p5.text('0.5', this._axisRulerOffsetFromBorder / 2, this.p5.height - this._axisRulerOffsetFromBorder - steps / 2 * rulerMarkerIncrementY);
        this.p5.text('1', this._axisRulerOffsetFromBorder / 2, this.p5.height - this._axisRulerOffsetFromBorder - steps * rulerMarkerIncrementY);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        renderTextWithSubscript(this.p5, 'b_{i,n}', this._axisRulerOffsetFromBorder / 10, this._axisRulerOffsetFromBorder * 1.5 + this.distFromZeroToOneYAxis / 2);
        this.p5.pop();
    }

    private renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add at least two control points to the canvas on the left!\nThe Bernstein polynomials will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}
