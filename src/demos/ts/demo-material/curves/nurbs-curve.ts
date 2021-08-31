import p5 from "p5";
import { Sketch } from "../../utils/sketch";
import { MyObserver } from "../../utils/ui";
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../utils/misc";
import { clamp } from "../../utils/math";
import { drawCircle, drawLineVector, drawLineXYCoords, drawPointVector, drawSquare, renderTextWithSubscript } from "../../utils/p5";
import { DragVertex } from "../../utils/vertex";
import { BasisFunctionData, BSplineDemo, BSplineGraphPlotter, CurveData } from "./b-spline-curve";
import { Curve, CurveDrawingVisualization, DemoChange } from "./base-curve";





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

    private weightedBasisFunctionData: BasisFunctionData[][] = [[]];
    public get weightedBasisFunctions() {
        return this.weightedBasisFunctionData.map(j => j.map(d => d.basisFunction));
    }

    public get weightedBasisFunctionsAsLaTeXString() {
        return this.weightedBasisFunctionData.map(j => j.map(d => d.basisFunctionAsLaTeXString));
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
        let newWeightedBasisFunctionData: BasisFunctionData[][] = [];
        for (let j = 0; j < this.basisFunctionData.length; j++) {
            const basisFuncs = this.basisFunctionData[j].map(d => d.basisFunction);
            const weightedBasisFuncSum = (x: number) => basisFuncs.reduce((prev, curr) => prev + curr(x), 0);
            newWeightedBasisFunctionData[j] = basisFuncs.map((f, i) => ({
                basisFunction: (x: number) => (f(x) * this.controlPoints[i].position.z) / weightedBasisFuncSum(x),
                basisFunctionAsLaTeXString: ''
            }));
        }

        this.weightedBasisFunctionData = newWeightedBasisFunctionData;
    }

    getPointOnCurveByEvaluatingWeightedBasisFunctions(p: number, t: number) {
        return this.controlPoints.map(pt => pt.position).reduce(
            (prev, curr, i) => p5.Vector.add(prev, p5.Vector.mult(curr, this.weightedBasisFunctions[p][i](t))), this.p5.createVector(0, 0)
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





class NURBSCurve extends Curve implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private nurbsDemo: NURBSDemo) {
        super(p5, nurbsDemo);
        this.noOfEvaluationSteps = 400;
        this.nurbsDemo.subscribe(this);
    }

    public draw() {
        if (!this.demo.valid) return;
        const points = this.evaluationSteps.map(t => this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(t));
        if (this.nurbsDemo.degree === 0) {
            points.slice(0, -1).forEach(p => drawCircle(this.p5, p, this.color, this.demo.basePointDiameter * 1.25));
        } else {
            points.slice(0, -1).forEach((p, i) => drawLineVector(this.p5, p, points[i + 1], this.color, this.demo.baseLineWidth * 2));
        }
    }

    update(data: DemoChange): void {
        if (data === 'rangeOfTChanged' || 'knotVectorChanged' || 'degreeChanged') this.evaluationSteps = this.calculateEvaluationSteps();
    }
}



class NURBSVisualization extends CurveDrawingVisualization {
    private knotMarkerColor: p5.Color = this.p5.color(150);

    //used if reference to sketch is not given
    private fallBackSketchBackgroundColor: p5.Color = this.p5.color(230);
    
