import p5 from 'p5';
import { ControlPointInfluenceData, ControlPointInfluenceBarVisualization } from "../base/ctrl-pt-influence-vis";
import { BSplineDemo } from './demo';



/**
 * Visualization for the influence of the B-Spline's control points (de boor points) using bars
 */
export class DeBoorControlPointInfluenceBarVisualization extends ControlPointInfluenceBarVisualization {
    private bSplineDemo: BSplineDemo;

    constructor(p5: p5, bSplineDemo: BSplineDemo, visible: boolean = true) {
        super(p5, bSplineDemo, visible);
        this.bSplineDemo = bSplineDemo;
    }

    protected getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[] {
        return this.bSplineDemo.controlPoints.map((c, i) => {
            return {
                controlPoint: c,
                currentCtrlPtInfluence: () => this.bSplineDemo.ctrlPtInfluenceFunctions[i](this.bSplineDemo.t)
            };
        });
    }
}
