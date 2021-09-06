import p5 from "p5";
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { drawLineVector } from "../../../utils/p5";
import { Drawable } from "../../../utils/ui";
import { BSplineDemo } from "../b-spline/demo";
import { NURBSDemo } from "../nurbs/demo";
import { CurveDemo } from "./demo";



export class InfluenceVisualizerForActiveControlPoint implements Drawable {

    constructor(private p5: p5, private demo: CurveDemo) { }

    draw(): void {
        if (this.demo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt) this.drawInfluenceOfCurrentlyActiveCtrlPt();
    }

    private drawInfluenceOfCurrentlyActiveCtrlPt(): void {
        const ctrlPts = this.demo.controlPoints.slice();
        const activeCtrlPtIndex = ctrlPts.findIndex(pt => pt.hovering || pt.dragging);
        if (activeCtrlPtIndex == -1) {
            console.warn('active control point not found!');
            return;
        }
        const i = activeCtrlPtIndex;
        const activeCtrlPt = ctrlPts[i];

        const ctrlPtInfluenceData = this.demo.ctrlPtInfluenceFunctionData;

        const activeCtrlPtInfluenceFn = ctrlPtInfluenceData.find(d => d.controlPoint === activeCtrlPt)?.influenceFunction;

        if (!activeCtrlPtInfluenceFn) {
            console.warn('influence function for control point not found!');
            return;
        }


        let tValues: number[] = [];
        if (this.demo instanceof BSplineDemo) {
            const knotVector = this.demo.knotVector;
            const p = this.demo.degree;

            //from https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-basis.html we know:
            //Basis function N_{i,p}(u) is non-zero on [u_i, u_{i+p+1}). Or, equivalently, N_{i,p}(u) is non-zero on p+1 knot spans [u_i, u_{i+1}), [u_{i+1}, u_{i+2}), ..., [u_{i+p}, u_{i+p+1}).
            tValues = createArrayOfEquidistantAscendingNumbersInRange(100, knotVector[Math.max(i, this.demo.firstKnotIndexWhereCurveDefined)], knotVector[Math.min(i + p + 1, this.demo.firstKnotIndexWhereCurveUndefined)]);
        } else {// Bézier curve
            tValues = createArrayOfEquidistantAscendingNumbersInRange(100, this.demo.tMin, this.demo.tMax);
        }

        if (!(this.demo instanceof NURBSDemo)) {
            // draw line in varying thickness depending on how much influence the active control point has
            tValues.forEach((t, i, tVals) => {
                if (i === tVals.length - 1) return;
                //draw line that gets thicker the more influence the control point has on the shape of the curve
                drawLineVector(this.p5, this.demo.getPointOnCurve(t), this.demo.getPointOnCurve(tVals[i + 1]), activeCtrlPt.color, this.demo.baseLineWidth * 2 * activeCtrlPtInfluenceFn(t));
            });
        }
        else {
            //we have to normalize the influence function (weighted basis function), as its values aren't limited to [0, 1]
            const sumOfInfluenceFns = ctrlPtInfluenceData.map(d => d.influenceFunction).reduce((f, prev) => (t: number) => f(t) + prev(t), () => 0);
            const normalizedCtrlPtInfluenceFn = (t: number) => activeCtrlPtInfluenceFn(t) / sumOfInfluenceFns(t);

            tValues.forEach((t, i, tVals) => {
                if (i === tVals.length - 1) return;
                //draw line that gets thicker the more influence the control point has on the shape of the curve
                drawLineVector(this.p5, this.demo.getPointOnCurve(t), this.demo.getPointOnCurve(tVals[i + 1]), activeCtrlPt.color, this.demo.baseLineWidth * 2 * normalizedCtrlPtInfluenceFn(t));
            });
        }
    };
}
