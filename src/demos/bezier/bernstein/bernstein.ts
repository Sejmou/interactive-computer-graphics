import './bernstein.scss';
import p5 from "p5";
import { BezierDemo, BezierDemoChange } from "../../ts/bezier-curve";
import { Sketch } from '../../ts/sketch';
import { Drawable, MyObserver } from '../../ts/ui-interfaces';
import { binomial, drawLineXYCoords } from '../../ts/util';
import colors from '../../../global-styles/color_exports.scss';


const demoContainerId = 'demo';
const bernSteinGraphContainer = document.createElement('div');
const bernSteinGraphContainerId = 'bernstein-demo';
bernSteinGraphContainer.id = bernSteinGraphContainerId;
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', bernSteinGraphContainer);


async function createDemo() {
    //override default sketch width for bezier sketch
    const bezierSketchWidth = (p5: p5) => Math.min(0.55 * p5.windowWidth, 600);
    const bezierSketch = new Sketch(demoContainerId, bezierSketchWidth);
    await bezierSketch.create();
    const bezierDemo = bezierSketch.add((p5, containerId) => new BezierDemo(p5, containerId));
    bezierDemo.showVertexLabels = true;

    const bernsteinVisSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.35, 400);
    const bernsteinVisSketchHeight = bernsteinVisSketchWidth;
    const bernsteinVisSketch = new Sketch(bernSteinGraphContainerId, bernsteinVisSketchWidth, bernsteinVisSketchHeight);
    await bernsteinVisSketch.create();
    new BernsteinFormulas(bezierDemo, bernSteinGraphContainerId);
    bernsteinVisSketch.add((p5) => new BernsteinPolynomialVisualization(p5, bezierDemo));

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

    }
}



class BernsteinFormulas implements MyObserver<BezierDemoChange> {
    private textBoxContainer: HTMLDivElement;
    private id: string = 'bernstein-formulas';

    private set visible(visible: boolean) {
        this.textBoxContainer.style.display = visible ? 'block' : 'none';
    }

    constructor(private demo: BezierDemo, demoContainerId: string) {
        this.textBoxContainer = document.createElement('div');
        this.textBoxContainer.id = this.id;
        this.visible = false;

        document.getElementById(demoContainerId)?.appendChild(this.textBoxContainer);

        //we want to get notified if the number of control vertices changes
        this.demo.subscribe(this);
    }

    update(change: BezierDemoChange) {
        if (change === 'controlVerticesChanged') {
            const numOfControlVertices = this.demo.controlVertices.length;
            this.textBoxContainer.innerHTML = this.createParagraphsHTMLFromMessage(this.getBernsteinFormulas(numOfControlVertices));
            this.visible = this.textBoxContainer.innerHTML.length > 0;
            //let MathJax convert any LaTeX syntax in the textbox to beautiful formulas (can't pass this.textBox as it is p5.Element and p5 doesn't offer function to get 'raw' DOM node)
            MathJax.typeset([`#${this.id}`]);
        }
    }

    private createParagraphsHTMLFromMessage(message: string) {
        const paragraphContent = message.split('\n\n');
        const paragraphs = paragraphContent.map(str => `<p>${str.trim().replace('\n', '<br>')}</p>`);
        return paragraphs.join('');
    }

    private getBernsteinFormulas(numOfControlVertices: number): string {
        const n = this.demo.controlVertices.length - 1;
        if (n < 1) return '';
        const zeroToN = [...Array(n + 1).keys()];
        const bernSteinPolynomialLaTeXStrings = zeroToN.map(i => {
            return String.raw`$$ \binom{${n}}{${i}} \cdot t^{${i}} \cdot (1-t)^{${n - i}} $$`;
        });
        return bernSteinPolynomialLaTeXStrings.join('');
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