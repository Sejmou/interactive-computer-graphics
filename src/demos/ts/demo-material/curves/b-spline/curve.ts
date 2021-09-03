import p5 from 'p5';
import { MyObserver } from '../../../utils/ui';
import { drawCircle, drawLineVector } from "../../../utils/p5";
import { DemoChange } from '../base/demo';
import { Curve } from "../base/curve";
import { BSplineDemo } from './b-spline-curve';

export class BSplineCurve extends Curve implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo) {
        super(p5, bSplineDemo);
        this.noOfEvaluationSteps = 400;
        this.bSplineDemo.subscribe(this);
    }

    public draw() {
        if (!this.demo.valid) return;

        
        if (this.bSplineDemo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt) {
            // we want to draw only the influence of the currently active control point
            // (i.e. only draw segments along the line (parameter t) where it has an influence - the more influence the thicker the line)
            // the visualizer for the influence of the currently active control point already does that, so don't do anything here
            return;
        }

        const points = this.evaluationSteps.map(t => this.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t));
        if (this.bSplineDemo.degree === 0) {
            points.slice(0, -1).forEach(p => drawCircle(this.p5, p, this.color, this.demo.basePointDiameter * 1.25));
        } else {
            points.slice(0, -1).forEach((p, i) => drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2));
        }
    }

    update(data: DemoChange): void {
        if (data === 'rangeOfTChanged' || 'knotVectorChanged' || 'degreeChanged')
            this.evaluationSteps = this.calculateEvaluationSteps();
    }
}
