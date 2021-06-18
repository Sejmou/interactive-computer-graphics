import p5, { Vector } from 'p5';
import { Sketch } from '../sketch';
import { MyObserver } from '../ui-interfaces';
import { clamp, createArrayOfEquidistantAscendingNumbersInRange, directionVector, drawCircle, drawLineVector, drawSquare, renderTextWithSubscript } from '../util';
import { ControlPointInfluenceData, ControlPointInfluenceVisualization as ControlPointInfluenceBarVisualization, Curve, CurveDemo, CurveDrawingVisualization, DemoChange } from './base-curve';



interface BasisFunctionData {
    basisFunction: (x: number) => number,
    basisFunctionAsLaTeXString: string
}

interface BSplineEvaluationData {
    tempPtsCreatedDuringEvaluation: p5.Vector[][],
    pt: p5.Vector
};

export type CurveType = 'open B-Spline' | 'clamped B-Spline' | 'Bézier';

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

    private basisFunctionData: BasisFunctionData[][];
    /**
     * A spline function of order n is a piecewise polynomial function of degree n-1 in a variable x.
     * B-splines of order n are basis functions for spline functions of the same order defined over the same knots,
     * meaning that all possible spline functions can be built from a linear combination of B-splines, and there is only one unique combination for each spline function.
     */
    public get basisFunctions() {
        return this.basisFunctionData.map(j => j.map(d => d.basisFunction));
    }
    /**
     * The B-Spline curve's basis functions as an array of arrays of LaTeX strings
     */
    public get basisFunctionsAsLaTeXString() {
        return this.basisFunctionData.map(j => j.map(d => d.basisFunctionAsLaTeXString));
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
            this.scheduledKnotValueChanges.forEach(c => {
                if (c.i == 0) this._tMin = c.newVal;
                if (c.i == this.knotVector.length - 1) this._tMax = c.newVal;
                this.knotVector[c.i] = c.newVal
            });
            this.scheduledKnotValueChanges = [];

            this.updateBasisFunctions();

            this.notifyObservers('knotVectorChanged');
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

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call
        //they have to be set in constructor, setting them in subclass constructor is too late...


        this.minDegree = 0;
        this._degree = 2;

        this.scheduledKnotValueChanges = [];
        this._curveType = 'clamped B-Spline';

        this._knotVector = this.createKnotVector();
        this.basisFunctionData = [];
        this.updateKnotVectorAndBasisFunctions();

        this.setCurve(new BSplineCurve(this.p5, this));
        this.setCurveDrawingVisualization(new BSplineVisualization(this.p5, this));
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
        if (this.curveType == 'Bézier') {
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

    private updateBasisFunctions() {
        this.basisFunctionData = this.createBasisFunctions();
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
        if (this.curveType == 'open B-Spline') return createArrayOfEquidistantAscendingNumbersInRange(m + 1, this.tMin, this.tMax);
        if (this.curveType == 'clamped B-Spline' || this.curveType == 'Bézier') {
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

    public getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(t: number): BSplineEvaluationData {
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



class BSplineCurve extends Curve implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo) {
        super(p5, bSplineDemo);
        this.noOfEvaluationSteps = 400;
        this.bSplineDemo.subscribe(this);
    }

    public draw() {
        if (!this.demo.valid) return;
        const points = this.evaluationSteps.map(t => this.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t));
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



class BSplineVisualization extends CurveDrawingVisualization {
    private knotMarkerColor: p5.Color = this.p5.color(150);

    //used if reference to sketch is not given
    private fallBackSketchBackgroundColor: p5.Color = this.p5.color(230);

    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color, private sketch?: Sketch) {
        super(p5, bSplineDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        if (this.bSplineDemo.degree >= 2) {
            //TODO: properly visualize recursive process for evaluating curve
            // const points = this.bSplineDemo.controlPoints;
            // points.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt.position, points[i + 1].position, this.color, this.bSplineDemo.baseLineWidth));
        }

        if (!this.demo.valid) return;

        this.drawInfluenceOfCurrentlyActiveCtrlPt();

        if (this.bSplineDemo.degree > 0) {
            this.drawKnotMarkers();
        }

        if (this.bSplineDemo.curveDefinedAtCurrentT) {
            const deBoorData = this.bSplineDemo.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(this.bSplineDemo.t);
            this.drawDeBoorVisualization(deBoorData.tempPtsCreatedDuringEvaluation);
            this.drawPointAtT(deBoorData.pt);
        } else {
            renderTextWithSubscript(
                this.p5,
                `This ${this.bSplineDemo.open ? 'open' : 'clamped'} B-Spline curve is only defined in the interval [t_{${this.bSplineDemo.firstKnotIndexWhereCurveDefined}}, t_{${this.bSplineDemo.firstKnotIndexWhereCurveUndefined}}) = [${+this.bSplineDemo.firstTValueWhereCurveDefined.toFixed(2)}, ${+this.bSplineDemo.firstTValueWhereCurveUndefined.toFixed(2)})`,
                10, this.p5.height - 20
            );
        }
    }

    private drawKnotMarkers() {
        this.bSplineDemo.knotVector.forEach((t, i) => {
            if (i < this.bSplineDemo.firstKnotIndexWhereCurveDefined || i > this.bSplineDemo.firstKnotIndexWhereCurveUndefined) return;
            const knotPosition = this.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t);
            drawSquare(
                this.p5,
                knotPosition,
                this.knotMarkerColor,
                this.bSplineDemo.basePointDiameter * 0.75
            );
            if (this.bSplineDemo.showPointLabels) renderTextWithSubscript(this.p5, `t_{${i}}`, knotPosition.x - 20, knotPosition.y - 10);
        });
    }

    private drawPointAtT(pointPos: p5.Vector) {
        drawCircle(
            this.p5,
            pointPos,
            this.colorOfPointOnCurve,
            this.bSplineDemo.basePointDiameter * 1.5
        );
    }

    private drawDeBoorVisualization(tempPtsCreatedDuringEvaluation: p5.Vector[][]) {
        if (tempPtsCreatedDuringEvaluation.length <= 2) {//only a single iteration or none was needed to get the position of the point (note: iteration 0 is just copying the control points, no interpolations are made)
            return;
        }
        tempPtsCreatedDuringEvaluation.forEach((iteration) => {
            iteration.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt, iteration[i + 1], this.color, this.bSplineDemo.baseLineWidth));
            iteration.forEach(pt => drawCircle(this.p5, pt, this.color, this.bSplineDemo.basePointDiameter));
        });
    }

    private drawInfluenceOfCurrentlyActiveCtrlPt() {
        const ctrlPts = this.bSplineDemo.controlPoints.slice();
        const activeCtrlPtIndex = ctrlPts.findIndex(pt => pt.hovering || pt.dragging);
        if (activeCtrlPtIndex == -1) return;
        const i = activeCtrlPtIndex;
        const activeCtrlPt = ctrlPts[i];
        const p = this.bSplineDemo.degree;
        const basisFunction = this.bSplineDemo.basisFunctions[p][activeCtrlPtIndex];
        const knotVector = this.bSplineDemo.knotVector;

        //from https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-basis.html we know:
        //Basis function N_{i,p}(u) is non-zero on [u_i, u_{i+p+1}). Or, equivalently, N_{i,p}(u) is non-zero on p+1 knot spans [u_i, u_{i+1}), [u_{i+1}, u_{i+2}), ..., [u_{i+p}, u_{i+p+1}).
        const tValues = createArrayOfEquidistantAscendingNumbersInRange(100, knotVector[Math.max(i, this.bSplineDemo.firstKnotIndexWhereCurveDefined)], knotVector[Math.min(i + p + 1, this.bSplineDemo.firstKnotIndexWhereCurveUndefined)]);
        const pointsAndActiveCtrlPtInfluence = tValues.map(t => ({ pos: this.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t), activeCtrlPtInfluence: basisFunction(t) }));
        pointsAndActiveCtrlPtInfluence.slice(0, -1).forEach((p, i) => {
            //draw line in sketch's background color to make "regular" black line disappear
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, this.sketch?.backgroundColor ?? this.fallBackSketchBackgroundColor, this.demo.baseLineWidth * 2);
            //draw line that gets thicker the more influence the control point has on the shape of the curve
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, activeCtrlPt.color, this.demo.baseLineWidth * 2 * p.activeCtrlPtInfluence);
        });
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
            this.updateDecreaseDegreeButtonDisabled();
        }
        if (data === 'curveTypeChanged') {
            if (this.demo.curveType == 'Bézier') {
                const disabledHoverText = 'For Bézier curves the degree is always n (depends on the number of control points)';
                this.increaseDegreeButton.attribute('disabled', 'true');
                this.decreaseDegreeButton.attribute('disabled', 'true');
                this.increaseDegreeButton.attribute('title', disabledHoverText);
                this.decreaseDegreeButton.attribute('title', disabledHoverText);
            }
            else {
                this.increaseDegreeButton.removeAttribute('title');
                this.decreaseDegreeButton.removeAttribute('title');
                this.increaseDegreeButton.removeAttribute('disabled');
                this.updateDecreaseDegreeButtonDisabled();
            }
        }
    }

    updateDecreaseDegreeButtonDisabled() {
        if (this.demo.degree === this.demo.minDegree) {
            this.decreaseDegreeButton.attribute('disabled', 'true');
        } else if (!(this.demo.curveType == 'Bézier')) (this.decreaseDegreeButton.removeAttribute('disabled'));
    }

    private increaseDegreeButtonClicked() {
        this.demo.increaseDegree();
    }

    private decreaseDegreeButtonClicked() {
        this.demo.decreaseDegree();
    }

    private updateVisibility() {
        this.visible = this.demo.valid;
    }

    private updateDegreeText() {
        this.degreeText.html(`degree: ${this.demo.degree}`);
    }
}





