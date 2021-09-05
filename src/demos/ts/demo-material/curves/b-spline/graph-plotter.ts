import p5 from 'p5';
import { Drawable, MyObserver, Responsive } from '../../../utils/ui';
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { drawLineXYCoords, renderTextWithSubscript } from "../../../utils/p5";
import { DragVertex } from '../../../utils/vertex';
import { DemoChange } from '../base/demo';
import { BSplineDemo } from './demo';




export interface CurveData {
    yValues: number[];
    controlPoint: DragVertex;
}

export class BSplineGraphPlotter implements Drawable, MyObserver<DemoChange>, Responsive {
    private noOfStepsXAxis: number = 700;
    protected xValues: number[] = [];

    //B-Spline basis functions should always be in range [0, 1]; for other functions this might not always be the case
    //e.g. weighted basis functions of NURBS curves, which are a generalization of the B-Spline curve
    protected minYValue = 0;
    protected maxYValue = 1;

    //needed by LineAtTPlotter
    public get distMinToMaxXAxis() {
        return this._distMinToMaxXAxis;
    }
    private _distMinToMaxXAxis: number;

    public get distMinToMaxYAxis() {
        return this._distMinToMaxYAxis;
    }
    private _distMinToMaxYAxis: number;

    protected get yAxisLabel() {
        return `N_{i,${this.bSplineDemo.degree}}`;
    }

    //needed by LineAtTPlotter
    public get axisRulerOffsetFromBorder() {
        return this._axisRulerOffsetFromBorder;
    }
    private _axisRulerOffsetFromBorder: number;
    private axisRulerAndLabelColor: p5.Color;
    private rulerMarkerSize: number;

    private curveDomainBorderColor: p5.Color;

    protected bSplineDataPoints: CurveData[] = [];

    constructor(protected p5: p5, private bSplineDemo: BSplineDemo) {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this.rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        this._distMinToMaxXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this._distMinToMaxYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;

        this.axisRulerAndLabelColor = p5.color(30);
        this.curveDomainBorderColor = p5.color(120);

        this.computeCurves();
        bSplineDemo.subscribe(this);
    }

    canvasResized(): void {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this.rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        this._distMinToMaxXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this._distMinToMaxYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;
        this.redraw();
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged' || data === 'knotVectorChanged' || data === 'rangeOfTChanged') {
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
        const ctrlPts = this.bSplineDemo.controlPoints;
        if (ctrlPts.length < 1) {
            this.xValues = [];
            this.bSplineDataPoints = [];
            return;
        }
        const basisFunctions = this.bSplineDemo.ctrlPtInfluenceFunctions;

        this.xValues = createArrayOfEquidistantAscendingNumbersInRange(this.noOfStepsXAxis, this.bSplineDemo.tMin, this.bSplineDemo.tMax);

        this.bSplineDataPoints = ctrlPts.map((pt, i) => ({
            yValues: this.xValues.map(x => basisFunctions[i](x)),
            controlPoint: pt
        }));
    }

    draw(): void {
        if (this.bSplineDemo.valid) {
            this.drawCurves();
            this.drawAxisRulersAndLabels();
            this.drawBordersOfCurveDomain();
        }
        else
            this.renderInfoText();
    }


    protected drawCurves() {
        this.bSplineDataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1)
                    return;
                const x = this.xValues[i] / (this.bSplineDemo.tMax - this.bSplineDemo.tMin);
                const nextY = yVals[i + 1];
                const nextX = this.xValues[i + 1] / (this.bSplineDemo.tMax - this.bSplineDemo.tMin);
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
            this.p5.width, this.p5.height - this._axisRulerOffsetFromBorder, this.axisRulerAndLabelColor, 1);
        //vertical line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this._axisRulerOffsetFromBorder, 0, this.axisRulerAndLabelColor, 1);

        this.drawRulerMarkersAndLabelsXAxis();
        this.drawRulerMarkersAndLabelsYAxis();
    }

    private drawRulerMarkersAndLabelsXAxis() {
        const knotVector = this.bSplineDemo.knotVector;
        const knotVectorPositionsXAxis = knotVector.map(t_i => (t_i / (this.bSplineDemo.tMax - this.bSplineDemo.tMin)) * this._distMinToMaxXAxis);
        for (let i = 0; i < knotVectorPositionsXAxis.length; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder,
                this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder + this.rulerMarkerSize,
                this.axisRulerAndLabelColor, 1);

            //label (draw only if current knot vector value is not overlapping with previous one)
            if (knotVectorPositionsXAxis[i - 1] !== undefined && knotVectorPositionsXAxis[i - 1] == knotVectorPositionsXAxis[i])
                continue;
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            renderTextWithSubscript(this.p5, `t_{${i}}`, this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder / 3);

            //'+' before knotVector[i] drops "extra" zeroes at the end by changing toFixed()'s output string to number -> use only as many digits as necessary https://stackoverflow.com/a/12830454/13727176
            this.p5.text(+knotVector[i].toFixed(2), this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder / 1.5);
            this.p5.pop();
        }
    }

    private drawRulerMarkersAndLabelsYAxis() {
        const steps = 10;
        const rulerMarkerIncrementY = this._distMinToMaxYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? this.rulerMarkerSize * 2 : this.rulerMarkerSize), this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerAndLabelColor, 1);
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
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + this.bSplineDemo.firstTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder + this.bSplineDemo.firstTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._distMinToMaxYAxis - this.axisRulerOffsetFromBorder, this.curveDomainBorderColor, 1);
        //upper bound
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + this.bSplineDemo.lastTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder + this.bSplineDemo.lastTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._distMinToMaxYAxis - this.axisRulerOffsetFromBorder, this.curveDomainBorderColor, 1);
    }

    protected renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add more control points to the canvas on the left!\nThe B-spline basis functions will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}
