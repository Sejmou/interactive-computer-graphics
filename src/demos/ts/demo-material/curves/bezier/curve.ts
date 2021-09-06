import p5 from 'p5';
import { drawLineVector } from "../../../utils/p5";
import { Curve } from "../base/curve";



export class BezierCurve extends Curve {
    public draw() {
        if (this.demo.controlPoints.length === 0 || this.demo.controlPoints.length === 1 || this.demo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt)
            return;
        const points = this.evaluationSteps.map(t => this.demo.getPointOnCurve(t));
        points.forEach((p, i) => {
            if (i === points.length - 1) return;
            drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2);
        });
    }
}