    constructor(p5: p5, private nurbsDemo: NURBSDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color, private sketch?: Sketch) {
        super(p5, nurbsDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        if (this.nurbsDemo.degree >= 2) {
            //TODO: properly visualize recursive process for evaluating curve
            // const points = this.bSplineDemo.controlPoints;
            // points.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt.position, points[i + 1].position, this.color, this.bSplineDemo.baseLineWidth));
        }

        if (!this.demo.valid) return;

        this.drawInfluenceOfCurrentlyActiveCtrlPt();

        if (this.nurbsDemo.degree > 0) {
            this.drawKnotMarkers();
        }

        if (this.nurbsDemo.curveDefinedAtCurrentT) {
            this.drawPointAtT(this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(this.nurbsDemo.t));
        } else {
            renderTextWithSubscript(
                this.p5,
                `This ${this.nurbsDemo.open ? 'open' : 'clamped'} NURBS curve is only defined in the interval [t_{${this.nurbsDemo.firstKnotIndexWhereCurveDefined}}, t_{${this.nurbsDemo.firstKnotIndexWhereCurveUndefined}}) = [${+this.nurbsDemo.firstTValueWhereCurveDefined.toFixed(2)}, ${+this.nurbsDemo.firstTValueWhereCurveUndefined.toFixed(2)})`,
                10, this.p5.height - 20
            );
        }
    }

    private drawKnotMarkers() {
        let multiplicity = 0;
        this.nurbsDemo.knotVector.forEach((t, i, arr) => {
            if (arr[i - 1] !== undefined && arr[i - 1] !== t) multiplicity = 0;
            multiplicity += 1;
            if (i < this.nurbsDemo.firstKnotIndexWhereCurveDefined || i > this.nurbsDemo.firstKnotIndexWhereCurveUndefined || arr[i + 1] && arr[i + 1] == t) return;
            const knotPosition = this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(t);
            drawSquare(
                this.p5,
                knotPosition,
                this.knotMarkerColor,
                this.nurbsDemo.basePointDiameter * 0.75
            );
            if (this.nurbsDemo.showPointLabels) renderTextWithSubscript(this.p5, `t=${+(this.nurbsDemo.knotVector[i].toFixed(2))}${multiplicity > 1 && ((arr[i + 1] && arr[i + 1] !== t) || arr[i + 1] == undefined) ? ` (${multiplicity}x)` : ''}`, knotPosition.x - 20, knotPosition.y - 10);
        });
    }

    private drawPointAtT(pointPos: p5.Vector) {
        drawCircle(
            this.p5,
            pointPos,
            this.colorOfPointOnCurve,
            this.nurbsDemo.basePointDiameter * 1.5
        );
    }

    private drawInfluenceOfCurrentlyActiveCtrlPt() {
        const ctrlPts = this.nurbsDemo.controlPoints.slice();
        const activeCtrlPtIndex = ctrlPts.findIndex(pt => pt.hovering || pt.dragging);
        if (activeCtrlPtIndex == -1) return;
        const i = activeCtrlPtIndex;
        const activeCtrlPt = ctrlPts[i];
        const p = this.nurbsDemo.degree;
        const basisFunction = this.nurbsDemo.weightedBasisFunctions[p][activeCtrlPtIndex];
        const knotVector = this.nurbsDemo.knotVector;

        //from https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-basis.html we know:
        //Basis function N_{i,p}(u) is non-zero on [u_i, u_{i+p+1}). Or, equivalently, N_{i,p}(u) is non-zero on p+1 knot spans [u_i, u_{i+1}), [u_{i+1}, u_{i+2}), ..., [u_{i+p}, u_{i+p+1}).
        const tValues = createArrayOfEquidistantAscendingNumbersInRange(100, knotVector[Math.max(i, this.nurbsDemo.firstKnotIndexWhereCurveDefined)], knotVector[Math.min(i + p + 1, this.nurbsDemo.firstKnotIndexWhereCurveUndefined)]);
        const pointsAndActiveCtrlPtInfluence = tValues.map(t => ({ pos: this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(t), activeCtrlPtInfluence: basisFunction(t) }));
        pointsAndActiveCtrlPtInfluence.slice(0, -1).forEach((p, i) => {
            //draw line in sketch's background color to make "regular" black line disappear
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, this.sketch?.backgroundColor ?? this.fallBackSketchBackgroundColor, this.demo.baseLineWidth * 2);
            //draw line that gets thicker the more influence the control point has on the shape of the curve
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, activeCtrlPt.color, this.demo.baseLineWidth * 2 * p.activeCtrlPtInfluence);
        });
    }
}






export class ControlsForControlPointWeights implements MyObserver<DemoChange> {
    private ctrlPtWeightInputElements: HTMLInputElement[] = [];
    private tableContainer: HTMLDivElement;
    private controlsContainer: HTMLDivElement;

    constructor(private nurbsDemo: NURBSDemo, private parentContainerId: string, showLabel: boolean = true) {
        nurbsDemo.subscribe(this);
        this.tableContainer = document.createElement('div');
        this.tableContainer.id = 'control-point-weight-table-container';

        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'control-point-weight-controls-container';

        if (showLabel) {
            const label = document.createElement('div');
            label.innerText = 'control point weights:';
            label.id = 'control-point-weight-controls-label';
            this.controlsContainer.appendChild(label);
        }
        this.controlsContainer.appendChild(this.tableContainer);

        const parentContainer = document.getElementById(this.parentContainerId);
        if (!parentContainer) {
            console.warn(`couldn't create table for control point weights, parent container id invalid!`);
            return;
        }
        parentContainer.appendChild(this.controlsContainer);

        

        this.updateCtrlPtTable();
    }

    update(data: DemoChange): void {
        if (data == 'controlPointsChanged') {
            this.updateCtrlPtTable();
        }
    }

