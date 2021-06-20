import p5 from "p5";
import { MyObserver } from "../ui-interfaces";
import { clamp } from "../util";
import { DragVertex } from "../vertex";
import { BasisFunctionData, BSplineDemo, DeBoorEvaluationData } from "./b-spline-curve";
import { DemoChange } from "./base-curve";



interface CtrlPtAndWeight {
    pt: DragVertex,
    weight: number
}

export class NURBSDemo extends BSplineDemo {
    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        super(p5, parentContainerId, baseAnimationSpeedMultiplier);
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
        this.scheduledCtrlPtWeightChanges.push({i, newVal});
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
        super.additionalCtrlPtAmountChangeHandling();
        this.updateCtrlPtsAndWeights();
        this.updateWeightedBasisFunctions();
    }

    private updateCtrlPtsAndWeights() {
        const oldCtrlPts = this.controlPoints.slice();
        this.controlPoints.forEach(pt => {
            //if a control point is new set its weight to default of 1
            if (oldCtrlPts.find(p => p == pt)) pt.position.z = 1;
        });
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
    }

    getPointOnCurveByEvaluatingBasisFunctions(p: number, t: number) {
        return this.controlPoints.map(pt => pt.position).reduce(
            (prev, curr, i) => p5.Vector.add(prev, p5.Vector.mult(curr, this.weightedBasisFunctions[p][i](t))), this.p5.createVector(0, 0)
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
        const data = super.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(t);
        data.pt.x = data.pt.x / data.pt.z;
        data.pt.y = data.pt.y / data.pt.z;
        return data;
    }
}





export class ControlsForControlPointWeights implements MyObserver<DemoChange> {
    private ctrlPtWeightInputElements: HTMLInputElement[] = [];
    private tableContainer: HTMLDivElement | undefined;

    constructor(private nurbsDemo: NURBSDemo, private parentContainerId: string) {
        nurbsDemo.subscribe(this);
        this.updateCtrlPtTable();
    }

    update(data: DemoChange): void {
        if (data == 'controlPointsChanged') {
            this.updateCtrlPtTable();
        }
    }

    updateCtrlPtTable() {
        if (!this.nurbsDemo.valid) {
            if (this.tableContainer) this.tableContainer.style.visibility = 'hidden';
            return;
        }

        this.ctrlPtWeightInputElements = this.nurbsDemo.controlPoints.map((pt, i, arr) => {
            const inputEl = document.createElement('input');
            inputEl.type = 'number';
            inputEl.setAttribute('step', 'any');//deactivates "please enter a valid value in range..." hint

            //this weird looking code allows us to display up to 2 digits (only if necessary) - we have to make it a string again in the end
            inputEl.value = (+(pt.position.z.toFixed(2))).toString();
            inputEl.addEventListener('focus', () => inputEl.value = arr[i].toString());
            inputEl.addEventListener('blur', () => {
                const min = 0;
                const max = Number.MAX_VALUE;
                const value = clamp(+inputEl.value, min, max);
                this.nurbsDemo.scheduleCtrlPtWeightChange(i, value);
                inputEl.value = value.toString();
            });

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

        const parentContainer = document.getElementById(this.parentContainerId);
        if (!parentContainer) {
            console.warn(`couldn't create table for control point weights, parent container id invalid!`);
            return;
        }

        if (this.tableContainer) parentContainer.removeChild(this.tableContainer);
        this.tableContainer = document.createElement('div');
        this.tableContainer.id = 'control-point-weight-table-container';

        const ctrlPtWeightTable = document.createElement('table');
        ctrlPtWeightTable.appendChild(headerRow);
        ctrlPtWeightTable.appendChild(knotInputRow);
        ctrlPtWeightTable.id = 'control-point--weight-table';

        this.tableContainer.appendChild(ctrlPtWeightTable);
        parentContainer.appendChild(this.tableContainer);

        MathJax.typeset(ctrlPtHeadingIds);
    }
}