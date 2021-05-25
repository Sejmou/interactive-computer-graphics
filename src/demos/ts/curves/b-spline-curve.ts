import p5, { Vector } from 'p5';
import { MyObserver } from '../ui-interfaces';
import { createArrayOfEquidistantAscendingNumbersInRange, drawLineVector } from '../util';
import { Curve, CurveDemo, CurveDrawingVisualization, DemoChange } from './base-curve';



export class BSplineDemo extends CurveDemo {
    /**
     * The *order* of a B-Spline curve is also known as k in math literature. By convention this means (degree of Bèzier curve segments which the BSpline is built upon) + 1.
     * So, the degree of the BSplineCurve is actually k - 1.
     * E.g. if k is 3, quadratic Bèzier curves are used for "building" the B-Spline curve. The term "order" refers to the number of control points needed to build a segment?
     * Why is this sh*t so f*cking confusing, really... https://math.stackexchange.com/a/3323304
     */
    public get order() {
        return this._order;
    }
    private _order: number;

    private _knotVector: number[];
    public get knotVector() {
        return this._knotVector;
    }

    private _basisFunctions: { (x: number): number }[][];
    /**
     * A spline function of order n is a piecewise polynomial function of degree n-1 in a variable x.
     * B-splines of order n are basis functions for spline functions of the same order defined over the same knots,
     * meaning that all possible spline functions can be built from a linear combination of B-splines, and there is only one unique combination for each spline function.
     */
    public get basisFunctions() {
        return this._basisFunctions;
    }

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call
        //they have to be set in constructor, setting them in subclass constructor is too late...

        this._order = 3;
        this._knotVector = [];
        this._basisFunctions = [];
        this.updateTMinTMaxAndKnotVector();
        this.updateBasisFunctions();
    }

    //called every time the curve degree changes
    protected additionalCurveDegreeChangeHandling() {
        this.updateTMinTMaxAndKnotVector();
        this.updateBasisFunctions();
    }

    updateTMinTMaxAndKnotVector() {
        // m := (# of knots in knotVector T) - 1
        // n := (# of control points) - 1
        // k := order of curve (degree = k - 1)
        // m = k + n
        // e. g. for a cubic B-spline w/ 5 control points m = 3 + 4 = 7 (which means that there are 8 entries in the knot vector)

        const k = this.order;
        const n = this.controlPoints.length - 1;
        if (n <= 0) {
            this._knotVector = [];
            return;
        }
        const m = k + n;
        this._tMax = m;
        this._tMin = 0;
        this.notifyObservers('rangeOfTChanged');

        //knots in knot vector equidistant, in other words: m + 1 values in range [0, m], distributed uniformly (same step size between them)
        //that's why this is called a *uniform* B-spline, btw
        this._knotVector = createArrayOfEquidistantAscendingNumbersInRange(m + 1, this.tMin, this.tMax);
    }

    private updateBasisFunctions() {
        //basis functions (also known as N_{i,k}): retrieved using recursive Cox-de Boor formula
        //iterating over control points P_0 to P_i and k (j goes from 0 to k) - bad explanation lol

        //recursive case: N_{i,j}(x) = (x - t_{i})/(t_{i+j} - t_{i})*N_{i,j-1}(x) + (t_{i+j+1} - x)/(t_{i+j+1} - t_{i+1})*N_{i+1,j-1}(x)
        //base case: N_{i,0}(x) = 1 if t_0 <= t < t_1, else 0

        const n = this.controlPoints.length - 1;
        const k = this.order;
        const t = this.knotVector;
        const m = k + n + 1;

        if (n <= 0) {
            this._basisFunctions = [];
            return;
        }

        let basisFunctions: { (x: number): number }[][] = [];//also known as N_{i,k}

        for (let i = 0; i <= n; i++) basisFunctions[i] = [
            (x: number) => {
                if (t[i] <= x && x < t[i + 1]) return 1;
                else return 0;
            }
        ];

        for (let i = 0; i <= n; i++) {
            for (let j = 1; j <= k; j++) {
                basisFunctions[i][j] = (x: number) => {
                    const a = (x - t[i]) / (t[i + j] - t[i]) * basisFunctions[i][j - 1](x);
                    if (i != n) {
                        const b = (t[i + j + 1] - x) / (t[i + j + 1] - t[i + 1]) * basisFunctions[i + 1][j - 1](x);
                        return a + b;
                    }
                    //if i == n, basisFunctions[i + 1] is not defined, so we interpret b as simply being equal to 0
                    return a;
                }

            }
        }

        this._basisFunctions = basisFunctions;
    }

    protected addCurve(): Curve {
        return new BSplineCurve(this.p5, this);
    }
    protected addCurveDrawingVisualization(): CurveDrawingVisualization {
        return new BSplineVisualization(this.p5, this);
    }
}



class BSplineCurve extends Curve implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo) {
        super(p5, bSplineDemo);
        this.noOfEvaluationSteps = 200;
        this.bSplineDemo.subscribe(this);
    }

    public draw() {
        if (this.demo.controlPoints.length <= 1) return;
        const points = this.evaluationSteps.map(t => this.evaluateBasisFunctions(t));
        points.slice(0, -1).forEach((p, i) => drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2));
    }

    private evaluateBasisFunctions(t: number): p5.Vector {
        const k = this.bSplineDemo.order - 1;
        const basisFunctions = this.bSplineDemo.basisFunctions;
        return this.bSplineDemo.controlPoints.map(pt => pt.position).reduce((prev, curr, i) => Vector.add(prev, Vector.mult(curr, basisFunctions[i][k](t))), this.p5.createVector(0, 0));
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') this.evaluationSteps = this.calculateEvaluationSteps();
    }
}



class BSplineVisualization extends CurveDrawingVisualization implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        super(p5, bSplineDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        const points = this.bSplineDemo.controlPoints;
        points.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt.position, points[i +1].position, this.color, this.bSplineDemo.baseLineWidth));
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') { }
    }

}