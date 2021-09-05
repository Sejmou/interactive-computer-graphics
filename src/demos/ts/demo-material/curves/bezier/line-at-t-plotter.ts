import p5 from 'p5';
import { Drawable } from '../../../utils/ui';
import { drawLineXYCoords } from "../../../utils/p5";
import colors from "../../../../../global-styles/color_exports.scss";
import { BernsteinGraphPlotter } from './graph-plotter';
import { BezierDemo } from './demo';


//TODO: refactor - duplicated in b-spline!

export class LineAtTPlotter implements Drawable {
    private lineThroughTColor: p5.Color = this.p5.color(colors.errorColor);

    constructor(private p5: p5, private bezierDemo: BezierDemo, private graphPlotter: BernsteinGraphPlotter) { }

    draw(): void {
        if (this.bezierDemo.showCurveDrawingVisualization && this.bezierDemo.valid)
            this.drawLineAtT();
    }

    private drawLineAtT() {
        if (this.bezierDemo.controlPoints.length <= 0)
            return;
        const currT = this.bezierDemo.t;
        const x = this.graphPlotter.axisRulerOffsetFromBorder + currT / (this.bezierDemo.tMax - this.bezierDemo.tMin) * this.graphPlotter.distFromZeroToOneXAxis;
        drawLineXYCoords(this.p5, x, 0, x, this.p5.height, this.lineThroughTColor, 2);
    }
}
