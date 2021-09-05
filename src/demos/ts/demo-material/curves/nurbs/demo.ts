import p5 from "p5";
import { DragVertex } from "../../../utils/vertex";
import { BasisFunctionData, BSplineDemo } from "../b-spline/demo";
import { NURBSVisualization } from "./curve-drawing-vis";
import { NURBSCurve } from "./curve";



export class NURBSDemo extends BSplineDemo {
    /**
     * storing ctrlPts after update in here in order to be able to recognize if a ctrlPt is new -> we then have to initialize its weight (in {@link updateCtrlPtWeights()} )
     */
    private oldCtrlPts: DragVertex[];

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        super(p5, parentContainerId, baseAnimationSpeedMultiplier);
        this.setCurve(new NURBSCurve(this.p5, this));
        this.setCurveDrawingVisualization(new NURBSVisualization(this.p5, this));
        this.oldCtrlPts = this.controlPoints.slice();
    }

    private weightedBasisFunctionData: BasisFunctionData[] = [];
    public get weightedBasisFunctions() {
        return this.weightedBasisFunctionData.map(d => d.basisFunction);
    }

    public get weightedBasisFunctionsAsLaTeXString() {
        return this.weightedBasisFunctionData.map(d => d.basisFunctionAsLaTeXString);
    }

    private scheduledCtrlPtWeightChanges: { i: number, newVal: number }[] = [];

    public scheduleCtrlPtWeightChange(i: number, newVal: number) {
        if (i < 0 || i > this.controlPoints.length - 1) {
            console.error('invalid index for control point weight change:', i);
            return;
        }
        this.scheduledCtrlPtWeightChanges.push({ i, newVal });
    }

    draw() {
        super.draw();
        if (this.scheduledCtrlPtWeightChanges.length > 0) {
            this.scheduledCtrlPtWeightChanges.forEach(c => this._controlPoints[c.i].position.z = c.newVal);
            this.scheduledCtrlPtWeightChanges = [];

            this.updateWeightedBasisFunctions();

            this.notifyObservers('knotVectorChanged');
        }
    }

    additionalCtrlPtAmountChangeHandling() {
        this.updateCtrlPtWeights();
        super.additionalCtrlPtAmountChangeHandling();
    }

    protected updateBasisFunctions() {
        //update "regular" basis functions
        super.updateBasisFunctions();
        this.updateWeightedBasisFunctions();
    }

    private updateCtrlPtWeights() {
        this.controlPoints.forEach(pt => {
            //if a control point is new set its weight to default of 1
            if (!this.oldCtrlPts.find(p => p == pt)) pt.position.z = 1;
        });
        this.oldCtrlPts = this.controlPoints.slice();
    }

    private updateWeightedBasisFunctions() {
        let newWeightedBasisFunctionData: BasisFunctionData[] = [];
        const basisFuncs = this.basisFunctions;
        const weightedBasisFuncSum = (x: number) => basisFuncs.reduce((prev, curr) => prev + curr(x), 0);
        newWeightedBasisFunctionData = basisFuncs.map((f, i) => ({
            basisFunction: (x: number) => (f(x) * this.controlPoints[i].position.z) / weightedBasisFuncSum(x),
            basisFunctionAsLaTeXString: 'TODO: add this'
        }));

        this.weightedBasisFunctionData = newWeightedBasisFunctionData;
    }

    getPointOnCurveByEvaluatingWeightedBasisFunctions(t: number) {
        return this.controlPoints.map(pt => pt.position).reduce(
            (prev, curr, i) => p5.Vector.add(prev, p5.Vector.mult(curr, this.weightedBasisFunctions[i](t))), this.p5.createVector(0, 0)
        );
    }

    /**
     * very similar to {@link BSplineDemo#getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo()} with the only notable difference that the control point weights are also respected. 
     * 
     * @returns the point on the B-Spline curve
     */
    public getPointOnCurveUsingDeBoorWithCtrlPtWeights(t: number): p5.Vector {
        // the implementation is mostly copied from getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo() of the parent class
        // however, we only return the point on the curve (not the temporary control points as there is no useful way to visualize them)
        // important differences are marked with a comment

        const p = this.degree;
        const ctrlPtPositions = this.controlPoints.map(pt => pt.position);

        if (t == this.tMin && this.firstTValueWhereCurveDefined == this.tMin) return ctrlPtPositions[0];
        if (t == this.tMax && this.firstTValueWhereCurveUndefined == this.tMax) return ctrlPtPositions[ctrlPtPositions.length - 1];

        //k := Index of knot interval [t_k, t_{k+1}]that contains t.
        const k = this.knotVector.slice(0, -1).findIndex((k, i) => k <= t && t < this.knotVector[i + 1]);
        if (k == -1) {
            console.warn(`getPointOnCurveWithDeBoorCtrlPtWeights() called with invalid value ${t}`);
            return this.p5.createVector(0, 0);
        }

        //If t lies in [t_k, t_{k+1}) and t != t_k, let h = p (i.e., inserting t p times) and s = 0
        //If t = t_k and t_k is a knot of multiplicity s, let h = p - s (i.e., inserting t (p - s) times)
        const s = this.knotVector.filter(knot => knot == t).length;
        // console.log(`multiplicity s of knot ${t}: ${s}`);

        const h = p - s;
        if (h < 0) {
            // console.log(`current knot multiplicity ${s} is bigger than or equal to desired multiplicity ${p}! We don't have to insert ${t} anymore to get its position on the curve!`);
            // console.log(`The position of the point on the curve is simply that of the control point with index k = ${k}!`);
            return ctrlPtPositions[k];
        }
        // console.log(`desired multiplicity is ${p}, we therefore insert ${t} ${h} times`);

        //Copy the affected control points p_{k-s}, p_{k-s-1}, p_{k-s-2}, ..., p_{k-p+1} and p_{k-p} to a new array and rename them as p_{k-s,0}, p_{k-s-1,0}, p_{k-s-2,0}, ..., p_{k-p+1,0}
        const copiedPts = ctrlPtPositions.slice(k - p, k - s + 1).map(pt => pt.copy());
        

        //IMPORTANT difference to standard de Boor's algorithm
        //multiply x and y of each ctrlPt with z (ctrlPt weight!)
        copiedPts.forEach( pt => {
            pt.x *= pt.z;
            pt.y *= pt.z;
        });

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

        //IMPORTANT difference to standard de Boor's algorithm
        //convert homogeneous representation of position on curve back
        const ptToReturn = ptsPerIteration[h][ctrlPtIndex];
        ptToReturn.x /= ptToReturn.z;
        ptToReturn.y /= ptToReturn.z;

        return ptToReturn;
    }
}