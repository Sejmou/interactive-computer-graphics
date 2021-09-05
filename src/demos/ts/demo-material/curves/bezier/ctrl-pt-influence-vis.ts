import p5 from "p5";
import { ControlPointInfluenceBarVisualization, ControlPointInfluenceData } from "../base/ctrl-pt-influence-vis";
import { BezierDemo } from "./demo";



export class BernsteinPolynomialInfluenceBarVisualization extends ControlPointInfluenceBarVisualization {
    private bezierDemo: BezierDemo;

    constructor(p5: p5, bezierDemo: BezierDemo, visible: boolean = true) {
        super(p5, bezierDemo, visible);
        this.bezierDemo = bezierDemo;
    }

    protected getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[] {
        return this.bezierDemo.ctrlPtInfluenceFunctionData.map(d => ({
            controlPoint: d.controlPoint,
            currentCtrlPtInfluence: () => d.influenceFunction(this.bezierDemo.t)
        }));
    }
}
