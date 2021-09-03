import p5 from "p5";
import { drawLineXYCoords, drawPointVector } from "../../../utils/p5";
import { BSplineGraphPlotter, CurveData } from "../b-spline/graph-plotter";
import { NURBSDemo } from "./demo";



export class NURBSGraphPlotter extends BSplineGraphPlotter {
    private NURBSDataPoints: CurveData[] = [];

    protected get yAxisLabel() {
        return this._yAxisLabel;
    }

    _yAxisLabel: string;

    constructor(p5: p5, private nurbsDemo: NURBSDemo) {
        super(p5, nurbsDemo);
        this._yAxisLabel = '  y'; //the spaces are a dirty quickfix to make label appear more to the right
    }

    protected computeCurves() {
        this.minYValue = 0;
        this.maxYValue = 0;
        if (!this.nurbsDemo || !this.nurbsDemo.valid)
            return;
        //compute bSplineCurves
        super.computeCurves();
        if (this.xValues.length < 1)
            return;
        const ctrlPts = this.nurbsDemo.controlPoints;
        const weightedBasisFunctions = this.nurbsDemo.weightedBasisFunctions;
        const degree = this.nurbsDemo.degree;

        this.NURBSDataPoints = ctrlPts.map((pt, i) => ({
            yValues: this.xValues.map(x => {
                const yVal = weightedBasisFunctions[degree][i](x);
                if (yVal < this.minYValue)
                    this.minYValue = yVal;
                if (yVal > this.maxYValue)
                    this.maxYValue = yVal;
                return yVal;
            }),
            controlPoint: pt
        }));
    }


    protected drawCurves() {
        //draw regular B-Spline curves dotted
        this.bSplineDataPoints.forEach(d => {
            const pointColor = d.controlPoint.color;
            const pointThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i) => {
                if (i % 7 < 6)
                    return;
                const x = this.xValues[i] / (this.nurbsDemo.tMax - this.nurbsDemo.tMin);
                const x1 = x * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this.axisRulerOffsetFromBorder - this.normalize(y) * this.distMinToMaxYAxis;
                drawPointVector(this.p5, this.p5.createVector(x1, y1), pointColor, pointThickness);
            });
        });

        //draw weighted basis function curves in regular fashion
        this.NURBSDataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1)
                    return;
                const x = this.xValues[i] / (this.nurbsDemo.tMax - this.nurbsDemo.tMin);
                const nextY = yVals[i + 1];
                const nextX = this.xValues[i + 1] / (this.nurbsDemo.tMax - this.nurbsDemo.tMin);
                const x1 = x * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this.axisRulerOffsetFromBorder - this.normalize(y) * this.distMinToMaxYAxis;
                const x2 = nextX * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this.axisRulerOffsetFromBorder - this.normalize(nextY) * this.distMinToMaxYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });

    }

    private normalize(yVal: number) {
        return (yVal - this.minYValue) / (this.maxYValue - this.minYValue);
    }

    protected renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add more control points to the canvas on the left!\nThe weighted and regular basis functions will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}
