import p5 from 'p5';
import { drawLineVector } from "../../../utils/p5";
import { Curve } from "../base/curve";

export class BezierCurve extends Curve {
    public draw() {
        if (this.demo.controlPoints.length === 0 || this.demo.controlPoints.length === 1)
            return;
        const points = this.evaluationSteps.map(t => this.findPointOnCurveWithDeCasteljau(this.demo.controlPoints.map(v => v.position), t));
        points.forEach((p, i) => {
            if (i === points.length - 1)
                return;
            drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2);
        });
    }

    private findPointOnCurveWithDeCasteljau(ctrlPtPositions: p5.Vector[], t: number): p5.Vector {
        if (ctrlPtPositions.length === 1)
            return ctrlPtPositions[0];
        let ctrlPtsForNextIter = ctrlPtPositions.slice(0, -1).map((v, i) => {
            const lerpCurrAndNextAtT = p5.Vector.lerp(v, ctrlPtPositions[i + 1], t) as unknown as p5.Vector; //again, fail in @types/p5???
            return lerpCurrAndNextAtT;
        });
        return this.findPointOnCurveWithDeCasteljau(ctrlPtsForNextIter, t);
    }
}
