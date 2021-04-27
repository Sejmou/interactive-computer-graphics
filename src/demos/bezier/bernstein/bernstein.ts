import './bernstein.scss';
import p5 from "p5";
import { BezierDemo, BezierDemoChange } from "../../ts/bezier-curve";
import { Sketch } from '../../ts/sketch';
import { Drawable, MyObserver } from '../../ts/ui-interfaces';
import { binomial, drawLineXYCoords } from '../../ts/util';
import colors from '../../../global-styles/color_exports.scss';


const demoContainerId = 'demo';
const bernsteinGraphContainer = document.createElement('div');
const bernsteinGraphContainerId = 'bernstein-demo';
bernsteinGraphContainer.id = bernsteinGraphContainerId;
bernsteinGraphContainer.className = 'flex-col center-cross-axis';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', bernsteinGraphContainer);


async function createDemo() {
    //override default sketch width for bezier sketch
    const bezierSketchWidth = (p5: p5) => Math.min(0.55 * p5.windowWidth, 600);
    const bezierSketch = new Sketch(demoContainerId, bezierSketchWidth);
    await bezierSketch.create();
    const bezierDemo = bezierSketch.add((p5, containerId) => new BezierDemo(p5, containerId));
    bezierDemo.showVertexLabels = true;

    const bernsteinVisSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.35, 400);
    const bernsteinVisSketchHeight = bernsteinVisSketchWidth;
    const bernsteinVisSketch = new Sketch(bernsteinGraphContainerId, bernsteinVisSketchWidth, bernsteinVisSketchHeight);
    await bernsteinVisSketch.create();
    const bernsteinVis = bernsteinVisSketch.add((p5) => new BernsteinPolynomialVisualization(p5, bezierDemo));

    //this isn't actually added to the canvas or anything, however it needs to be updated every time t of bezier demo changes -> easiest solution: update on every draw()
    bernsteinVisSketch.add(() => new BernsteinPolynomials(bezierDemo, bernsteinVis, bernsteinGraphContainerId));

    bezierSketch.add((p5) => new VertexInfluenceBar(p5, bezierDemo, bernsteinVis));

    document.querySelector('#cover')?.remove();
}

createDemo();



export class BernsteinPolynomialVisualization implements Drawable, MyObserver<BezierDemoChange> {
    /**
     * range of numbers from 0 to 1 (inclusive) in steps of size 1/evaluationSteps https://stackoverflow.com/a/10050831
     */
    private evaluationSteps: number[];
    private noOfStepsForT: number;

    private _bernSteinPolynomials: ((t: number) => number)[] = [];
    public get bernSteinPolynomials(): ((t: number) => number)[] {
        return this._bernSteinPolynomials;
    }

    /**
     * current values of each bernsteinPolynomial, depending on t, updated each frame in draw()
     */
    private _bernsteinPolynomialValues: number[] = [];
    public get bernsteinPolynomialValues(): number[] {
        return this._bernsteinPolynomialValues;
    }

    private evaluatedBernsteinPolynomials: number[][] = [];

    private lineThroughTColor: p5.Color;

    constructor(private p5: p5, private demo: BezierDemo) {
        this.noOfStepsForT = 100;
        this.evaluationSteps = [...Array(this.noOfStepsForT + 1).keys()].map(num => num / this.noOfStepsForT);
        this.lineThroughTColor = this.p5.color(colors.errorColor);

        //we want to get notified if the number of control vertices changes
        this.demo.subscribe(this);
    }

    update(change: BezierDemoChange): void {
        if (change === 'controlVerticesChanged') this.updateBernsteinPolynomials();
    }

    private updateBernsteinPolynomials() {
        const n = this.demo.controlVertices.length - 1;
        if (n < 1) return this._bernSteinPolynomials = [];
        const zeroToN = [...Array(n + 1).keys()];
        this._bernSteinPolynomials = zeroToN.map(i => ((t: number) => binomial(n, i) * Math.pow(t, i) * Math.pow((1 - t), n - i)));
        console.log();

        this.evaluatedBernsteinPolynomials = this.bernSteinPolynomials.map(b => this.evaluationSteps.map(t => b(t)));
    }

    draw(): void {
        this.evaluatedBernsteinPolynomials.forEach((polyYVals, bIndex) => {
            const bPolyVertex = this.demo.controlVertices[bIndex];
            const lineThickness = (bPolyVertex.hovering || bPolyVertex.dragging) ? 4 : 1.5;
            const color = bPolyVertex.color;
            polyYVals.forEach((y, i) => {
                if (i === this.evaluationSteps.length - 1) return;
                const t = this.evaluationSteps[i];
                const nextY = polyYVals[i + 1];
                const nextT = this.evaluationSteps[i + 1];
                const x1 = t * this.p5.width;
                const y1 = this.p5.height - y * this.p5.height;
                const x2 = nextT * this.p5.width;
                const y2 = this.p5.height - nextY * this.p5.height;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, color, lineThickness);
            });
        });

        //draw vertical line at current value of t
        drawLineXYCoords(this.p5, this.demo.t * this.p5.width, 0, this.demo.t * this.p5.height, this.p5.height, this.lineThroughTColor, 2);

        //we also want to recompute the current values of each bernsteinPolynomial each frame, depending on t
        this.recomputeBernsteinPolynomialValues();
    }

    private recomputeBernsteinPolynomialValues() {
        const t = this.demo.t;
        this._bernsteinPolynomialValues = this.bernSteinPolynomials.map(b => b(t));
    }
}



