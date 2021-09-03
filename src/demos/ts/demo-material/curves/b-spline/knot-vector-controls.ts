import { MyObserver } from '../../../utils/ui';
import { clamp } from "../../../utils/math";
import { DemoChange } from '../base/demo';
import { BSplineDemo } from './b-spline-curve';




export class KnotVectorControls implements MyObserver<DemoChange> {
    private knotInputElements: HTMLInputElement[] = [];
    private controlsContainer: HTMLDivElement;
    private tableContainer: HTMLDivElement;

    constructor(private bSplineDemo: BSplineDemo, private parentContainerId: string, showLabel: boolean = true) {
        bSplineDemo.subscribe(this);

        this.tableContainer = document.createElement('div');
        this.tableContainer.id = 'knot-table-container';

        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'knot-controls-container';

        const parentContainer = document.getElementById(this.parentContainerId);
        if (!parentContainer) {
            console.warn(`couldn't create table for knot vector, parent container id invalid!`);
            return;
        }

        if (showLabel) {
            const label = document.createElement('div');
            label.innerText = 'knot vector:';
            label.id = 'knot-controls-label';
            this.controlsContainer.appendChild(label);
        }
        this.controlsContainer.appendChild(this.tableContainer);
        parentContainer.appendChild(this.controlsContainer);

        this.updateKnotVectorDisplay();
    }

    update(data: DemoChange): void {
        if (data == 'knotVectorChanged') {
            this.updateKnotVectorDisplay();
        }
    }

    updateKnotVectorDisplay() {
        if (!this.bSplineDemo.valid) {
            this.controlsContainer.style.visibility = 'hidden';
            return;
        }
        else {
            this.controlsContainer.style.removeProperty('visibility');
        }

        const headerRow = document.createElement('tr');
        let knotHeadingIds: string[] = [];

        this.knotInputElements = this.bSplineDemo.knotVector.map((k, i, arr) => {
            const inputEl = document.createElement('input');
            inputEl.type = 'number';
            inputEl.setAttribute('step', 'any'); //deactivates "please enter a valid value in range..." hint

            const th = document.createElement('th');
            th.innerText = String.raw`\(t_{${i}}${arr[i + 1] !== undefined && arr[i + 1] == k ? ` = t_{${i + 1}}` : ''}\)`;
            headerRow.appendChild(th);

            const id = `knot-${i}`;
            th.id = id;
            knotHeadingIds.push(`#${id}`);

            const updateValue = () => {
                const min = arr[i - 1] ?? 0;
                const max = arr[i + 1] ?? Number.MAX_VALUE;
                const value = clamp(+inputEl.value, min, max);
                this.bSplineDemo.scheduleKnotValueChange(i, value);
                inputEl.value = value.toString();
            };

            //this weird looking code allows us to display up to 2 digits (only if necessary) - we have to make it a string again in the end
            inputEl.value = (+(k.toFixed(2))).toString();
            inputEl.addEventListener('focus', () => inputEl.value = arr[i].toString());
            inputEl.addEventListener('blur', () => updateValue());

            inputEl.addEventListener('keydown', e => {
                if (e.key == 'Enter')
                    inputEl.blur();
            });

            return inputEl;
        });

        this.knotInputElements.forEach((_, i) => {
        });

        const knotInputRow = document.createElement('tr');

        this.knotInputElements.forEach(k => {
            const td = document.createElement('td');
            td.appendChild(k);
            knotInputRow.appendChild(td);
        });

        this.tableContainer.innerHTML = '';

        const table = document.createElement('table');
        table.appendChild(headerRow);
        table.appendChild(knotInputRow);
        table.id = 'knot-table';

        this.tableContainer.appendChild(table);

        MathJax.typeset(knotHeadingIds);
    }
}
