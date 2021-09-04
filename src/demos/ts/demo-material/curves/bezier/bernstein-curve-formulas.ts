import { Drawable, MyObserver } from '../../../utils/ui';
import { BernsteinPolynomialVisualization, BernsteinPolynomialChange } from './bernstein-influence-vis';

export class BernsteinCurveFormulas implements Drawable, MyObserver<BernsteinPolynomialChange> {
    private textBoxContainer: HTMLDivElement;
    private containersForBernsteinPolynomialValues: HTMLDivElement[] = [];
    private bezierCurveEquation: HTMLSpanElement;
    private id: string = 'bernstein-polynomials';

    private set bernsteinPolynomialsVisible(visible: boolean) {
        this.textBoxContainer.style.display = visible ? 'block' : 'none';
        if (visible) {
            const n = this.bernsteinVis.bernsteinPolynomialDataPoints.length - 1;
            const controlPoints = this.bernsteinVis.bernsteinPolynomialDataPoints.map(d => d.controlPoint);
            this.bezierCurveEquation.innerHTML =
                String.raw`<p>For the current set of control points the Bézier curve formula is: \[ C(t) = `
                + controlPoints.map((c, i) => String.raw`${i == 0 ? '' : ' + '}b_{${i},${n}} \cdot ${c.label}`).join('')
                + String.raw` \]</p>`;
            MathJax.typeset([`#${this.id}`, `#${this.bezierCurveEquation.id}`]);
        }
        else
            this.bezierCurveEquation.innerHTML = '<p>Add at least two control points to see the Bézier curve equation.</p>';
    }

    constructor(private bernsteinVis: BernsteinPolynomialVisualization, curveFormulaContainer: HTMLElement, bernsteinPolynomialFormulasContainer: HTMLElement) {
        this.textBoxContainer = document.createElement('div');
        this.textBoxContainer.id = this.id;
        this.bezierCurveEquation = document.createElement('span');
        this.bezierCurveEquation.id = 'bezier-curve-equation';

        curveFormulaContainer.appendChild(this.bezierCurveEquation);
        bernsteinPolynomialFormulasContainer.appendChild(this.textBoxContainer);

        this.setupTextContainersForCurrBernsteinPolynomials();

        bernsteinVis.subscribe(this);
    }

    draw(): void {
        // each time the canvas with the curve updates, draw() is called on it, also calling this function -> we have to update the polynomial values as t might have changed
        // so, we kinda abuse draw() here as we don't draw onto the canvas at all lol
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

        this.bernsteinPolynomialsVisible = this.textBoxContainer.innerHTML.length > 0;
    }
}
