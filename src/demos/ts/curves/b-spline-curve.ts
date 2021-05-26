import p5, { Vector } from 'p5';
import { MyObserver } from '../ui-interfaces';
import { createArrayOfEquidistantAscendingNumbersInRange, drawCircle, drawLineVector, drawPointVector, renderTextWithSubscript } from '../util';
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

    public increaseDegree() {
        this._degree++;
        this.notifyObservers('degreeChanged');
        this.updateKnotVectorAndBasisFunctions();
    }

    public decreaseDegree() {
        if (this._degree > this.minDegree) {
            this._degree--;
            this.notifyObservers('degreeChanged');
            this.updateKnotVectorAndBasisFunctions();
        }
    }

    /**
     * a B-spline curve cannot have a degree of n (number of controlPoints), as always n + 1 control points are needed for a curve segment of degree n
     * For example, a quadratic Bèzier curve also needs 3 controlPoints!
     */
    public get maxDegree() {
        return this.controlPoints.length - 1;
    }
    /**
     * degree < 0 doesn't make sense. Degree 0 would mean we simply switch from one control point to the other, depending on value of t.
     * Degree 1 would mean linear interpolation between adjacent control points. Degree 2 would create segments of quadratic b-splines.
     */
    public readonly minDegree;
    public get degreeValid() {
        return this.degree >= this.minDegree && this.degree <= this.maxDegree;
    }


    private _knotVector: number[];
    public get knotVector() {
        return this._knotVector;
    }

    public get knotVectorValid() {
        return this.knotVector.every((knot, i, knots) => knots[i + 1] ? knot <= knots[i + 1] : true);
    }

    public get valid() {
        return this.controlPoints.length > 0 && this.degreeValid && this.knotVectorValid;
    }

    protected get curveInvalidMessage(): string {
        let errors: string[] = [];
        if (this.degree > this.maxDegree) errors.push(`At least ${this.degree + 1} control points are needed for a B-Spline of degree ${this.degree}
        Add ${this.degree - this.maxDegree} more control point${this.degree - this.maxDegree == 1 ? '' : 's'}`);
        if (this.degree < this.minDegree) errors.push(`A curve cannot have negative degree`);
        return `${errors.join('\n')}`;
    };

    private _basisFunctions: { (x: number): number }[][];
    /**
     * A spline function of order n is a piecewise polynomial function of degree n-1 in a variable x.
     * B-splines of order n are basis functions for spline functions of the same order defined over the same knots,
     * meaning that all possible spline functions can be built from a linear combination of B-splines, and there is only one unique combination for each spline function.
     */
    public get basisFunctions() {
        return this._basisFunctions;
    }

    /**
     * Let *p* the *degree* of the B-spline curve. For a closed B-spline curve, the first and *p* and last *p* control points are the same (have the same position).
     */
    public get closed(): boolean {
        const p = this.degree;
        return this.knotVector.slice(0, p + 1).every((el, i, arr) => el === arr[0])
            && this.knotVector.slice(-p).every((el, i, arr) => el === arr[0]);
    }

    /**
     * Let *p* the *degree* of the B-spline curve. For an *open* B-spline curve, the first and *p* and last *p* control points are *not* the same.
     * Also refer to the documentation for *closed*.
     */
    public get open(): boolean {
        return !this.closed;
    }

    /**
     * interval in which curve is defined (first number := begin, second := end; end is *not* inclusive!)
     */
    public get curveDomain(): [number, number] {
        return [this.firstTValueWhereCurveDefined, this.lastTValueWhereCurveDefined];
    }

    public get curveDefinedAtCurrentT(): boolean {
        return this.t >= this.firstTValueWhereCurveDefined && this.t <= this.lastTValueWhereCurveDefined;
    }

    public get firstTValueWhereCurveDefined(): number {
        const p = this.degree;
        return this.knotVector[p];
    }

    public get firstKnotIndexWhereCurveDefined(): number {
        const p = this.degree;
        return p;
    }

    public get lastTValueWhereCurveDefined(): number {
        const p = this.degree;
        const m = this.knotVector.length - 1;
        return this.knotVector[m - p] - Number.EPSILON;
    }

    public get firstKnotIndexWhereCurveUndefined(): number {
        const p = this.degree;
        const m = this.knotVector.length - 1;
        return m - p;
    }

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call
        //they have to be set in constructor, setting them in subclass constructor is too late...

        this.minDegree = 0;
        this._degree = 2;
        this._knotVector = this.createKnotVector();
        this._basisFunctions = [];
        this.updateKnotVectorAndBasisFunctions();

        this.setCurve(new BSplineCurve(this.p5, this));
        this.setCurveDrawingVisualization(new BSplineVisualization(this.p5, this));
        new DegreeControls(this.p5, this, this.controlsContainerId);
    }

    /**
     * called every time the number of control points changes
     */
    protected additionalCtrlPtAmountChangeHandling() {
        this.updateKnotVectorAndBasisFunctions();
    }

    private updateKnotVectorAndBasisFunctions() {
        this._knotVector = this.createKnotVector();
        this._basisFunctions = this.createBasisFunctions();
        this.notifyObservers('knotVectorChanged');
    }

    private createKnotVector() {
        // n := (# of control points) - 1
        // k := order of curve
        // side note: p := degree of curve = k - 1
        // m := (# of knots in knotVector T) - 1 = n + k
        // e. g. for a cubic B-spline w/ 5 control points m = 4 + 3 = 7 (which means that there are 8 entries in the knot vector)

        const k = this.degree + 1;
        const n = this.controlPoints.length - 1;
        if (n <= 0) {
            return [];
        }
        const m = n + k;

        //knots in knot vector equidistant, in other words: m + 1 values in range [0, m], distributed uniformly (same step size between them)
        //that's why this is called a *uniform* B-spline, btw
        return createArrayOfEquidistantAscendingNumbersInRange(m + 1, this.tMin, this.tMax);
    }

    private createBasisFunctions() {
        //basis functions (also known as N_{i,k}): retrieved using recursive Cox-de Boor formula
        //iterating over control points P_0 to P_i and k (j goes from 0 to k) - bad explanation lol

        //recursive case: N_{i,j}(x) = (x - t_{i})/(t_{i+j} - t_{i})*N_{i,j-1}(x) + (t_{i+j+1} - x)/(t_{i+j+1} - t_{i+1})*N_{i+1,j-1}(x)
        //base case: N_{i,0}(x) = 1 if t_0 <= t < t_1, else 0

        const n = this.controlPoints.length - 1;
        const k = this.degree + 1;
        const p = this.degree;
        const t = this.knotVector;
        const m = n + k;

        if (n <= 0) {
            return [];
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

        for (let j = 1; j <= p; j++) {
            basisFunctions[j] = [];
            for (let i = 0; i < basisFunctions[j - 1].length - 1; i++) {
                basisFunctions[j][i] = (x: number) => {
                    const a = (x - t[i]) / (t[i + j] - t[i]) * basisFunctions[j - 1][i](x);
                    const b = (t[i + j + 1] - x) / (t[i + j + 1] - t[i + 1]) * basisFunctions[j - 1][i + 1](x);
                    return a + b;
                }
            }
        }

        return basisFunctions;
    }

    public evaluateBasisFunctions(p: number, t: number) {
        return this.controlPoints.map(pt => pt.position).reduce(
            (prev, curr, i) => Vector.add(prev, Vector.mult(curr, this.basisFunctions[p][i](t))), this.p5.createVector(0, 0)
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
        if (!this.demo.valid) return;
        const points = this.evaluationSteps.map(t => this.bSplineDemo.evaluateBasisFunctions(this.bSplineDemo.degree, t));
        if (this.bSplineDemo.degree === 0) {
            points.slice(0, -1).forEach(p => drawCircle(this.p5, p, this.color, this.demo.basePointDiameter * 1.25));
        } else {
            points.slice(0, -1).forEach((p, i) => drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2));
        }
    }

    update(data: DemoChange): void {
        if (data === 'rangeOfTChanged' || 'knotVectorChanged' || 'degreeChanged') this.evaluationSteps = this.calculateEvaluationSteps();
    }
}



