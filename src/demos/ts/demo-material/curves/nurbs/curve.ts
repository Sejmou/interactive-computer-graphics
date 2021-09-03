import p5 from "p5";
import { MyObserver } from "../../../utils/ui";
import { drawCircle, drawLineVector } from "../../../utils/p5";
import { DemoChange } from "../base/demo";
import { Curve } from "../base/curve";
import { NURBSDemo } from "./demo";



export class NURBSCurve extends Curve implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private nurbsDemo: NURBSDemo) {
        super(p5, nurbsDemo);
        this.noOfEvaluationSteps = 400;
        this.nurbsDemo.subscribe(this);
    }

    public draw() {
        if (!this.demo.valid)
            return;
        const points = this.evaluationSteps.map(t => this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(t));
        if (this.nurbsDemo.degree === 0) {
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
