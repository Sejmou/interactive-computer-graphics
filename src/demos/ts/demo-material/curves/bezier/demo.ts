import p5 from 'p5';
import { CurveDemo } from '../base/demo';
import { BezierCurve } from './curve';
import { DeCasteljauVisualization } from './curve-drawing-vis';



export class BezierDemo extends CurveDemo {
    public firstTValueWhereCurveDefined;
    public lastTValueWhereCurveDefined;
    public get valid() {
        return this.controlPoints.length > 0;
    }

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call

        this.firstTValueWhereCurveDefined = this.tMin;
        this.lastTValueWhereCurveDefined = this.tMax;

        this.setCurve(new BezierCurve(this.p5, this));
        this.setCurveDrawingVisualization(new DeCasteljauVisualization(this.p5, this));
    }
}