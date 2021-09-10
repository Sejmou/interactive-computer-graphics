import p5 from "p5";
import { drawCircle, drawSquare, renderTextWithSubscript } from "../../../utils/p5/misc";
import { CurveDrawingVisualization } from "../base/curve-drawing-vis";
import { NURBSDemo } from "./demo";


/**
 * Visualizes De Boors's algorithm for evaluating/rendering NURBS curves (uses weighted basis functions)
 */
export class NURBSVisualization extends CurveDrawingVisualization {
    private knotMarkerColor: p5.Color = this.p5.color(150);
    private knotMarkerLabelColor = this.p5.color('#f400a3');
    private knotMarkerLabelBackgroundColor = this.p5.color(255, 255, 255, 190);

    constructor(p5: p5, private nurbsDemo: NURBSDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        super(p5, nurbsDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        if (!this.demo.valid) return;

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
            if (this.nurbsDemo.showPointLabels && this.nurbsDemo.knotVector[i] !== 0) {
                //draw labels with semi-transparent white background (rectangle)
                const centerX = knotPosition.x - (multiplicity > 1 ? 60 : 40);
                const centerY = knotPosition.y + 10;
                const text = `t=${+(this.nurbsDemo.knotVector[i].toFixed(2))}${multiplicity > 1 && ((arr[i + 1] && arr[i + 1] !== t) || arr[i + 1] == undefined) ? ` (${multiplicity}x)` : ''}`;
                const textWidth = this.p5.textWidth(text);

                //draw background
                this.p5.push();
                this.p5.fill(this.knotMarkerLabelBackgroundColor);
                this.p5.noStroke();
                this.p5.rectMode(this.p5.CENTER);
                this.p5.rect(centerX + textWidth / 2, centerY, textWidth + 6, 18);
                this.p5.pop();

                //label
                renderTextWithSubscript(
                    this.p5,
                    text,
                    centerX, centerY,
                    this.knotMarkerLabelColor
                );
            }
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
}