import './bernstein.scss';
import p5 from "p5";
import { BezierDemo, BezierDemoChange } from "../../ts/bezier-curve";
import { SketchFactory, bezierSketchFactory } from '../../ts/sketch';
import { Drawable, MyObserver } from '../../ts/ui-interfaces';



const demoContainerId = 'demo';

const onBezierDemoSketchCreated = (bezierDemo: BezierDemo) => {
    const bernSteinVisFactoryFunction = (p5Instance: p5, canvas: p5.Element, parentContainer?: string) => {
        if (parentContainer) canvas.parent(parentContainer);
        return new BernsteinPolynomialVisualization(p5Instance, bezierDemo);
    }
    new SketchFactory<BernsteinPolynomialVisualization>(bernSteinVisFactoryFunction).createSketch(demoContainerId);
}

bezierSketchFactory.createSketch(demoContainerId, onBezierDemoSketchCreated);



export class BernsteinPolynomialVisualization implements Drawable, MyObserver<BezierDemoChange> {
    /**
     * range of numbers from 0 to 1 (inclusive) in steps of size 1/evaluationSteps https://stackoverflow.com/a/10050831
     */
    private evaluationSteps: number[];
    private noOfStepsForT: number;

    private bernSteinPolynomials: ((t: number) => number)[] = [];

    constructor(private p5: p5, private demo: BezierDemo) {
        this.noOfStepsForT = 100;
        this.evaluationSteps = [...Array(this.noOfStepsForT + 1).keys()].map(num => num / this.noOfStepsForT);

        //we want to get notified if the number of control vertices changes
        this.demo.subscribe(this);
    }

    update(change: BezierDemoChange): void {
        if (change === 'controlVerticesChanged') this.recomputeBernsteinPolynomials();
    }

    //TODO: implement
    private recomputeBernsteinPolynomials() {
        const numOfVertices = this.demo.controlVertices.length;
        console.log([...Array(numOfVertices).keys()]);
    }

    draw(): void {
    }
}