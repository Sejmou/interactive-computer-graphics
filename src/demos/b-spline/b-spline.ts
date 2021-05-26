import './b-spline.scss';
import { Sketch } from "../ts/sketch";
import { BSplineDemo } from '../ts/curves/b-spline-curve';
import { DemoChange } from '../ts/curves/base-curve';
import colors from '../../global-styles/color_exports.scss';
import p5 from 'p5';
import { createArrayOfEquidistantAscendingNumbersInRange, drawLineXYCoords, FrameRateMonitor, renderTextWithSubscript } from '../ts/util';
import { Drawable, MyObserver } from '../ts/ui-interfaces';
import { DragVertex } from '../ts/vertex';

const demoContainerId = 'demo';

const descriptionId = 'demo-description'
const descriptionParagraph = document.getElementById(descriptionId);
if (descriptionParagraph) descriptionParagraph.innerText = `B-spline curves are a generalization of Bèzier curves with a very practical property: In contrast to Bézier curves their control points only have local control.`;

//add container for b-spline basis functions visualization
const basisFuncContainer = document.createElement('div');
const basisFuncContainerId = 'b-spline-basis-function-visualization';
basisFuncContainer.id = basisFuncContainerId;
basisFuncContainer.className = 'flex-col center-cross-axis';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', basisFuncContainer);

async function createDemo() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    const bSplineDemo = sketch.add((p5, containerId) => new BSplineDemo(p5, containerId));

    //setting FPS to 0 causes sketch to instantiate p5 with noLoop() as last call in setup
    //this causes the sketch to only be redrawn when p5.redraw() is called
    const basisFuncSketch = new Sketch(basisFuncContainerId, undefined, undefined, undefined, 0);
    await basisFuncSketch.create();

    //the graphPlotter calls p5.redraw() whenever something relevant changes in the bSplineDemo
    //the graphPlotter it gets notified by the bSplineDemo via its update() method as it has subscribed to the DemoChanges of the bSplineDemo
    const graphPlotter = basisFuncSketch.add(p5 => new BSplineGraphPlotter(p5, bSplineDemo));

    //if the hover/drag state of a control point of the BSplineDemo changes, the graph has to be redrawn (hovered functions are drawn bold)
    bSplineDemo.onHoverChange = () => graphPlotter.redraw();
    bSplineDemo.onDraggingChange = () => graphPlotter.redraw();

    const lineForTSketch = new Sketch(basisFuncContainerId, undefined, undefined, p5 => null);
    await lineForTSketch.create();
    lineForTSketch.add(p5 => new LineAtTPlotter(p5, bSplineDemo, graphPlotter));

    document.querySelector('#cover')?.remove();
};

createDemo();



interface CurveData {
    yValues: number[],
    controlPoint: DragVertex
}

class BSplineGraphPlotter implements Drawable, MyObserver<DemoChange> {
    private noOfStepsXAxis: number = 700;
    private xValues: number[] = [];

    //needed by LineAtTPlotter
    public get distMinToMaxXAxis() {
        return this._distMinToMaxXAxis;
    }
    private _distMinToMaxXAxis: number;

    private distMinToMaxYAxis: number;

    //needed by LineAtTPlotter
    public get axisRulerOffsetFromBorder() {
        return this._axisRulerOffsetFromBorder;
    }
    private _axisRulerOffsetFromBorder: number;
    private axisRulerAndLabelColor: p5.Color;
    private rulerMarkerSize: number;

    private dataPoints: CurveData[] = [];

