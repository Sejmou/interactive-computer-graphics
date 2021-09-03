import p5 from "p5";
import { BezierDemo } from "./demo";
import { Drawable, MyObservable, MyObserver } from '../../../utils/ui';
import { binomial } from "../../../utils/math";
import { DragVertex } from '../../../utils/vertex';
import { DemoChange } from '../base/demo';
import { BernsteinGraphPlotter } from "./graph-plotter";



export interface BernsteinPolynomialData {
    controlPoint: DragVertex;
    bernsteinPolynomialFunction: (t: number) => number;
    bernsteinPolynomialFunctionAsLaTeXString: string;
}
export type BernsteinPolynomialChange = 'bernsteinPolynomialsChanged';

export class BernsteinPolynomialVisualization implements Drawable, MyObserver<DemoChange>, MyObservable<BernsteinPolynomialChange> {
    public bernsteinPolynomialDataPoints: BernsteinPolynomialData[] = [];

    private bernsteinGraphPlotter: BernsteinGraphPlotter;

    public get t() {
        return this.demo.t;
    }

    constructor(p5: p5, private demo: BezierDemo) {
        this.bernsteinGraphPlotter = new BernsteinGraphPlotter(p5, this);

        this.bernsteinPolynomialDataPoints = this.getUpdatedDataPoints();

        //we want to get notified if the number of control points changes
        this.demo.subscribe(this);
    }

    draw() {
        this.bernsteinGraphPlotter.draw();
    }

    update(change: DemoChange): void {
        if (change === 'controlPointsChanged') {
            this.bernsteinPolynomialDataPoints = this.getUpdatedDataPoints();
            this.notifyObservers('bernsteinPolynomialsChanged');
        }
    }

    public getUpdatedDataPoints(): BernsteinPolynomialData[] {
        if (this.demo.controlPoints.length < 2) {
            return [];
        }

        const ctrlPts = this.demo.controlPoints;
        const n = ctrlPts.length - 1;
        const updatedDataPoints = ctrlPts.map((pt, i) => {
            const bernsteinPolynomialFunction = (t: number) => binomial(n, i) * Math.pow(t, i) * Math.pow((1 - t), n - i);
            const bernsteinPolynomialFunctionAsLaTeXString = String.raw`\( b_{${i},${n}} = \binom{${n}}{${i}} \cdot t^{${i}} \cdot (1-t)^{${n - i}} = \)`;

            return {
                controlPoint: pt,
                bernsteinPolynomialFunction,
                bernsteinPolynomialFunctionAsLaTeXString
            };
        });

        return updatedDataPoints;
    }

    private observers: MyObserver<BernsteinPolynomialChange>[] = [];

    subscribe(observer: MyObserver<BernsteinPolynomialChange>): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: MyObserver<BernsteinPolynomialChange>): void {
        this.observers = this.observers.filter(o => o !== observer);
    }

    notifyObservers(data: BernsteinPolynomialChange): void {
        this.observers.forEach(o => o.update(data));
    }
}
