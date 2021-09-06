import p5 from 'p5';
import { Drawable } from '../../../utils/ui';
import { drawLineXYCoords } from "../../../utils/p5";
import colors from "../../../../../global-styles/color_exports.scss";
import { CtrlPtInfluenceFuncGraphPlotter } from './graph-plotter';
import { CurveDemo } from './demo';



/**
 * Use together with CtrlPtInfluenceFuncGraphPlotter: Draws a vertical red line for the current value of t over the graph created by the graph plotter. For usage examples, look into the demos that use some kind of CtrlPtInfluenceFuncGraphPlotter.
 */
export class LineAtTPlotter implements Drawable {
    private lineThroughTColor: p5.Color = this.p5.color(colors.errorColor);

    constructor(private p5: p5, private demo: CurveDemo, private graphPlotter: CtrlPtInfluenceFuncGraphPlotter) { }

    draw(): void {
        if (this.demo.showCurveDrawingVisualization && this.demo.valid)
            this.drawLineAtT();
    }

    private drawLineAtT() {
        if (this.demo.controlPoints.length <= 0)
            return;
        const currT = this.demo.t;
        const x = this.graphPlotter.axisRulerOffsetFromBorder + currT / (this.demo.tMax - this.demo.tMin) * this.graphPlotter.distMinToMaxXAxis;
        drawLineXYCoords(this.p5, x, 0, x, this.p5.height, this.lineThroughTColor, 2);
    }
}
