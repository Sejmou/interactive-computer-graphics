import p5 from 'p5';
import { MyObserver } from '../../../utils/ui';
import { DemoChange } from '../base/demo';
import { ControlPointInfluenceData, ControlPointInfluenceVisualization as ControlPointInfluenceBarVisualization } from "../base/ctrl-pt-influence-vis";
import { BSplineDemo } from './b-spline-curve';

/**
 * Visualization for the influence of the B-Spline's control points (de boor points) using bars
 */



export class DeBoorControlPointInfluenceBarVisualization extends ControlPointInfluenceBarVisualization implements MyObserver<DemoChange> {
    private bSplineDemo: BSplineDemo;

    constructor(p5: p5, bSplineDemo: BSplineDemo, visible: boolean = true) {
        super(p5, bSplineDemo, visible);
        this.bSplineDemo = bSplineDemo;
        bSplineDemo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data == 'controlPointsChanged' || data == 'degreeChanged' || data == 'knotVectorChanged' || data == 'rangeOfTChanged')
            this.updateInfluenceDataAndBars();
    }

    protected getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[] {
        return this.bSplineDemo.controlPoints.map((c, i) => {
            return {
                controlPoint: c,
                currentCtrlPtInfluence: () => this.bSplineDemo.basisFunctions[this.bSplineDemo.degree][i](this.bSplineDemo.t)
            };
        });
    }
}