/**
 * Visualization for the influence of the B-Spline's control points (de boor points) using bars
 */
export class DeBoorControlPointInfluenceVisualization extends ControlPointInfluenceBarVisualization implements MyObserver<DemoChange> {
    private bSplineDemo: BSplineDemo;

    constructor(p5: p5, bSplineDemo: BSplineDemo, visible: boolean = true) {
        super(p5, bSplineDemo, visible);
        this.bSplineDemo = bSplineDemo;
        bSplineDemo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data == 'controlPointsChanged' || data == 'degreeChanged' || data == 'knotVectorChanged' || data == 'rangeOfTChanged') this.updateInfluenceDataAndBars();
    }

    protected getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[] {
        return this.bSplineDemo.controlPoints.map((c, i) => {
            return {
                controlPoint: c,
                currentCtrlPtInfluence: () => this.bSplineDemo.basisFunctions[this.bSplineDemo.degree][i](this.bSplineDemo.t)
            }
        });
    }
}





export class KnotVectorControls implements MyObserver<DemoChange> {
    private knotInputElements: HTMLInputElement[] = [];
    private tableContainer: HTMLDivElement | undefined;

    constructor(private bSplineDemo: BSplineDemo, private parentContainerId: string) {
        bSplineDemo.subscribe(this);
        this.updateKnotVectorDisplay();
    }