class BSplineVisualization extends CurveDrawingVisualization implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        super(p5, bSplineDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        if (this.bSplineDemo.degree >= 2) {
            const points = this.bSplineDemo.controlPoints;
            points.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt.position, points[i + 1].position, this.color, this.bSplineDemo.baseLineWidth));
        }

        if (!this.demo.valid) return;
        if (this.bSplineDemo.curveDefinedAtCurrentT) {
            drawCircle(
                this.p5,
                this.bSplineDemo.evaluateBasisFunctions(this.bSplineDemo.degree, this.bSplineDemo.t),
                this.colorOfPointOnCurve,
                this.bSplineDemo.basePointDiameter * 1.5
            );
        } else {
            renderTextWithSubscript(
                this.p5,
                `This open B-Spline curve is only defined in the interval [t_{${this.bSplineDemo.firstKnotIndexWhereCurveDefined}}, t_{${this.bSplineDemo.firstKnotIndexWhereCurveUndefined}})`,
                10, this.p5.height - 20
            );
        }
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') { }
    }

}





class DegreeControls implements MyObserver<DemoChange> {
    private container: p5.Element;
    private degreeText: p5.Element;
    private decreaseDegreeButton: p5.Element;
    private increaseDegreeButton: p5.Element;

    public set visible(visible: boolean) {
        this.container.style('visibility', visible ? 'visible' : 'hidden');
    };


    constructor(p5: p5, private demo: BSplineDemo, parentContainerId?: string) {
        this.container = p5.createDiv();

        if (parentContainerId) this.container.parent(parentContainerId);
        this.container.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select');
        this.container.id('degree-controls');

        this.degreeText = p5.createSpan(`degree: ${this.demo.degree}`);
        this.degreeText.parent(this.container);
        this.degreeText.id('degree-text');

        this.increaseDegreeButton = p5.createButton('<span class="material-icons">add</span>');
        this.increaseDegreeButton.parent(this.container);
        this.increaseDegreeButton.mouseClicked(() => this.increaseDegreeButtonClicked());

        this.decreaseDegreeButton = p5.createButton('<span class="material-icons">remove</span>');
        this.decreaseDegreeButton.parent(this.container);
        this.decreaseDegreeButton.mouseClicked(() => this.decreaseDegreeButtonClicked());

        this.updateVisibility();

        this.demo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') {
            this.updateVisibility();
        }
        if (data === 'degreeChanged') {
            this.updateDegreeText();
            this.updateButtonDisabled();
        }
    }

    updateButtonDisabled() {
        if (this.demo.degree === this.demo.minDegree) {
            this.decreaseDegreeButton.attribute('disabled', 'true');
        } else (this.decreaseDegreeButton.removeAttribute('disabled'));
    }

    private increaseDegreeButtonClicked() {
        this.demo.increaseDegree();
    }

    private decreaseDegreeButtonClicked() {
        this.demo.decreaseDegree();
    }

    private updateVisibility() {
        this.visible = this.demo.controlPoints.length >= 2;
    }

    private updateDegreeText() {
        this.degreeText.html(`degree: ${this.demo.degree}`);
    }
}