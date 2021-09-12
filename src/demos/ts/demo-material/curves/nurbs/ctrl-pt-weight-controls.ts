import { Observer } from "../../../utils/interactivity/observer-pattern";
import { clamp } from "../../../utils/math";
import { DemoChange } from "../base/demo";
import { NURBSDemo } from "./demo";



/**
 * Allows the user to change the weight associated with each control point of a NURBSDemo -> demo modifies weighted basis functions accordingly 
 */
export class ControlsForControlPointWeights implements Observer<DemoChange> {
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
            inputEl.setAttribute('step', 'any'); //deactivates "please enter a valid value in range..." hint


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
                if (e.key == 'Enter')
                    inputEl.blur();
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

        const ctrlPtWeightTable = document.createElement('table');
        ctrlPtWeightTable.appendChild(headerRow);
        ctrlPtWeightTable.appendChild(knotInputRow);
        ctrlPtWeightTable.id = 'control-point--weight-table';

        this.tableContainer.innerHTML = '';
        this.tableContainer.appendChild(ctrlPtWeightTable);

        MathJax.typeset(ctrlPtHeadingIds);
    }
}