    updateCtrlPtTable() {
        if (!this.nurbsDemo.valid) {
            this.controlsContainer.style.visibility = 'hidden';
            return;
        }
        else {
            this.controlsContainer.style.removeProperty('visibility');
        }

        this.ctrlPtWeightInputElements = this.nurbsDemo.controlPoints.map((pt, i, arr) => {
            const inputEl = document.createElement('input');
            inputEl.type = 'number';
            inputEl.setAttribute('step', 'any');//deactivates "please enter a valid value in range..." hint

            //this weird looking code allows us to display up to 2 digits (only if necessary) - we have to make it a string again in the end
            inputEl.value = (+(pt.position.z.toFixed(2))).toString();

            inputEl.addEventListener('focus', () => inputEl.value = arr[i].position.z.toString());
            const updateValue = () => {
                const min = 0;
                const max = Number.MAX_VALUE;
                const value = clamp(+inputEl.value, min, max);
                this.nurbsDemo.scheduleCtrlPtWeightChange(i, value);
                inputEl.value = value.toString();
            };

            inputEl.addEventListener('blur', () => updateValue());

            inputEl.addEventListener('keydown', e => {
                if (e.key == 'Enter') inputEl.blur();
            })

            return inputEl;
        });

        const headerRow = document.createElement('tr');
        let ctrlPtHeadingIds: string[] = [];
        this.ctrlPtWeightInputElements.forEach((_, i) => {
            const th = document.createElement('th');
            th.innerText = String.raw`\(P_{${i}}\)`;
            headerRow.appendChild(th);

            const id = `control-point-${i}`;
            th.id = id;
            ctrlPtHeadingIds.push(`#${id}`);
        });

        const knotInputRow = document.createElement('tr');

        this.ctrlPtWeightInputElements.forEach(k => {
            const td = document.createElement('td');
            td.appendChild(k);
            knotInputRow.appendChild(td);
        });

        const ctrlPtWeightTable = document.createElement('table');
        ctrlPtWeightTable.appendChild(headerRow);
        ctrlPtWeightTable.appendChild(knotInputRow);
        ctrlPtWeightTable.id = 'control-point--weight-table';

        this.tableContainer.innerHTML = '';
        this.tableContainer.appendChild(ctrlPtWeightTable);

        MathJax.typeset(ctrlPtHeadingIds);
    }
}






export class NURBSGraphPlotter extends BSplineGraphPlotter {
    private NURBSDataPoints: CurveData[] = [];

    protected get yAxisLabel() {
        return this._yAxisLabel;
    }

    _yAxisLabel: string;

    constructor(p5: p5, private nurbsDemo: NURBSDemo) {
        super(p5, nurbsDemo);
        this._yAxisLabel = '  y';//the spaces are a dirty quickfix to make label appear more to the right
    }

    protected computeCurves() {
        this.minYValue = 0;
        this.maxYValue = 0;
        if (!this.nurbsDemo || !this.nurbsDemo.valid) return;
        //compute bSplineCurves
        super.computeCurves();
        if (this.xValues.length < 1) return;
        const ctrlPts = this.nurbsDemo.controlPoints;
        const weightedBasisFunctions = this.nurbsDemo.weightedBasisFunctions;
        const degree = this.nurbsDemo.degree;

        this.NURBSDataPoints = ctrlPts.map((pt, i) => ({
            yValues: this.xValues.map(x => {
                const yVal = weightedBasisFunctions[degree][i](x);
                if (yVal < this.minYValue) this.minYValue = yVal;
                if (yVal > this.maxYValue) this.maxYValue = yVal;
                return yVal;
            }),
            controlPoint: pt
        }));
    }


    protected drawCurves() {
        //draw regular B-Spline curves dotted
        this.bSplineDataPoints.forEach(d => {
            const pointColor = d.controlPoint.color;
            const pointThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i) => {
                if (i % 7 < 6) return;
                const x = this.xValues[i] / (this.nurbsDemo.tMax - this.nurbsDemo.tMin);
                const x1 = x * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this.axisRulerOffsetFromBorder - this.normalize(y) * this.distMinToMaxYAxis;
                drawPointVector(this.p5, this.p5.createVector(x1, y1), pointColor, pointThickness);
            });
        });

        //draw weighted basis function curves in regular fashion
        this.NURBSDataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1) return;
                const x = this.xValues[i] / (this.nurbsDemo.tMax - this.nurbsDemo.tMin);
                const nextY = yVals[i + 1];
                const nextX = this.xValues[i + 1] / (this.nurbsDemo.tMax - this.nurbsDemo.tMin);
                const x1 = x * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this.axisRulerOffsetFromBorder - this.normalize(y) * this.distMinToMaxYAxis;
                const x2 = nextX * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this.axisRulerOffsetFromBorder - this.normalize(nextY) * this.distMinToMaxYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });
        
    }

    private normalize(yVal: number) {
        return (yVal - this.minYValue) / (this.maxYValue - this.minYValue);
    }

    protected renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add more control points to the canvas on the left!\nThe weighted and regular basis functions will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}