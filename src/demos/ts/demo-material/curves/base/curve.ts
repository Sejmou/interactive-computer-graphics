import p5 from "p5";
import { Drawable } from "../../../utils/ui";
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { CurveDemo } from "./demo";



export abstract class Curve implements Drawable {
    /**
     * Signifies on how many steps of t the bezier curve will be evaluated.
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

    public abstract draw(): void;
}
