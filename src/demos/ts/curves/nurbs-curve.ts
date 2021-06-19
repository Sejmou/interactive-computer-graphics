import p5 from "p5";
import { MyObserver } from "../ui-interfaces";
import { clamp } from "../util";
import { DragVertex } from "../vertex";
import { BasisFunctionData, BSplineDemo } from "./b-spline-curve";
import { DemoChange } from "./base-curve";



interface CtrlPtAndWeight {
    pt: DragVertex,
    weight: number
}

export class NURBSDemo extends BSplineDemo {
    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        super(p5, parentContainerId, baseAnimationSpeedMultiplier);
    }

    private ctrlPtsAndWeights: CtrlPtAndWeight[] = [];
    private weightedBasisFunctionData: BasisFunctionData[][] = [[]];

    private scheduledCtrlPtWeightChanges: { i: number, newVal: number }[] = [];
    
    public scheduleCtrlPtWeightChange(i: number, newVal: number) {
        if (i < 0 || i > this.ctrlPtsAndWeights.length - 1) {
            console.error('invalid index for control point weight change:', i);
            return;
        }
        this.scheduledCtrlPtWeightChanges.push({i, newVal});
    }

    draw() {
        super.draw();
        if (this.scheduledCtrlPtWeightChanges.length > 0) {
            this.scheduledCtrlPtWeightChanges.forEach(c => this.ctrlPtsAndWeights[c.i].weight = c.newVal);
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
        const oldCtrlPtsAndWeights = this.ctrlPtsAndWeights.slice();
        this.ctrlPtsAndWeights = this.controlPoints.map(pt => ({
            pt,
            //if the same control point is already in the old list of ctrlPtsAndWeights, copy its current weight, else set weight to default of 1
            weight: oldCtrlPtsAndWeights.find(ptWeight => ptWeight.pt == pt)?.weight ?? 1
        }));
    }

    private updateWeightedBasisFunctions() {
        
    }

    getPointOnNURBSCurve(t: number) {

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