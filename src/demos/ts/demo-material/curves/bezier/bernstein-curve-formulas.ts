import { Drawable, MyObserver } from '../../../utils/ui';
import { BernsteinPolynomialVisualization, BernsteinPolynomialChange } from './bernstein-influence-vis';
import { descriptionParagraph } from '../../../../bezier/bernstein/bernstein';

export class BernsteinCurveFormulas implements Drawable, MyObserver<BernsteinPolynomialChange> {
    private textBoxContainer: HTMLDivElement;
    private containersForBernsteinPolynomialValues: HTMLDivElement[] = [];
    private bezierCurveEquation: HTMLSpanElement;
    private id: string = 'bernstein-polynomials';

    private set visible(visible: boolean) {
        this.textBoxContainer.style.display = visible ? 'block' : 'none';
        if (visible) {
            const n = this.bernsteinVis.bernsteinPolynomialDataPoints.length - 1;
            const controlPoints = this.bernsteinVis.bernsteinPolynomialDataPoints.map(d => d.controlPoint);
            this.bezierCurveEquation.innerHTML =
                String.raw`<br>For the current set of control points the formula is: \[ C(t) = `
                + controlPoints.map((c, i) => String.raw`${i == 0 ? '' : ' + '}b_{${i},${n}} \cdot ${c.label}`).join('')
                + String.raw` \]`;
            MathJax.typeset([`#${this.id}`, `#${this.bezierCurveEquation.id}`]);
        }
        else
            this.bezierCurveEquation.innerText = '';
    }

    constructor(private bernsteinVis: BernsteinPolynomialVisualization, demoContainerId: string) {
        this.textBoxContainer = document.createElement('div');
        this.textBoxContainer.id = this.id;
        this.bezierCurveEquation = document.createElement('span');
        this.bezierCurveEquation.id = 'bezier-curve-equation';

        descriptionParagraph?.appendChild(this.bezierCurveEquation);
        document.getElementById(demoContainerId)?.appendChild(this.textBoxContainer);

        this.setupTextContainersForCurrBernsteinPolynomials();

        bernsteinVis.subscribe(this);
    }

    draw(): void {
        this.bernsteinVis.bernsteinPolynomialDataPoints.forEach((d, i) => this.containersForBernsteinPolynomialValues[i].innerText = d.bernsteinPolynomialFunction(this.bernsteinVis.t).toFixed(2)
        );
    }


    public update(data: BernsteinPolynomialChange) {
        if (data === 'bernsteinPolynomialsChanged') {
            this.setupTextContainersForCurrBernsteinPolynomials();
        }
    }

    private setupTextContainersForCurrBernsteinPolynomials() {
        this.textBoxContainer.innerHTML = ''; //removes any previously existing child nodes

        const zeroToN = [...Array(this.bernsteinVis.bernsteinPolynomialDataPoints.length).keys()];

        this.containersForBernsteinPolynomialValues = zeroToN.map(() => {
            const div = document.createElement('div');
            div.className = 'polynomial-values';
            return div;
        });


        this.bernsteinVis.bernsteinPolynomialDataPoints.forEach((d, i) => {
            const div = document.createElement('div');
            div.className = 'flex-row bernstein-polynomial-container center-cross-axis';
            div.appendChild(document.createTextNode(d.bernsteinPolynomialFunctionAsLaTeXString));
            div.appendChild(this.containersForBernsteinPolynomialValues[i]);
            this.textBoxContainer.appendChild(div);
        });

        this.visible = this.textBoxContainer.innerHTML.length > 0;
    }
}
