import { MyObserver } from "../../../utils/interactivity/my-observable";
import { DemoChange } from '../base/demo';
import { BSplineDemo, CurveType } from './demo';




/**
 * Allows the user to change, what type of curve should be created whenever the user adds or removes a control point (depending on the choice, the BSplineDemo modifies the knot vector accordingly on each controlpoints array length change)
 * Whenever the user changes the curve type, the demo updates the knot vector immediately to showcase the differences more easily
 */
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
            if (i == 0)
                value = 'open';
            else if (i == 1)
                value = 'clamped';
            else
                value = 'emulated Bézier';
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
        if (data == 'curveTypeChanged')
            this.updateSelectedCheckboxes();
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
