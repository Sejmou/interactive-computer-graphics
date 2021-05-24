import p5 from 'p5';
import { MyObserver } from '../ui-interfaces';
import { Curve, CurveDemo, CurveDrawingVisualization, DemoChange } from './base-curve';



export class BSplineDemo extends CurveDemo {
    /**
     * degree of Bèzier curve segments which the BSpline is built upon.
     * Also known as k in math literature. E.g. if k is 3, cubic Bèzier curves are used for "building" the B-Spline curve
     */
    public get degree() {
        return this._degree;
    }
    private _degree: number;

    private _knotVector: number[];
    public get knotVector() {
        return this._knotVector;
    }

    private _basisFunctions: { (x: number): number }[][];
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

        this._degree = 2;
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
        // m = (# of knots in knotVector T) - 1
        // n = (# of control points) - 1
        // k = degree of curve
        // m = k + n + 1
        // e. g. for a cubic B-spline w/ 5 control points m = 3 + 4 + 1

        const k = this.degree;
        const n = this.controlPoints.length - 1;
        if (n <= 0) {
            this._knotVector = [];
            return;
        }
        const m = k + n + 1;
        this._tMax = m;
        this._tMin = 0;

        //knots in knot vector equidistant, in other words: m + 1 values in range [0, m], distributed uniformly (same step size between them)
        //that's why this is called a *uniform* B-spline, btw
        this._knotVector = [...Array(m + 1).keys()].map(i => (i / m) * (this.tMax - this.tMin));
    }

    private updateBasisFunctions() {
        //basis functions (also known as N_{i,k}): retrieved using recursive Cox-de Boor formula
        //iterating over control points P_0 to P_i and k (j goes from 0 to k) - bad explanation lol

        //recursive case: N_{i,j}(x) = (x - t_{i})/(t_{i+j} - t_{i})*N_{i,j-1}(x) + (t_{i+j+1} - x)/(t_{i+j+1} - t_{i+1})*N_{i+1,j-1}(x)
        //base case: N_{i,0}(x) = 1 if t_0 <= t < t_1, else 0

        const n = this.controlPoints.length - 1;
        const k = this.degree;
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
                    return (x - t[i]) / (t[i + j] - t[i]) * basisFunctions[i][j - 1](x)
                    + (t[i + j + 1] - x) / (t[i + j + 1] - t[i + 1]) * basisFunctions[i + 1][j - 1](x)
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



class BSplineCurve extends Curve {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo) {
        super(p5, bSplineDemo);
    }

    public draw() {
        if (this.demo.controlPoints.length <= 1) return;
        const points = this.evaluationSteps.map(t => this.evaluateBasisFunctions(t));
        console.log(points);
    }

    private evaluateBasisFunctions(t: number): p5.Vector {
        const k = this.bSplineDemo.degree;
        const basisFunctions = this.bSplineDemo.basisFunctions;
        return this.bSplineDemo.controlPoints.map(pt => pt.position).reduce((prev, curr, i) => {
            console.log(basisFunctions[i][k].toString())
            return prev.add(curr.mult(basisFunctions[i][k](t)));
        }, this.p5.createVector(0, 0));
    }

    // public draw() {
    //     if (this.demo.controlPoints.length === 0 || this.demo.controlPoints.length === 1) return;
    //     const points = this.evaluationSteps.map(t => this.findPointOnCurveWithDeCasteljau(this.demo.controlPoints.map(v => v.position), t));
    //     points.forEach((p, i) => {
    //         if (i === points.length - 1) return;
    //         drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2);
    //     });
    // }

    // private findPointOnCurveWithDeCasteljau(ctrlPtPositions: p5.Vector[], t: number): p5.Vector {
    //     if (ctrlPtPositions.length === 1) return ctrlPtPositions[0]
    //     let ctrlPtsForNextIter = ctrlPtPositions.slice(0, -1).map((v, i) => {
    //         const lerpCurrAndNextAtT = p5.Vector.lerp(v, ctrlPtPositions[i + 1], t) as unknown as p5.Vector;//again, fail in @types/p5???
    //         return lerpCurrAndNextAtT;
    //     });
    //     return this.findPointOnCurveWithDeCasteljau(ctrlPtsForNextIter, t);
    // }
}



class BSplineVisualization extends CurveDrawingVisualization implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        super(p5, bSplineDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') { }
    }

}