class BernsteinPolynomials implements Drawable {
    private textBoxContainer: HTMLDivElement;
    private containersForBernsteinPolynomialValues: HTMLDivElement[] = [];
    private id: string = 'bernstein-polynomials';

    private set visible(visible: boolean) {
        this.textBoxContainer.style.display = visible ? 'block' : 'none';
    }

    constructor(private demo: BezierDemo, private bernsteinVis: BernsteinPolynomialVisualization, demoContainerId: string) {
        this.textBoxContainer = document.createElement('div');
        this.textBoxContainer.id = this.id;
        this.visible = false;

        document.getElementById(demoContainerId)?.appendChild(this.textBoxContainer);

        //we want to get notified if the number of control vertices changes
        this.demo.subscribe(this);
    }

    draw(): void {
        const bernsteinFormulas = this.bernsteinVis.bernSteinPolynomials;
        this.containersForBernsteinPolynomialValues.forEach((c, i) => c.innerText = bernsteinFormulas[i](this.demo.t).toFixed(2));
        MathJax.typeset([`#${this.id}`]);
    }

    //do some updates which would be to expensive to do on every draw call
    update(change: BezierDemoChange) {
        if (change === 'controlVerticesChanged') {
            this.createContainersForBernsteinFormulas();
            this.visible = this.textBoxContainer.innerHTML.length > 0;
            //let MathJax convert any LaTeX syntax in the textbox to beautiful formulas (can't pass this.textBox as it is p5.Element and p5 doesn't offer function to get 'raw' DOM node)
            MathJax.typeset([`#${this.id}`]);
        }
    }

    private createContainersForBernsteinFormulas() {
        const controlVertices = this.demo.controlVertices;
        const n = controlVertices.length - 1;
        if (n < 1) return '';

        const zeroToN = [...Array(n + 1).keys()];
        const bernSteinPolynomialLaTeXStrings = zeroToN.map(i => {
            return String.raw`\(${controlVertices[i].label}: \binom{${n}}{${i}} \cdot t^{${i}} \cdot (1-t)^{${n - i}} = \)`;
        });

        this.containersForBernsteinPolynomialValues = zeroToN.map(() => {
            const div = document.createElement('div');
            div.className = 'polynomial-values';
            return div;
        });

        this.textBoxContainer.innerHTML = '';//removes child nodes
        zeroToN.forEach((b, i) => {
            const div = document.createElement('div');
            div.className = 'flex-row bernstein-polynomial-container';
            div.appendChild(document.createTextNode(bernSteinPolynomialLaTeXStrings[i]));
            div.appendChild(this.containersForBernsteinPolynomialValues[i]);
            this.textBoxContainer.appendChild(div);
        });
    }
}

class VertexInfluenceBar implements Drawable {
    private barFillColor: p5.Color;
    private restOfBarColor: p5.Color;
    private barHeight = 60;
    private barWidth = 30;
    private borderThickness = 5;

    constructor(private p5: p5, private bezierDemo: BezierDemo, private bernsteinVis: BernsteinPolynomialVisualization) {
        this.barFillColor = p5.color(colors.successColor);
        this.restOfBarColor = p5.color(120);
    }
    draw(): void {
        const controlVertices = this.bezierDemo.controlVertices;
        if (controlVertices.length < 2) return;
        const influenceOfEachVertex = this.bernsteinVis.bernsteinPolynomialValues;

        this.p5.push();
        this.p5.noStroke();
        this.p5.rectMode(this.p5.CENTER);
        controlVertices.forEach((v, i) => {
            const fillHeight = influenceOfEachVertex[i] * (this.barHeight - this.borderThickness);

            this.p5.fill(this.restOfBarColor);
            this.p5.rect(v.x - this.barWidth * 1.25, v.y + this.barWidth / 2, this.barWidth, this.barHeight);
            this.p5.fill(this.barFillColor);
            this.p5.rect(v.x - this.barWidth * 1.25, (v.y + this.barWidth / 2) + (this.barHeight - fillHeight) / 2 - this.borderThickness / 2, this.barWidth - this.borderThickness, fillHeight);
        });
        this.p5.pop();
    }
}



// const createPlot = (p5: p5, canvas: p5.Element, parentContainer?: string) => new Plot(p5);
// export const plotFactory: SketchFactory<Plot> = new SketchFactory(createPlot,
//     (p5) => Math.min(p5.windowWidth * 0.35, 400),
//     (p5) => Math.min(p5.windowWidth * 0.35, 400)
// );

// plotFactory.createSketch();

// class Plot implements Drawable {
//     private xAxisOffsetFromBottom: number;
//     private yAxisOffsetFromLeft: number;

//     private lineColor: p5.Color;

//     // private xAxisLabel: string;
//     // private yAxisLabel: string;

//     // private xMaxVal: number;
//     // private yMaxVal: number;

//     // private xMinVal: number;
//     // private yMinVal: number;

//     constructor(private p5: p5) {
//         this.xAxisOffsetFromBottom = 0.05 * p5.height;
//         this.yAxisOffsetFromLeft = 0.05 * p5.width;
//         this.lineColor = p5.color('black');
//     }

//     draw(): void {
//         drawLineXYCoords(this.p5, this.yAxisOffsetFromLeft, this.xAxisOffsetFromBottom, this.p5.width, this.xAxisOffsetFromBottom, this.lineColor, 1);
//         drawLineXYCoords(this.p5, this.yAxisOffsetFromLeft, this.xAxisOffsetFromBottom, this.yAxisOffsetFromLeft, this.p5.height, this.lineColor, 1);
//     }
// }