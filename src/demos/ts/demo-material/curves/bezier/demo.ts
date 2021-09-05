import p5 from 'p5';
import { binomial } from '../../../utils/math';
import { ControlPointInfluenceFunctionData, CurveDemo } from '../base/demo';
import { BezierCurve } from './curve';
import { DeCasteljauVisualization } from './curve-drawing-vis';



export class BezierDemo extends CurveDemo {
    public firstTValueWhereCurveDefined;
    public lastTValueWhereCurveDefined;
    public get valid() {
        return this.controlPoints.length > 1;
    }

    private bernsteinPolynomialData: ControlPointInfluenceFunctionData[];

    public get ctrlPtInfluenceFunctions(): ((t: number) => number)[] {
        return this.bernsteinPolynomialData.map(d => d.influenceFunction);
    }
    public get ctrlPtInfluenceFuncsAsLaTeXStrings(): string[] {
        return this.bernsteinPolynomialData.map(d => d.influenceFunctionAsLaTeXString);
    }
    public get ctrlPtInfluenceFunctionData(): ControlPointInfluenceFunctionData[] {
        return this.bernsteinPolynomialData;
    }

    get curveInvalidMessage() {
        return '';
    }

    protected additionalCtrlPtAmountChangeHandling(): void {
        this.updateBernsteinPolynomials();
    }

    private updateBernsteinPolynomials() {
        if (this.controlPoints.length < 2) {
            this.bernsteinPolynomialData = [];
            this.notifyObservers('ctrlPtInfluenceFunctionsChanged');
            return;
        }

        const ctrlPts = this.controlPoints;
        const n = ctrlPts.length - 1;
        
        this.bernsteinPolynomialData = ctrlPts.map((pt, i) => {
            const bernsteinPolynomialFunction = (t: number) => binomial(n, i) * Math.pow(t, i) * Math.pow((1 - t), n - i);
            const bernsteinPolynomialFunctionAsLaTeXString = String.raw`\( b_{${i},${n}} = \binom{${n}}{${i}} \cdot t^{${i}} \cdot (1-t)^{${n - i}} = \)`;

            return {
                controlPoint: pt,
                influenceFunction: bernsteinPolynomialFunction,
                influenceFunctionAsLaTeXString: bernsteinPolynomialFunctionAsLaTeXString
            };
        });
        this.notifyObservers('ctrlPtInfluenceFunctionsChanged');
    }

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call

        this.firstTValueWhereCurveDefined = this.tMin;
        this.lastTValueWhereCurveDefined = this.tMax;
        this.bernsteinPolynomialData = [];

        this.setCurve(new BezierCurve(this.p5, this));
        this.setCurveDrawingVisualization(new DeCasteljauVisualization(this.p5, this));
    }
}