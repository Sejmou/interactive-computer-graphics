import p5 from "p5";
import { Drawable, MyObserver } from "../../../utils/ui";
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { CurveDemo, DemoChange } from "./demo";
import { BSplineDemo } from "../b-spline/demo";
import { drawCircle, drawLineVector } from "../../../utils/p5";



export class Curve implements Drawable, MyObserver<DemoChange> {
    /**
     * Signifies on how many steps of t the curve will be evaluated.
     * The less steps the less smooth the curve becomes.
     */
    public get noOfEvaluationSteps(): number {
        return this._noOfEvaluationSteps;
    };
    public set noOfEvaluationSteps(newVal: number) {
        this._noOfEvaluationSteps = newVal;
        this.calculateEvaluationSteps();
    }
    private _noOfEvaluationSteps: number;


    /**
     * ascending range of numbers in the interval for t in steps of size 1/noOfEvaluationSteps. https://stackoverflow.com/a/10050831
     * Might be modified during runtime for certain types of curves
     */
    protected evaluationSteps: number[];

    protected color: p5.Color;

    constructor(protected p5: p5, protected demo: CurveDemo, evaluationSteps?: number, color?: p5.Color) {
        this._noOfEvaluationSteps = evaluationSteps ?? 100;
        this.evaluationSteps = createArrayOfEquidistantAscendingNumbersInRange(this.noOfEvaluationSteps, this.demo.firstTValueWhereCurveDefined, this.demo.lastTValueWhereCurveDefined);
        this.color = color ?? p5.color(30);
    }

    /**
     * Creates an array of evaluation steps for the curve, depending on this.noOfEvaluationSteps and tMin and tMax of the demo.
     * Should be called whenever the range for the parameter t changes
     *
     * @returns array of evaluation steps
     */
    protected calculateEvaluationSteps(): number[] {
        return createArrayOfEquidistantAscendingNumbersInRange(this.noOfEvaluationSteps, this.demo.firstTValueWhereCurveDefined, this.demo.lastTValueWhereCurveDefined);
    }

    public draw() {
        if (!this.demo.valid) return;
        
        if (this.demo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt) {
            // we want to draw only the influence of the currently active control point
            // (i.e. only draw segments along the line (parameter t) where it has an influence - the more influence the thicker the line)
            // the visualizer for the influence of the currently active control point already does that, so don't do anything here
            return;
        }
        
        const points = this.evaluationSteps.map(t => this.demo.getPointOnCurve(t));
        if (this.demo instanceof BSplineDemo && this.demo.degree === 0) {
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
