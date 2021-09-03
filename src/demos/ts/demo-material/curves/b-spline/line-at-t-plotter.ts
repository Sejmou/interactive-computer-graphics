import p5 from 'p5';
import { Drawable } from '../../../utils/ui';
import { drawLineXYCoords } from "../../../utils/p5";
import colors from "../../../../../global-styles/color_exports.scss";
import { BSplineGraphPlotter } from './graph-plotter';
import { BSplineDemo } from './b-spline-curve';




export class LineAtTPlotter implements Drawable {
    private lineThroughTColor: p5.Color = this.p5.color(colors.errorColor);

    constructor(private p5: p5, private bSplineDemo: BSplineDemo, private graphPlotter: BSplineGraphPlotter) { }

    draw(): void {
        if (this.bSplineDemo.showCurveDrawingVisualization && this.bSplineDemo.valid)
            this.drawLineAtT();
    }

    private drawLineAtT() {
        if (this.bSplineDemo.controlPoints.length <= 0)
            return;
        const currT = this.bSplineDemo.t;
        const x = this.graphPlotter.axisRulerOffsetFromBorder + currT / (this.bSplineDemo.tMax - this.bSplineDemo.tMin) * this.graphPlotter.distMinToMaxXAxis;
        drawLineXYCoords(this.p5, x, 0, x, this.p5.height, this.lineThroughTColor, 2);
    }
}
