import p5 from 'p5';
import { Drawable, MyObserver, Responsive } from '../../../utils/ui';
import { createArrayOfEquidistantAscendingNumbersInRange, findMaxNumber } from "../../../utils/misc";
import { drawLineXYCoords, renderTextWithSubscript } from "../../../utils/p5";
import { DragVertex } from '../../../utils/vertex';
import { CurveDemo, DemoChange } from './demo';




export interface CurveData {
    yValues: number[];
    controlPoint: DragVertex;
}

/**
 * For each control point, this class plots its "influence function" (a term I came up with myself, not used in literature afaik) that defines how much it contributes to the shape of the curve for the current value of t
 * 
 * "Control point influence functions" may be Bézier polynomials (Bézier), B-Spline basis functions or weighted B-Spline basis functions (with added control point weights, used for NURBS)
 */
export abstract class CtrlPtInfluenceFuncGraphPlotter implements Drawable, MyObserver<DemoChange>, Responsive {
    protected noOfStepsXAxis = 700;
    protected xValues: number[] = [];

    protected minYValue = 0;
    protected maxYValue = 1;

    /**
     * used to render info text that ... will show up here once user adds enough control points
     */
    protected abstract ctrlPtInfluenceFunctionsName: string;

    //needed by LineAtTPlotter
    public get distMinToMaxXAxis() {
        return this._distMinToMaxXAxis;
    }
    private _distMinToMaxXAxis: number;

    public get distMinToMaxYAxis() {
        return this._distMinToMaxYAxis;
    }
    private _distMinToMaxYAxis: number;

    protected abstract yAxisLabel: string;

    //needed by LineAtTPlotter
    public get axisRulerOffsetFromBorder() {
        return this._axisRulerOffsetFromBorder;
    }
    private _axisRulerOffsetFromBorder: number;

    protected get axisRulerAndLabelColor() {
        return this._axisRulerAndLabelColor;
    };
    private _axisRulerAndLabelColor: p5.Color;

    protected get rulerMarkerSize() {
        return this._rulerMarkerSize;
    };
    private _rulerMarkerSize: number;

    private curveDomainBorderColor: p5.Color;

    protected dataPoints: CurveData[] = [];

    constructor(protected p5: p5, private demo: CurveDemo) {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this._rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        this._distMinToMaxXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this._distMinToMaxYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;

        this._axisRulerAndLabelColor = p5.color(30);
        this.curveDomainBorderColor = p5.color(120);

        this.computeCurves();
        demo.subscribe(this);
    }

    canvasResized(): void {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this._rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        this._distMinToMaxXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this._distMinToMaxYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;
        this.redraw();
    }

    update(data: DemoChange): void {
        if (data === 'ctrlPtInfluenceFunctionsChanged') {
            this.computeCurves();
            this.redraw();
        }
    }

    /**
     * Caution: calling this only makes sense if p5 is set to noLoop()!
     */
    redraw() {
        this.p5.redraw();
    }

    protected computeCurves() {
        const ctrlPts = this.demo.controlPoints;
        if (ctrlPts.length < 1) {
            this.xValues = [];
            this.dataPoints = [];
            return;
        }
        const ctrlPtInfluenceFnData = this.demo.ctrlPtInfluenceFunctionData;

        this.xValues = createArrayOfEquidistantAscendingNumbersInRange(this.noOfStepsXAxis, this.demo.tMin, this.demo.tMax);

        let maxYValues: number[] = [];

        this.dataPoints = ctrlPtInfluenceFnData.map(d => {
            const yValues = this.xValues.map(x => d.influenceFunction(x));
            //maxYValues.push(Math.max(...yValues));// this doesn't work, don't know why - in browser console it's fine...
            maxYValues.push(findMaxNumber(yValues));
            console.log('max Y', findMaxNumber(yValues));

            return {
                yValues: this.xValues.map(x => d.influenceFunction(x)),
                controlPoint: d.controlPoint
            }
        });

        this.maxYValue = findMaxNumber(maxYValues);
        console.log(findMaxNumber(maxYValues))
    };

    draw(): void {
        if (this.demo.valid) {
            this.drawCurves();
            this.drawAxisRulersAndLabels();
            this.drawBordersOfCurveDomain();
        }
        else
            this.renderInfoText();
    }


    protected drawCurves() {
        this.dataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1)
                    return;
                const x = this.xValues[i] / (this.demo.tMax - this.demo.tMin);
                const nextY = yVals[i + 1];
                const nextX = this.xValues[i + 1] / (this.demo.tMax - this.demo.tMin);
                const x1 = x * this._distMinToMaxXAxis + this._axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this._axisRulerOffsetFromBorder - y * this._distMinToMaxYAxis;
                const x2 = nextX * this._distMinToMaxXAxis + this._axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this._axisRulerOffsetFromBorder - nextY * this._distMinToMaxYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });
    }

    private drawAxisRulersAndLabels() {
        //horizontal line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this.p5.width, this.p5.height - this._axisRulerOffsetFromBorder, this._axisRulerAndLabelColor, 1);
        //vertical line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this._axisRulerOffsetFromBorder, 0, this._axisRulerAndLabelColor, 1);

        this.drawRulerMarkersAndLabelsXAxis();
        this.drawRulerMarkersAndLabelsYAxis();
    }

    protected abstract drawRulerMarkersAndLabelsXAxis(): void;

    private drawRulerMarkersAndLabelsYAxis() {
        const steps = 10;
        const rulerMarkerIncrementY = this._distMinToMaxYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? this._rulerMarkerSize * 2 : this._rulerMarkerSize), this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this._axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);

        //middle value of value range (rounded to two digits)
        this.p5.text(+((0.5 * (this.maxYValue - this.minYValue)).toFixed(2)), this._axisRulerOffsetFromBorder / 2, this.p5.height - this._axisRulerOffsetFromBorder - steps / 2 * rulerMarkerIncrementY);
        //max value of value range (rounded to two digits)
        this.p5.text(+(this.maxYValue).toFixed(2), this._axisRulerOffsetFromBorder / 2, this.p5.height - this._axisRulerOffsetFromBorder - steps * rulerMarkerIncrementY);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        renderTextWithSubscript(this.p5, this.yAxisLabel, this._axisRulerOffsetFromBorder / 10, this._axisRulerOffsetFromBorder * 1.5 + this._distMinToMaxYAxis / 2);

        this.p5.pop();
    }

    private drawBordersOfCurveDomain() {
        //lower bound
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + this.demo.firstTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder + this.demo.firstTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._distMinToMaxYAxis - this.axisRulerOffsetFromBorder, this.curveDomainBorderColor, 1);
        //upper bound
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + this.demo.lastTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder + this.demo.lastTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._distMinToMaxYAxis - this.axisRulerOffsetFromBorder, this.curveDomainBorderColor, 1);
    }

    protected renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text(`Add more control points to the canvas on the left!\nThe ${this.ctrlPtInfluenceFunctionsName} will then show up here.`, this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}
