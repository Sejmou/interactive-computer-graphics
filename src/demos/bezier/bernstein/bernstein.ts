import './bernstein.scss';
import p5 from "p5";
import { BezierDemo, BezierDemoChange } from "../../ts/bezier-curve";
import { SketchFactory, bezierSketchFactory } from '../../ts/sketch';
import { Drawable, MyObserver } from '../../ts/ui-interfaces';
import { binomial, drawLineVector, drawLineXYCoords } from '../../ts/util';
import colors from '../../../global-styles/color_exports.scss';


const demoContainerId = 'demo';
const bernSteinGraphContainer = document.createElement('div');
const bernSteinGraphContainerId = 'bernstein-demo';
bernSteinGraphContainer.id = bernSteinGraphContainerId;
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', bernSteinGraphContainer);

const onBezierDemoSketchCreated = (bezierDemo: BezierDemo) => {
    const bernSteinVisFactoryFunction = (p5Instance: p5, canvas: p5.Element, parentContainer?: string) => {
        if (parentContainer) canvas.parent(parentContainer);
        return new BernsteinPolynomialVisualization(p5Instance, bezierDemo);
    }
    new SketchFactory<BernsteinPolynomialVisualization>(
        bernSteinVisFactoryFunction,
        (p5) => Math.min(p5.windowWidth * 0.35, 400),
        (p5) => Math.min(p5.windowWidth * 0.35, 400),
    ).createSketch(bernSteinGraphContainerId);
}

bezierSketchFactory.calcCanvasWidth = (p5) => Math.min(0.55 * p5.windowWidth, 600);
bezierSketchFactory.createSketch(demoContainerId, onBezierDemoSketchCreated);



export class BernsteinPolynomialVisualization implements Drawable, MyObserver<BezierDemoChange> {
    /**
     * range of numbers from 0 to 1 (inclusive) in steps of size 1/evaluationSteps https://stackoverflow.com/a/10050831
     */
    private evaluationSteps: number[];
    private noOfStepsForT: number;

    private bernSteinPolynomials: ((t: number) => number)[] = [];

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
        if (n < 1) return this.bernSteinPolynomials = [];
        const zeroToN = [...Array(n + 1).keys()];
        this.bernSteinPolynomials = zeroToN.map(i => ((t: number) => binomial(n, i) * Math.pow(t, i) * Math.pow((1 - t), n - i)));
        console.log();

        this.evaluatedBernsteinPolynomials = this.bernSteinPolynomials.map(b => this.evaluationSteps.map(t => b(t)));
    }

    draw(): void {
        this.evaluatedBernsteinPolynomials.forEach((polyYVals, bIndex) => polyYVals.forEach((y, i) => {
            if (i === this.evaluationSteps.length - 1) return;

            const bPolyVertex = this.demo.controlVertices[bIndex];
            const t = this.evaluationSteps[i];
            const nextY = polyYVals[i + 1];
            const nextT = this.evaluationSteps[i + 1];
            const x1 = t * this.p5.width;
            const y1 = this.p5.height - y * this.p5.height;
            const x2 = nextT * this.p5.width;
            const y2 = this.p5.height - nextY * this.p5.height;
            drawLineXYCoords(this.p5, x1, y1, x2, y2, bPolyVertex.color, (bPolyVertex.hovering || bPolyVertex.dragging)? 4 : 1.5);
        }));

        drawLineXYCoords(this.p5, this.demo.t * this.p5.width, 0, this.demo.t * this.p5.height, this.p5.height, this.lineThroughTColor, 2);

    }
}