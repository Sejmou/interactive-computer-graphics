import p5, { Vector } from 'p5';
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { clamp } from "../../../utils/math";
import { CurveDemo } from '../base/demo';
import { BSplineCurve } from './curve';
import { BSplineVisualization } from './curve-drawing-vis';
import { DegreeControls } from './curve-degree-controls';
import { VisualizerForCurrentlyActiveBSplineControlPoint } from './active-ctrl-pt-influence-vis';



export interface BasisFunctionData {
    basisFunction: (x: number) => number,
    basisFunctionAsLaTeXString: string
}

export interface DeBoorEvaluationData {
    tempPtsCreatedDuringEvaluation: p5.Vector[][],
    pt: p5.Vector
};

export type CurveType = 'open' | 'clamped' | 'emulated Bézier';

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
        const n = this.controlPoints.length - 1;
        const k = this.degree + 1;
        const m = n + k;
        return this.knotVector.every((knot, i, knots) => knots[i + 1] ? knot <= knots[i + 1] : true) && this.knotVector.length == (m + 1);
    }

    public get valid() {
        return this.controlPoints.length > 0 && this.degreeValid && this.knotVectorValid;
    }

    protected get curveInvalidMessage(): string {
        let errors: string[] = [];
        if (this.degree > this.maxDegree) errors.push(`At least ${this.degree + 1} control points are needed for a B-Spline of degree ${this.degree}
        Add ${this.degree - this.maxDegree} more control point${this.degree - this.maxDegree == 1 ? '' : 's'}${this.degree > 0 ? ' or reduce the degree' : ''}`);
        if (this.degree < this.minDegree) errors.push(`A curve cannot have negative degree`);
        return `${errors.join('\n')}`;
    };

    private _basisFunctionData: BasisFunctionData[][];
    /**
     * A spline function of order n is a piecewise polynomial function of degree n-1 in a variable x.
     * B-splines of order n are basis functions for spline functions of the same order defined over the same knots,
     * meaning that all possible spline functions can be built from a linear combination of B-splines, and there is only one unique combination for each spline function.
     */
    public get basisFunctions() {
        return this._basisFunctionData.map(j => j.map(d => d.basisFunction));
    }
    /**
     * The B-Spline curve's basis functions as an array of arrays of LaTeX strings
     */
    public get basisFunctionsAsLaTeXString() {
        return this._basisFunctionData.map(j => j.map(d => d.basisFunctionAsLaTeXString));
    }

    public get basisFunctionData() {
        return this._basisFunctionData;
    }

    /**
     * Let *p* the *degree* of the B-spline curve. For a clamped B-spline curve, the first and *p* and last *p* control points are the same (have the same position).
     */
    public get clamped(): boolean {
        const p = this.degree;
        return this.knotVector.slice(0, p + 1).every((el, i, arr) => el === arr[0])
            && this.knotVector.slice(-p).every((el, i, arr) => el === arr[0]);
    }

    /**
     * Let *p* the *degree* of the B-spline curve. For an *open* B-spline curve, the first and *p* and last *p* control points are *not* the same.
     * Also refer to the documentation for *clamped*.
     */
    public get open(): boolean {
        return !this.clamped;
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

    public get lastKnotIndexWhereCurveDefined(): number {
        return this.firstKnotIndexWhereCurveUndefined - 1;
    }

    public get firstTValueWhereCurveUndefined(): number {
        const p = this.degree;
        const m = this.knotVector.length - 1;
        return this.knotVector[m - p];
    }

    public get firstKnotIndexWhereCurveUndefined(): number {
        const p = this.degree;
        const m = this.knotVector.length - 1;
        return m - p;
    }

    public setKnotVectorValue(i: number, val: number) {
        if (i < 0 || i >= this.knotVector.length) {
            console.warn(`BSplineCurve.setKnotVectorValue(): index ${i} is invalid!`);
            return;
        }
        const newVal = clamp(val, this.knotVector[i - 1] ?? 0, this.knotVector[i + 1] ?? Number.MAX_VALUE);
        this.scheduleKnotValueChange(i, newVal);
    }

    scheduleKnotValueChange(i: number, newVal: number) {
        //override any value changes to the same knot that might still be "in queue"
        this.scheduledKnotValueChanges = this.scheduledKnotValueChanges.filter(c => c.i !== i);
        this.scheduledKnotValueChanges.push({ i, newVal });
    }

    draw() {
        super.draw();
        if (this.scheduledKnotValueChanges.length > 0) {
            let rangeOfTChanged = false;
            this.scheduledKnotValueChanges.forEach(c => {
                if (c.i == 0) this._tMin = c.newVal;
                if (c.i == this.knotVector.length - 1) {
                    this._tMax = c.newVal;
                    rangeOfTChanged = true;
                }
                this.knotVector[c.i] = c.newVal;
            });
            this.scheduledKnotValueChanges = [];

            this.updateBasisFunctions();

            this.notifyObservers('knotVectorChanged');
            if (rangeOfTChanged) this.notifyObservers('rangeOfTChanged');
        }
    }

    private scheduledKnotValueChanges: { i: number, newVal: number }[];

    private _curveType: CurveType;
    public get curveType(): CurveType {
        return this._curveType;
    };
    public set curveType(newType: CurveType) {
        this._curveType = newType;
        this.updateDegree();
        this.updateKnotVectorAndBasisFunctions();
        this.notifyObservers('curveTypeChanged');
    }


    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number, showInfluenceVisForCurrentlyActiveCtrlPt = true) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call
        //they have to be set in constructor, setting them in subclass constructor is too late...


        this.minDegree = 0;
        this._degree = 2;

        this.scheduledKnotValueChanges = [];
        this._curveType = 'clamped';

        this._knotVector = this.createKnotVector();
        this._basisFunctionData = [];
        this.updateKnotVectorAndBasisFunctions();

        this.setCurve(new BSplineCurve(this.p5, this));
        this.setCurveDrawingVisualization(new BSplineVisualization(this.p5, this));
        this.setInfluenceVisForActiveCtrlPt(new VisualizerForCurrentlyActiveBSplineControlPoint(this.p5, this));
        new DegreeControls(this.p5, this, this.controlsContainerId);
    }

    /**
     * called every time the number of control points changes
     */
    protected additionalCtrlPtAmountChangeHandling() {
        this.updateDegree();
        this.updateKnotVectorAndBasisFunctions();
    }

    private updateDegree() {
        if (this.curveType == 'emulated Bézier') {
            this._degree = this.controlPoints.length - 1;
            this.notifyObservers('degreeChanged');
        }
    }

    private updateKnotVectorAndBasisFunctions() {
        this.updateKnotVector();
        this.updateBasisFunctions();
        this.scheduledKnotValueChanges = [];
        this.notifyObservers('knotVectorChanged');
    }

    private updateKnotVector() {
        this._knotVector = this.createKnotVector();
    }

    protected updateBasisFunctions() {
        this._basisFunctionData = this.createBasisFunctions();
    }

    private createKnotVector() {
        // n := (# of control points) - 1
        // k := order of curve
        // side note: p := degree of curve = k - 1
        // m := (# of knots in knotVector T) - 1 = n + k
        // e. g. for a cubic B-spline w/ 5 control points m = 4 + 3 = 7 (which means that there are 8 entries in the knot vector)

        const k = this.degree + 1;
        const n = this.controlPoints.length - 1;
        if (n < 0) {
            return [];
        }
        const m = n + k;

        //for the two "B-Spline knot vector initialization modes", the knots in knot vector equidistant, in other words: m + 1 values in range [0, m], distributed uniformly (same step size between them)
        //that's why the resulting B-Spline curve is then also called *uniform*, btw
        if (this.curveType == 'open') return createArrayOfEquidistantAscendingNumbersInRange(m + 1, this.tMin, this.tMax);
        if (this.curveType == 'clamped' || this.curveType == 'emulated Bézier') {
            const p = this.degree;
            const pPlusOneArr = [...Array(p + 1).keys()];
            const pPlusOneTimesMin = pPlusOneArr.map(_ => this.tMin);
            const pPlusOneTimesMax = pPlusOneArr.map(_ => this.tMax);
            const equidistantValuesBetweenMinAndMax = createArrayOfEquidistantAscendingNumbersInRange(m + 1 - 2 * p, this.tMin, this.tMax).slice(1, -1);
            return [...pPlusOneTimesMin, ...equidistantValuesBetweenMinAndMax, ...pPlusOneTimesMax];
        }

        //effectively not reachable
        //simply return the same as if the mode were 'open B-Spline'
        else return createArrayOfEquidistantAscendingNumbersInRange(m + 1, this.tMin, this.tMax);
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

        if (n < 0) {
            return [];
        }

        let newBasisFunctionData: BasisFunctionData[][] = [[]];//contains the N_{i,k} as actual functions and as LaTeX strings

        //e. g. if there are 4 knots, there are 3 N_{i,0} functions
        for (let i = 0; i < m; i++) {
            newBasisFunctionData[0][i] = {
                basisFunction: (x: number) => {
                    if (t[i] <= x && x < t[i + 1]) return 1;
                    else return 0;
                },
                basisFunctionAsLaTeXString: String.raw`\[N_{${i},0} = ${t[i] == t[i + 1] ? String.raw`\(0 \text{ as } [t_${i}, t_${i + 1}) \text{ does not exist}\)` : String.raw`\begin{cases} 1,& \text{if} t_{${i}} \leq x < t_{${i + 1}} \\ 0,& \text{otherwise} \end{cases} \]`}`
            };
        }

        for (let j = 1; j <= p; j++) {
            newBasisFunctionData[j] = [];
            for (let i = 0; i < newBasisFunctionData[j - 1].length - 1; i++) {
                //we can't divide by zero, so we define the factor for each term a or b of the addition in the equation as 0 if its denominator is 0
                const denominatorOfFactorForA = t[i + j] - t[i];
                const denominatorOfFactorForAZero = denominatorOfFactorForA == 0;
                const denominatorOfFactorForB = t[i + j + 1] - t[i + 1];
                const denominatorOfFactorForBZero = denominatorOfFactorForB == 0;

                newBasisFunctionData[j][i] = {
                    basisFunction: (x: number) => {
                        const a = (x - t[i]) / (denominatorOfFactorForAZero ? 1 : denominatorOfFactorForA) * newBasisFunctionData[j - 1][i].basisFunction(x);
                        const b = (t[i + j + 1] - x) / (denominatorOfFactorForBZero ? 1 : denominatorOfFactorForB) * newBasisFunctionData[j - 1][i + 1].basisFunction(x);
                        return a + b;
                    },
                    basisFunctionAsLaTeXString: String.raw`\[N_{${i},${j}}(t) = \frac{ t - t_{${i}} } { t_{${i + j}} - t_{${i}} } \cdot N_{${i}, ${j - 1}}(t) + \frac{ t_{${i + j + 1}} - t } { t_{${i + j + 1}} - t_{${i + 1}} } \cdot N_{${i + 1}, ${j - 1}}(t) 
                        ${denominatorOfFactorForAZero ? String.raw`t_{${i + j}} - t_{${i}} := 1\text{ as division by zero is not defined }` : ''}
                        ${denominatorOfFactorForBZero ? String.raw`t_{${i + j + 1}} - t_{${i + 1}} := 1\text{ as division by zero is not defined }` : ''}\]`
                }
            }
        }

        //console.log(newBasisFunctionData);
        return newBasisFunctionData;
    }

    /**
     * Returns a point on the B-Spline curve for given p and t using the basis functions computed via Cox-de Boor recursion formula.
     * This method is less efficient than De Boor's algorithm as basis funcitons that are guaranteed to be zero are still computed/evaluated
     * Note:  doesn't check if p is valid, also returns garbage if curve is not defined for given t!
     * 
     * @param p the degree of the basis functions (or simply the degree of the curve)
     * @param t the point where the curve should be evaluated (independent variable of the curve equation formula)
     * @returns point on the curve (or garbage if the curve is not defined at the provided value for t)
     */
    public getPointOnCurveByEvaluatingBasisFunctions(p: number, t: number) {
        return this.controlPoints.map(pt => pt.position).reduce(
            (prev, curr, i) => Vector.add(prev, Vector.mult(curr, this.basisFunctions[p][i](t))), this.p5.createVector(0, 0)
        );
    }

    /**
     * Returns a point on the B-Spline curve using De Boor's algorithm (more efficient than computing and evaluating basis functions explicitly).
     * Only non-zero basis functions are considered (however they aren't computed explicitly)
     * 
     * @returns the point on the B-Spline curve
     */
    public getPointOnCurveWithDeBoorsAlgorithm(t: number): p5.Vector {
        return this.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(t).pt;
    }

    public getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(t: number): DeBoorEvaluationData {
        const p = this.degree;
        const ctrlPtPositions = this.controlPoints.map(pt => pt.position);

        //TODO: Find out how to handle these edge cases, algorithm returns BS for those values
        if (t == this.tMin && this.firstTValueWhereCurveDefined == this.tMin) {
            return {
                pt: ctrlPtPositions[0],
                tempPtsCreatedDuringEvaluation: [[]]
            }
        }
        if (t == this.tMax && this.firstTValueWhereCurveUndefined == this.tMax) {
            return {
                pt: ctrlPtPositions[ctrlPtPositions.length - 1],
                tempPtsCreatedDuringEvaluation: [[]]
            }
        }

        //k := Index of knot interval [t_k, t_{k+1}]that contains t.
        const k = this.knotVector.slice(0, -1).findIndex((k, i) => k <= t && t < this.knotVector[i + 1]);
        if (k == -1) {
            console.warn(`getPointOnCurveUsingDeBoorsAlgorithm() called with invalid value ${t}`);
            return {
                tempPtsCreatedDuringEvaluation: [[]],
                pt: this.p5.createVector(0, 0)
            };
        }
        // console.log('k =', k);

        //If t lies in [t_k, t_{k+1}) and t != t_k, let h = p (i.e., inserting t p times) and s = 0
        //If t = t_k and t_k is a knot of multiplicity s, let h = p - s (i.e., inserting t (p - s) times)
        const s = this.knotVector.filter(knot => knot == t).length;
        // console.log(`multiplicity s of knot ${t}: ${s}`);

        const h = p - s;
        if (h < 0) {
            // console.log(`current knot multiplicity ${s} is bigger than or equal to desired multiplicity ${p}! We don't have to insert ${t} anymore to get its position on the curve!`);
            // console.log(`The position of the point on the curve is simply that of the control point with index k = ${k}!`);
            return {
                tempPtsCreatedDuringEvaluation: [[]],
                pt: ctrlPtPositions[k]
            };
        }
        // console.log(`desired multiplicity is ${p}, we therefore insert ${t} ${h} times`);

        //Copy the affected control points p_{k-s}, p_{k-s-1}, p_{k-s-2}, ..., p_{k-p+1} and p_{k-p} to a new array and rename them as p_{k-s,0}, p_{k-s-1,0}, p_{k-s-2,0}, ..., p_{k-p+1,0}
        const copiedPts = ctrlPtPositions.slice(k - p, k - s + 1).map(pt => pt.copy());
        const ptsPerIteration = [copiedPts];

        let ctrlPtIndex = 0;
        for (let r = 1; r <= h; r++) {
            ptsPerIteration[r] = []
            for (let i = k - p + r; i <= k - s; i++) {
                const alpha = (t - this.knotVector[i]) / (this.knotVector[i + p - r + 1] - this.knotVector[i]);
                // console.log(`a_{${i},${r}} = ${alpha}`);
                ctrlPtIndex = i - k + p;
                ptsPerIteration[r][ctrlPtIndex] = p5.Vector.add(p5.Vector.mult(ptsPerIteration[r - 1][ctrlPtIndex - 1], 1 - alpha), p5.Vector.mult(ptsPerIteration[r - 1][ctrlPtIndex], alpha));
            }
        }

        return {
            pt: ptsPerIteration[h][ctrlPtIndex],
            tempPtsCreatedDuringEvaluation: ptsPerIteration
        };
    }
}