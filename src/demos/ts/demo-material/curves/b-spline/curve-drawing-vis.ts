import p5 from 'p5';
import { Sketch } from '../../../utils/sketch';
import { drawCircle, drawLineVector, drawSquare, renderTextWithSubscript } from "../../../utils/p5";
import { CurveDrawingVisualization } from "../base/curve-drawing-vis";
import { BSplineDemo } from './demo';

export class BSplineVisualization extends CurveDrawingVisualization {
    private knotMarkerColor: p5.Color = this.p5.color(150);
    private knotMarkerLabelColor = this.p5.color('#f400a3');
    private knotMarkerLabelBackgroundColor = this.p5.color(255, 255, 255, 190);

    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color, private sketch?: Sketch) {
        super(p5, bSplineDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
        if (!this.demo.valid)
            return;

        if (this.bSplineDemo.degree > 0) {
            this.drawKnotMarkers();
        }

        if (this.bSplineDemo.curveDefinedAtCurrentT) {
            const deBoorData = this.bSplineDemo.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(this.bSplineDemo.t);
            this.drawDeBoorVisualization(deBoorData.tempPtsCreatedDuringEvaluation);
            this.drawPointAtT(deBoorData.pt);
        } else {
            renderTextWithSubscript(
                this.p5,
                `This ${this.bSplineDemo.open ? 'open' : 'clamped'} B-Spline curve is only defined in the interval [t_{${this.bSplineDemo.firstKnotIndexWhereCurveDefined}}, t_{${this.bSplineDemo.firstKnotIndexWhereCurveUndefined}}) = [${+this.bSplineDemo.firstTValueWhereCurveDefined.toFixed(2)}, ${+this.bSplineDemo.firstTValueWhereCurveUndefined.toFixed(2)})`,
                10, this.p5.height - 20
            );
        }
    }

    private drawKnotMarkers() {
        let multiplicity = 0;
        this.bSplineDemo.knotVector.forEach((t, i, arr) => {
            if (arr[i - 1] !== undefined && arr[i - 1] !== t)
                multiplicity = 0;
            multiplicity += 1;
            if (i < this.bSplineDemo.firstKnotIndexWhereCurveDefined || i > this.bSplineDemo.firstKnotIndexWhereCurveUndefined || arr[i + 1] && arr[i + 1] == t)
                return;
            const knotPosition = this.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t);
            drawSquare(
                this.p5,
                knotPosition,
                this.knotMarkerColor,
                this.bSplineDemo.basePointDiameter * 0.75
            );
            if (this.bSplineDemo.showPointLabels && this.bSplineDemo.knotVector[i] !== 0) {
                //draw labels with semi-transparent white background (rectangle)
                const centerX = knotPosition.x - (multiplicity > 1 ? 60 : 40);
                const centerY = knotPosition.y + 10;
                const text = `t=${+(this.bSplineDemo.knotVector[i].toFixed(2))}${multiplicity > 1 && ((arr[i + 1] && arr[i + 1] !== t) || arr[i + 1] == undefined) ? ` (${multiplicity}x)` : ''}`;
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
            this.bSplineDemo.basePointDiameter * 1.5
        );
    }

    private drawDeBoorVisualization(tempPtsCreatedDuringEvaluation: p5.Vector[][]) {
        if (tempPtsCreatedDuringEvaluation.length <= 2) { //only a single iteration or none was needed to get the position of the point (note: iteration 0 is just copying the control points, no interpolations are made)
            return;
        }
        tempPtsCreatedDuringEvaluation.forEach((iteration) => {
            iteration.slice(0, -1).forEach((pt, i) => drawLineVector(this.p5, pt, iteration[i + 1], this.color, this.bSplineDemo.baseLineWidth));
            iteration.forEach(pt => drawCircle(this.p5, pt, this.color, this.bSplineDemo.basePointDiameter));
        });
    }
}
