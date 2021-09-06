import { drawLineXYCoords } from "../../../utils/p5";
import { CtrlPtInfluenceFuncGraphPlotter } from "../base/graph-plotter";



/**
 * Plots Bernstein polynomials of a Bézier Curve
 */
export class BernsteinGraphPlotter extends CtrlPtInfluenceFuncGraphPlotter {
    protected ctrlPtInfluenceFunctionsName: string = 'Bernstein polynomials';
    protected yAxisLabel: string = 'b_{i,n}';
    
    protected drawRulerMarkersAndLabelsXAxis(): void {
        //horizontal line
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder,
            this.p5.width, this.p5.height - this.axisRulerOffsetFromBorder, this.axisRulerAndLabelColor, 1);


        //ruler markers
        const steps = 10;
        const rulerMarkerSize = this.axisRulerOffsetFromBorder * 0.075;

        const rulerMarkerIncrementX = this.distMinToMaxXAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder,
                this.axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder + (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize),
                this.axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('t', this.axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height);
        this.p5.text('0.5', this.axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder / 2);
        this.p5.text('1', this.axisRulerOffsetFromBorder + steps * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder / 2);
        this.p5.pop();
    }
}
