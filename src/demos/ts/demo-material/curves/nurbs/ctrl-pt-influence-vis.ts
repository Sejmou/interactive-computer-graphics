import p5 from "p5";
import { ControlPointInfluenceBarVisualization, ControlPointInfluenceData } from "../base/ctrl-pt-influence-vis";
import { NURBSDemo } from "./demo";



/**
 * Visualization for the influence of the B-Spline's control points (de boor points) using bars
 */
export class NURBSControlPointInfluenceBarVisualization extends ControlPointInfluenceBarVisualization {
    private nurbsDemo: NURBSDemo;

    constructor(p5: p5, nurbsDemo: NURBSDemo, visible: boolean = true) {
        super(p5, nurbsDemo, visible);
        this.nurbsDemo = nurbsDemo;
        nurbsDemo.subscribe(this);
    }

    protected getCurrentControlPointInfluenceDataPoints(): ControlPointInfluenceData[] {
        //needed as value for ctrlPtInfluence has to be in range [0, 1]
        const getSumOfWeightedBasisFunctions = (t: number) => this.nurbsDemo.controlPoints.map((_, i) => this.nurbsDemo.ctrlPtInfluenceFunctions[i](t)).reduce((prev, curr) => prev + curr, 0);

        return this.nurbsDemo.controlPoints.map((c, i) => {
            return {
                controlPoint: c,
                currentCtrlPtInfluence: () => this.nurbsDemo.ctrlPtInfluenceFunctions[i](this.nurbsDemo.t) / getSumOfWeightedBasisFunctions(this.nurbsDemo.t)
            };
        });
    }
}