    constructor(private p5: p5, private bSplineDemo: BSplineDemo) {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this.rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        this._distMinToMaxXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this.distMinToMaxYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;

        this.axisRulerAndLabelColor = p5.color(30);

        this.computeBSplineCurves();
        setTimeout(() => this.redraw(), 100);
        bSplineDemo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged' || data === 'knotVectorChanged' || data === 'rangeOfTChanged') {
            this.computeBSplineCurves();
            this.redraw();
        }
    }

    /**
     * Caution: calling this only makes sense if p5 is set to noLoop()!
     */
    redraw() {
        this.p5.redraw();
    }

    computeBSplineCurves() {
        const ctrlPts = this.bSplineDemo.controlPoints;
        if (ctrlPts.length < 1) {
            this.xValues = [];
            this.dataPoints = [];
            return;
        }
        const basisFunctions = this.bSplineDemo.basisFunctions;
        const degree = this.bSplineDemo.degree;

        this.xValues = createArrayOfEquidistantAscendingNumbersInRange(this.noOfStepsXAxis, this.bSplineDemo.tMin, this.bSplineDemo.tMax);

        this.dataPoints = ctrlPts.map((pt, i) => ({
            yValues: this.xValues.map(x => basisFunctions[degree][i](x)),
            controlPoint: pt
        }));
        // this.dataPoints.forEach((d, i) => {
        //     console.log(`N_{${i},${degree}}`);
        //     console.log(d.yValues.map((y, i) => ({ x: this.xValues[i], y: y })));
        //     console.log('');
        // });
        // const sumOfN_ik_overRangeOfX: number[] = this.xValues.map(x => 0);
        // const yValues = this.dataPoints.map(d => d.yValues);
        // for (let i = 0; i < this.xValues.length; i++) {
        //     for (let j = 0; j < yValues.length; j++) {
        //         sumOfN_ik_overRangeOfX[i] += yValues[j][i];
        //     }
        // }
        // console.log(sumOfN_ik_overRangeOfX.map((y, i) => ({ x: this.xValues[i], y: y })));
    }

    draw(): void {
        if (this.dataPoints.length > 0) {
            this.drawBSplineCurves();
            this.drawAxisRulersAndLabels();
        }
        else this.renderInfoText();
    }


    private drawBSplineCurves() {
        this.dataPoints.forEach(d => {
            const lineColor = d.controlPoint.color;
            const lineThickness = (d.controlPoint.hovering || d.controlPoint.dragging) ? 4 : 1.5;

            d.yValues.forEach((y, i, yVals) => {
                if (i === yVals.length - 1) return;
                const x = this.xValues[i] / (this.bSplineDemo.tMax - this.bSplineDemo.tMin);
                const nextY = yVals[i + 1];
                const nextX = this.xValues[i + 1] / (this.bSplineDemo.tMax - this.bSplineDemo.tMin);
                const x1 = x * this._distMinToMaxXAxis + this._axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this._axisRulerOffsetFromBorder - y * this.distMinToMaxYAxis;
                const x2 = nextX * this._distMinToMaxXAxis + this._axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this._axisRulerOffsetFromBorder - nextY * this.distMinToMaxYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });
    }

    private drawAxisRulersAndLabels() {
        //horizontal line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this.p5.width, this.p5.height - this._axisRulerOffsetFromBorder, this.axisRulerAndLabelColor, 1);
        //vertical line
        drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder,
            this._axisRulerOffsetFromBorder, 0, this.axisRulerAndLabelColor, 1);

        this.drawRulerMarkersAndLabelsXAxis();
        this.drawRulerMarkersAndLabelsYAxis();
    }

    private drawRulerMarkersAndLabelsXAxis() {
        const knotVector = this.bSplineDemo.knotVector;
        const knotVectorPositionsXAxis = knotVector.map(t_i => (t_i / (this.bSplineDemo.tMax - this.bSplineDemo.tMin)) * this._distMinToMaxXAxis);
        for (let i = 0; i < knotVectorPositionsXAxis.length; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder,
                this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder + this.rulerMarkerSize,
                this.axisRulerAndLabelColor, 1);

            //label
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            renderTextWithSubscript(this.p5, `t_{${i}}`, this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder / 3);

            //'+' before knotVector[i] drops "extra" zeroes at the end by changing toFixed()'s output string to number -> use only as many digits as necessary https://stackoverflow.com/a/12830454/13727176
            this.p5.text(+knotVector[i].toFixed(2), this._axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this._axisRulerOffsetFromBorder / 1.5);
            this.p5.pop();
        }
    }

    private drawRulerMarkersAndLabelsYAxis() {
        const steps = 10;
        const rulerMarkerIncrementY = this.distMinToMaxYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this._axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? this.rulerMarkerSize * 2 : this.rulerMarkerSize), this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this._axisRulerOffsetFromBorder, this.p5.height - this._axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);

        this.p5.text('0.5', this._axisRulerOffsetFromBorder / 2, this.p5.height - this._axisRulerOffsetFromBorder - steps / 2 * rulerMarkerIncrementY);
        this.p5.text('1', this._axisRulerOffsetFromBorder / 2, this.p5.height - this._axisRulerOffsetFromBorder - steps * rulerMarkerIncrementY);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        renderTextWithSubscript(this.p5, 'c_{i,n}', this._axisRulerOffsetFromBorder / 10, this._axisRulerOffsetFromBorder * 1.5 + this.distMinToMaxYAxis / 2);

        this.p5.pop();
    }

    private renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add control points to the canvas on the left!\nThe B-spline basis functions will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}





class LineAtTPlotter implements Drawable {
    private lineThroughTColor: p5.Color = this.p5.color(colors.errorColor);

    constructor(private p5: p5, private bSplineDemo: BSplineDemo, private graphPlotter: BSplineGraphPlotter) {}

    draw(): void {
        this.drawLineAtT();
    }

    private drawLineAtT() {
        if (this.bSplineDemo.controlPoints.length <= 0) return;
        const currT = this.bSplineDemo.t;
        const x = this.graphPlotter.axisRulerOffsetFromBorder + currT / (this.bSplineDemo.tMax - this.bSplineDemo.tMin) * this.graphPlotter.distMinToMaxXAxis;
        drawLineXYCoords(this.p5, x, 0, x, this.p5.height, this.lineThroughTColor, 2);
    }
}