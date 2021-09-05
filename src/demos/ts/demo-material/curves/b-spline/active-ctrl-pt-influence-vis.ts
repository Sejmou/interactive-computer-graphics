import p5 from 'p5';
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { drawLineVector } from "../../../utils/p5";
import { InfluenceVisualizerForActiveControlPoint } from "../base/active-ctrl-pt-influence-vis";
import { BSplineDemo } from './demo';




export class VisualizerForCurrentlyActiveBSplineControlPoint extends InfluenceVisualizerForActiveControlPoint {
    /**
     *
     * @param p5
     * @param bSplineDemo
     * @param sketch needed to obtain the backgroundColor used so that we can render the influence visualization for the active ctrlPt using the correct background color
     */
    constructor(private p5: p5, private bSplineDemo: BSplineDemo) {
        super(bSplineDemo);
    }

    protected drawInfluenceOfCurrentlyActiveCtrlPt() {
        const ctrlPts = this.bSplineDemo.controlPoints.slice();
        const activeCtrlPtIndex = ctrlPts.findIndex(pt => pt.hovering || pt.dragging);
        if (activeCtrlPtIndex == -1)
            return;
        const i = activeCtrlPtIndex;
        const activeCtrlPt = ctrlPts[i];
        const p = this.bSplineDemo.degree;
        const basisFunction = this.bSplineDemo.basisFunctions[activeCtrlPtIndex];
        const knotVector = this.bSplineDemo.knotVector;

        //from https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-basis.html we know:
        //Basis function N_{i,p}(u) is non-zero on [u_i, u_{i+p+1}). Or, equivalently, N_{i,p}(u) is non-zero on p+1 knot spans [u_i, u_{i+1}), [u_{i+1}, u_{i+2}), ..., [u_{i+p}, u_{i+p+1}).
        const tValues = createArrayOfEquidistantAscendingNumbersInRange(100, knotVector[Math.max(i, this.bSplineDemo.firstKnotIndexWhereCurveDefined)], knotVector[Math.min(i + p + 1, this.bSplineDemo.firstKnotIndexWhereCurveUndefined)]);
        const pointsAndActiveCtrlPtInfluence = tValues.map(t => ({ pos: this.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t), activeCtrlPtInfluence: basisFunction(t) }));
        pointsAndActiveCtrlPtInfluence.slice(0, -1).forEach((p, i) => {
            //draw line that gets thicker the more influence the control point has on the shape of the curve
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, activeCtrlPt.color, this.bSplineDemo.baseLineWidth * 2 * p.activeCtrlPtInfluence);
        });
    }
}
