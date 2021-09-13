import p5 from 'p5';
import { drawLineXYCoords, renderTextWithSubscript } from "../../../utils/p5/misc";
import { BSplineDemo } from './demo';
import { CtrlPtInfluenceFuncGraphPlotter } from '../abstract-base/graph-plotter';



export class BSplineGraphPlotter extends CtrlPtInfluenceFuncGraphPlotter {
    private bSplineDemo: BSplineDemo;
    protected ctrlPtInfluenceFunctionsName = 'B-Spline basis functions';
    protected get yAxisLabel() {
        return `N_{i,${this.bSplineDemo.degree}}`;
    };

    constructor(p5: p5, bSplineDemo: BSplineDemo) {
        super(p5, bSplineDemo);
        this.bSplineDemo = bSplineDemo;
    }

    protected drawRulerMarkersAndLabelsXAxis(): void {
        const knotVector = this.bSplineDemo.knotVector;
        const knotVectorPositionsXAxis = knotVector.map(t_i => (t_i / (this.bSplineDemo.tMax - this.bSplineDemo.tMin)) * this.distMinToMaxXAxis);
        for (let i = 0; i < knotVectorPositionsXAxis.length; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder,
                this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder + this.rulerMarkerSize,
                this.axisRulerAndLabelColor, 1);

            //label (draw only if current knot vector value is not overlapping with previous one)
            if (knotVectorPositionsXAxis[i - 1] !== undefined && knotVectorPositionsXAxis[i - 1] == knotVectorPositionsXAxis[i])
                continue;
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            renderTextWithSubscript(this.p5, `t_{${i}}`, this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder / 3);

            //'+' before knotVector[i] drops "extra" zeroes at the end by changing toFixed()'s output string to number -> use only as many digits as necessary https://stackoverflow.com/a/12830454/13727176
            this.p5.text(+knotVector[i].toFixed(2), this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder / 1.5);
            this.p5.pop();
        }
    }
}
