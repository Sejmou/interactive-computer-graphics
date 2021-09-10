import p5 from 'p5';
import { MyObserver } from "../../../utils/interactivity/my-observable";
import { drawCircle, drawLineVector } from "../../../utils/p5/misc";
import { DemoChange } from '../base/demo';
import { CurveDrawingVisualization } from "../base/curve-drawing-vis";
import { BezierDemo } from './demo';


/**
 * Visualizes De Casteljau's algorithm for evaluating/rendering Bézier curves
 */
export class DeCasteljauVisualization extends CurveDrawingVisualization implements MyObserver<DemoChange> {
    private visible: boolean = false;

    constructor(p5: p5, demo: BezierDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        super(p5, demo, color, colorOfPointOnCurve);
        demo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged')
            this.updateVisibility();
    }

    private updateVisibility() {
        this.visible = this.demo.controlPoints.length >= 2;
    }

    public draw() {
        if (this.visible)
            this.recursiveDraw(this.demo.controlPoints.map(v => v.position));
    }

    private recursiveDraw(ctrlPtPositions: p5.Vector[]) {
        if (ctrlPtPositions.length <= 1) {
            //this shouldn't normally be reached
            return;
        }

        const interpolatedPositionsOfAdjacentCtrlPts = ctrlPtPositions.slice(0, -1).map((v, i) => p5.Vector.lerp(v, ctrlPtPositions[i + 1], this.demo.t) as unknown as p5.Vector); //again, fail in @types/p5???

        interpolatedPositionsOfAdjacentCtrlPts.forEach((pos, i) => {
            if (!this.onlyDrawPointOnCurve && this.demo.controlPoints.length >= 3)
                drawLineVector(this.p5, ctrlPtPositions[i], ctrlPtPositions[i + 1], this.color, this.demo.baseLineWidth);
            if (interpolatedPositionsOfAdjacentCtrlPts.length === 1)
                this.drawPointOnBezierCurve(interpolatedPositionsOfAdjacentCtrlPts[0]);
            else
                drawCircle(this.p5, pos, this.color, this.demo.basePointDiameter);
        });

        this.recursiveDraw(interpolatedPositionsOfAdjacentCtrlPts);
    }

    private drawPointOnBezierCurve(pos: p5.Vector) {
        const posX = pos.x;
        const posY = pos.y;

        drawCircle(this.p5, pos, this.colorOfPointOnCurve, this.demo.basePointDiameter * 1.5);
        const showLabel = this.demo.showPointLabels;
        const showPosition = this.demo.showPointPositions;
        const positionDisplayMode = this.demo.positionDisplayMode;
        if (showLabel || showPosition) {
            const label = `${showLabel ? 'C(t) ' : ''}${showPosition ? `${positionDisplayMode === 'normalized coordinates' ? `(${posX}, ${posY})` : `(${(posX / this.p5.width).toFixed(2)}, ${(posY / this.p5.height).toFixed(2)})`}` : ''}`;
            const labelPosX = posX + 10;
            const labelPosY = posY - 10;
            this.p5.push();
            this.p5.text(label, labelPosX, labelPosY);
            this.p5.pop();
        }
    }
}