    update(data: DemoChange): void {
        if (data == 'knotVectorChanged') {
            this.updateKnotVectorDisplay();
        }
    }

    updateKnotVectorDisplay() {
        if (!this.bSplineDemo.valid) {
            if (this.tableContainer) this.tableContainer.style.visibility = 'hidden';
            return;
        }

        this.knotInputElements = this.bSplineDemo.knotVector.map((k, i, arr) => {
            const inputEl = document.createElement('input');
            inputEl.type = 'number';
            inputEl.setAttribute('step', 'any');//deactivates "please enter a valid value in range..." hint

            //this weird looking code allows us to display up to 2 digits (only if necessary) - we have to make it a string again in the end
            inputEl.value = (+(k.toFixed(2))).toString();
            inputEl.addEventListener('focus', () => inputEl.value = arr[i].toString());
            inputEl.addEventListener('blur', () => {
                const min = arr[i - 1] ?? 0;
                const max = arr[i + 1] ?? Number.MAX_VALUE;
                const value = clamp(+inputEl.value, min, max);
                this.bSplineDemo.scheduleKnotValueChange(i, value);
                inputEl.value = value.toString();
            });

            return inputEl;
        });

        const headerRow = document.createElement('tr');
        let knotHeadingIds: string[] = [];
        this.knotInputElements.forEach((_, i) => {
            const th = document.createElement('th');
            th.innerText = String.raw`\(t_{${i}}\)`;
            headerRow.appendChild(th);

            const id = `knot-${i}`;
            th.id = id;
            knotHeadingIds.push(`#${id}`);
        });

        const knotInputRow = document.createElement('tr');

        this.knotInputElements.forEach(k => {
            const td = document.createElement('td');
            td.appendChild(k);
            knotInputRow.appendChild(td);
        });

        const parentContainer = document.getElementById(this.parentContainerId);
        if (!parentContainer) {
            console.warn(`couldn't create table for knot vector, parent container id invalid!`);
            return;
        }

        if (this.tableContainer) parentContainer.removeChild(this.tableContainer);
        this.tableContainer = document.createElement('div');
        this.tableContainer.id = 'knot-table-container';

        const table = document.createElement('table');
        table.appendChild(headerRow);
        table.appendChild(knotInputRow);
        table.id = 'knot-table';

        this.tableContainer.appendChild(table);
        parentContainer.appendChild(this.tableContainer);

        MathJax.typeset(knotHeadingIds);
    }
}





