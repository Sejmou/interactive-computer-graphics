import p5, { Vector } from 'p5';
import { MyObserver } from '../ui-interfaces';
import { createArrayOfEquidistantAscendingNumbersInRange, drawCircle, drawLineVector } from '../util';
import { Curve, CurveDemo, CurveDrawingVisualization, DemoChange } from './base-curve';



export class BSplineDemo extends CurveDemo {
    /**
     * The *degree* of a B-Spline curve is "the degree of its piecewise polynomial function in a variable x". In other words, it is the degree of the subsequent segments that the curve is built with.
     * E. g. if the degree is 2, the curve is built with "segments of quadratic Bézier curves". 
     * 
     * Side note: The *order* of a B-Spline curve is also known as k in math literature. It can be interpreted as the minimum number of control points needed to draw the curve.
     * This is always the curve's degree + 1. For example, if we have a quadratic B-spline curve, we need at least 3 vertices to draw a single segment, therefore the order k is 3.
     * degree = k - 1
     */
    public get degree() {
        return this._degree;
    }
    private _degree: number;

    /**
     * a B-spline curve cannot have a degree of n (number of controlPoints), as always n + 1 control points are needed for a curve segment of degree n
     * For example, a quadratic Bèzier curve also needs 3 controlPoints!
     */
    private get maxDegree() {
        return this.controlPoints.length - 1;
    }
    private minDegree;
    public degreeValid() {
        return this.degree >= this.minDegree && this.degree <= this.maxDegree;
    }


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

        //degree < 0 doesn't make sense
        //degree 0 would mean we simply switch from one control point to the other, depending on value of t
        //degree 1 would mean linear interpolation between adjacent control points
        //degree 2 would create segments of quadratic b-splines?
        this.minDegree = 0;
        this._degree = 3;
        this._knotVector = [];
        this._basisFunctions = [];
        this.updateKnotVector();
        this.updateBasisFunctions();
    }

    //called every time the curve degree changes
    protected additionalCurveDegreeChangeHandling() {
        this.updateKnotVector();
        this.updateBasisFunctions();
    }

    updateKnotVector() {
        // m := (# of knots in knotVector T) - 1
        // n := (# of control points) - 1
        // k := order of curve (degree = k - 1)
        // m = k + n
        // e. g. for a cubic B-spline w/ 5 control points m = 3 + 4 = 7 (which means that there are 8 entries in the knot vector)

        const k = this.degree + 1;
        const n = this.controlPoints.length - 1;
        if (n <= 0) {
            this._knotVector = [];
            return;
        }
        const m = n + k;

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
        const k = this.degree + 1;
        const t = this.knotVector;
        const m = n + k;

        if (n <= 0) {
            this._basisFunctions = [];
            return;
        }

        let basisFunctions: { (x: number): number }[][] = [[]];//also known as N_{i,k}

        //e. g. if there are 4 knots, there are 3 N_{i,0} functions
        for (let j = 0; j < m; j++) {
            basisFunctions[0][j] =
                (x: number) => {
                    if (t[j] <= x && x < t[j + 1]) return 1;
                    else return 0;
                };
        }

        for (let j = 1; j < k; j++) {
            basisFunctions[j] = [];
            for (let i = 0; i < basisFunctions[j - 1].length - 1; i++) {
                basisFunctions[j][i] = (x: number) => {
                    const a = (x - t[i]) / (t[i + j] - t[i]) * basisFunctions[j - 1][i](x);
                    if (i !== m - 1) {
                        const b = (t[i + j + 1] - x) / (t[i + j + 1] - t[i + 1]) * basisFunctions[j - 1][i + 1](x);
                        return a + b;
                    }
                    else return a;
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

    public evaluateBasisFunctions(k: number, t: number) {
        return this.controlPoints.map(pt => pt.position).reduce(
            (prev, curr, i) => Vector.add(prev, Vector.mult(curr, this.basisFunctions[k - 1][i](t))), this.p5.createVector(0, 0)
        );
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
        const points = this.evaluationSteps.map(t => this.bSplineDemo.evaluateBasisFunctions(this.bSplineDemo.degree, t));
        points.slice(0, -1).forEach((p, i) => drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2));
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
        if (this.demo.controlPoints.length <= 1) return;
        const points = this.bSplineDemo.controlPoints;
        points.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt.position, points[i + 1].position, this.color, this.bSplineDemo.baseLineWidth));

        drawCircle(
            this.p5, this.bSplineDemo.evaluateBasisFunctions(this.bSplineDemo.degree, this.bSplineDemo.t), this.colorOfPointOnCurve, this.bSplineDemo.basePointDiameter * 1.5
        );
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') { }
    }

}