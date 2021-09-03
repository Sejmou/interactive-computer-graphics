import p5 from "p5";
import { Sketch } from "../../../utils/sketch";
import { createArrayOfEquidistantAscendingNumbersInRange } from "../../../utils/misc";
import { drawCircle, drawLineVector, drawSquare, renderTextWithSubscript } from "../../../utils/p5";
import { CurveDrawingVisualization } from "../base/curve-drawing-vis";
import { NURBSDemo } from "./demo";



export class NURBSVisualization extends CurveDrawingVisualization {
    private knotMarkerColor: p5.Color = this.p5.color(150);

    //used if reference to sketch is not given
    private fallBackSketchBackgroundColor: p5.Color = this.p5.color(230);

    constructor(p5: p5, private nurbsDemo: NURBSDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color, private sketch?: Sketch) {
        super(p5, nurbsDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        if (!this.demo.valid)
            return;

        this.drawInfluenceOfCurrentlyActiveCtrlPt();

        if (this.nurbsDemo.degree > 0) {
            this.drawKnotMarkers();
        }

        if (this.nurbsDemo.curveDefinedAtCurrentT) {
            this.drawPointAtT(this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(this.nurbsDemo.t));
        } else {
            renderTextWithSubscript(
                this.p5,
                `This ${this.nurbsDemo.open ? 'open' : 'clamped'} NURBS curve is only defined in the interval [t_{${this.nurbsDemo.firstKnotIndexWhereCurveDefined}}, t_{${this.nurbsDemo.firstKnotIndexWhereCurveUndefined}}) = [${+this.nurbsDemo.firstTValueWhereCurveDefined.toFixed(2)}, ${+this.nurbsDemo.firstTValueWhereCurveUndefined.toFixed(2)})`,
                10, this.p5.height - 20
            );
        }
    }

    private drawKnotMarkers() {
        let multiplicity = 0;
        this.nurbsDemo.knotVector.forEach((t, i, arr) => {
            if (arr[i - 1] !== undefined && arr[i - 1] !== t)
                multiplicity = 0;
            multiplicity += 1;
            if (i < this.nurbsDemo.firstKnotIndexWhereCurveDefined || i > this.nurbsDemo.firstKnotIndexWhereCurveUndefined || arr[i + 1] && arr[i + 1] == t)
                return;
            const knotPosition = this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(t);
            drawSquare(
                this.p5,
                knotPosition,
                this.knotMarkerColor,
                this.nurbsDemo.basePointDiameter * 0.75
            );
            if (this.nurbsDemo.showPointLabels)
                renderTextWithSubscript(this.p5, `t=${+(this.nurbsDemo.knotVector[i].toFixed(2))}${multiplicity > 1 && ((arr[i + 1] && arr[i + 1] !== t) || arr[i + 1] == undefined) ? ` (${multiplicity}x)` : ''}`, knotPosition.x - 20, knotPosition.y - 10);
        });
    }

    private drawPointAtT(pointPos: p5.Vector) {
        drawCircle(
            this.p5,
            pointPos,
            this.colorOfPointOnCurve,
            this.nurbsDemo.basePointDiameter * 1.5
        );
    }

    private drawInfluenceOfCurrentlyActiveCtrlPt() {
        const ctrlPts = this.nurbsDemo.controlPoints.slice();
        const activeCtrlPtIndex = ctrlPts.findIndex(pt => pt.hovering || pt.dragging);
        if (activeCtrlPtIndex == -1)
            return;
        const i = activeCtrlPtIndex;
        const activeCtrlPt = ctrlPts[i];
        const p = this.nurbsDemo.degree;
        const basisFunction = this.nurbsDemo.weightedBasisFunctions[p][activeCtrlPtIndex];
        const knotVector = this.nurbsDemo.knotVector;

        //from https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-basis.html we know:
        //Basis function N_{i,p}(u) is non-zero on [u_i, u_{i+p+1}). Or, equivalently, N_{i,p}(u) is non-zero on p+1 knot spans [u_i, u_{i+1}), [u_{i+1}, u_{i+2}), ..., [u_{i+p}, u_{i+p+1}).
        const tValues = createArrayOfEquidistantAscendingNumbersInRange(100, knotVector[Math.max(i, this.nurbsDemo.firstKnotIndexWhereCurveDefined)], knotVector[Math.min(i + p + 1, this.nurbsDemo.firstKnotIndexWhereCurveUndefined)]);
        const pointsAndActiveCtrlPtInfluence = tValues.map(t => ({ pos: this.nurbsDemo.getPointOnCurveUsingDeBoorWithCtrlPtWeights(t), activeCtrlPtInfluence: basisFunction(t) }));
        pointsAndActiveCtrlPtInfluence.slice(0, -1).forEach((p, i) => {
            //draw line in sketch's background color to make "regular" black line disappear
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, this.sketch?.backgroundColor ?? this.fallBackSketchBackgroundColor, this.demo.baseLineWidth * 2);
            //draw line that gets thicker the more influence the control point has on the shape of the curve
            drawLineVector(this.p5, p.pos, pointsAndActiveCtrlPtInfluence[i + 1].pos, activeCtrlPt.color, this.demo.baseLineWidth * 2 * p.activeCtrlPtInfluence);
        });
    }
}