export class CurveTypeControls implements MyObserver<DemoChange> {
    private radioButtons: HTMLInputElement[] = [];
    private checkBoxForm: HTMLFormElement;
    private container: HTMLDivElement;

    constructor(private bSplineDemo: BSplineDemo, private parentContainerId: string) {
        bSplineDemo.subscribe(this);

        const formFieldName = 'curveType';
        this.radioButtons = [...Array(3)].map((_, i) => {
            const inputEl = document.createElement('input');
            inputEl.type = 'radio';
            inputEl.name = formFieldName;
            inputEl.id = `radio-btn-${i}`;

            let value: CurveType;
            if (i == 0) value = 'open B-Spline';
            else if (i == 1) value = 'clamped B-Spline';
            else value = 'Bézier';
            inputEl.value = value;

            return inputEl;
        });

        this.checkBoxForm = document.createElement('form');
        this.checkBoxForm.addEventListener('change', () => {
            const currVal = new FormData(this.checkBoxForm).get(formFieldName);
            if (currVal) {
                this.bSplineDemo.curveType = currVal.toString() as CurveType;
            } else {
                console.warn(`Could not find form field ${formFieldName}`);
            }
        });
        // this.checkBoxForm.style.display = 'flex';
        // this.checkBoxForm.style.flexDirection = 'row';
        // this.checkBoxForm.style.gap = '25px';

        this.radioButtons.forEach(b => {
            const container = document.createElement('div');
            const label = document.createElement('label');
            label.appendChild(b);

            const span = document.createElement('span');
            span.innerText = b.value;
            label.appendChild(span);

            container.appendChild(label);
            this.checkBoxForm.appendChild(container);
        });

        this.container = document.createElement('div');
        // this.container.style.display = 'flex';
        // this.container.style.gap = '25px';
        const desc = document.createElement('span');
        desc.innerText = 'curve type:';

        this.container.appendChild(desc);
        this.container.appendChild(this.checkBoxForm);

        const parentContainer = document.getElementById(this.parentContainerId);
        if (!parentContainer) {
            console.warn(`couldn't create table for knot vector, parent container id invalid!`);
            return;
        }
        parentContainer.appendChild(this.container);

        this.updateVisibility();
        this.updateSelectedCheckboxes();
    }

    update(data: DemoChange): void {
        if (data == 'curveTypeChanged') this.updateSelectedCheckboxes();
        this.updateVisibility();
    }

    private updateVisibility() {
        if (!this.bSplineDemo.valid) {
            this.container.style.visibility = 'hidden';
            return;
        }
        this.container.style.removeProperty('visibility');
    }

    updateSelectedCheckboxes() {
        this.radioButtons.forEach(b => b.checked = b.value == this.bSplineDemo.curveType);
    }
}