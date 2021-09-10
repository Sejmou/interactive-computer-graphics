import p5 from 'p5';
import { MyObserver } from "../../../utils/interactivity/my-observable";
import { DemoChange } from '../base/demo';
import { BSplineDemo } from './demo';



/**
 * Allows the user to change the degree of the BsplineDemo
 */
export class DegreeControls implements MyObserver<DemoChange> {
    private container: p5.Element;
    private degreeText: p5.Element;
    private decreaseDegreeButton: p5.Element;
    private increaseDegreeButton: p5.Element;

    public set visible(visible: boolean) {
        this.container.style('visibility', visible ? 'visible' : 'hidden');
    };


    constructor(p5: p5, private demo: BSplineDemo, parentContainerId?: string) {
        this.container = p5.createDiv();

        if (parentContainerId)
            this.container.parent(parentContainerId);
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
            if (this.demo.curveType == 'emulated Bézier') {
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
        } else if (!(this.demo.curveType == 'emulated Bézier'))
            (this.decreaseDegreeButton.removeAttribute('disabled'));
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
