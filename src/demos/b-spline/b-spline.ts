import './b-spline.scss';
import { Sketch } from "../ts/sketch";
import { BSplineDemo } from '../ts/curves/b-spline-curve';
import { DemoChange } from '../ts/curves/base-curve';
import colors from '../../global-styles/color_exports.scss';
import p5 from 'p5';
import { createArrayOfEquidistantAscendingNumbersInRange, drawLineXYCoords, renderTextWithSubscript } from '../ts/util';
import { Drawable, MyObserver } from '../ts/ui-interfaces';
import { DragVertex } from '../ts/vertex';

const demoContainerId = 'demo';

const descriptionId = 'demo-description'
const descriptionParagraph = document.getElementById(descriptionId);
if (descriptionParagraph) descriptionParagraph.innerText = `B-spline curves are a generalization of Bèzier curves with a very nice property: Contrary to Bézier curves, their control points only have local control instead of global control.`;

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

    const basisFuncSketch = new Sketch(basisFuncContainerId);
    await basisFuncSketch.create();
    basisFuncSketch.add(p5 => new BSplineGraphPlotter(p5, bSplineDemo));

    document.querySelector('#cover')?.remove();
};

createDemo();



interface CurveData {
    yValues: number[],
    controlPoint: DragVertex
}

class BSplineGraphPlotter implements Drawable, MyObserver<DemoChange> {
    private noOfStepsXAxis: number = 200;
    private xValues: number[] = [];
    private distMinToMaxXAxis: number;
    private distMinToMaxYAxis: number;

    private lineThroughTColor: p5.Color;
    private axisRulerOffsetFromBorder: number;
    private axisRulerAndLabelColor: p5.Color;
    private rulerMarkerSize: number;

    private dataPoints: CurveData[] = [];

    constructor(private p5: p5, private bSplineDemo: BSplineDemo) {
        this.axisRulerOffsetFromBorder = this.p5.width / 15;
        this.rulerMarkerSize = this.axisRulerOffsetFromBorder * 0.075;

        this.distMinToMaxXAxis = this.p5.width - this.axisRulerOffsetFromBorder * 1.5;
        this.distMinToMaxYAxis = this.p5.height - this.axisRulerOffsetFromBorder * 1.5;

        this.lineThroughTColor = this.p5.color(colors.errorColor);
        this.axisRulerAndLabelColor = p5.color(30);

        this.computeBSplineCurves();
        bSplineDemo.subscribe(this);
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') {
            this.computeBSplineCurves();
        }
    }

    computeBSplineCurves() {
        const ctrlPts = this.bSplineDemo.controlPoints;
        if (ctrlPts.length < 2) {
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
        this.dataPoints.forEach((d, i) => {
            console.log(`N_{${i},${degree}}`);
            console.log(d.yValues.map((y, i) => ({x: this.xValues[i], y: y})));
            console.log('');
        });
        const sumOfN_ik_overRangeOfX: number[] = this.xValues.map(x => 0);
        const yValues = this.dataPoints.map(d => d.yValues);
        for (let i = 0; i < this.xValues.length; i++) {
            for (let j = 0; j < yValues.length; j++) {
                sumOfN_ik_overRangeOfX[i] += yValues[j][i];
            }
        }
        console.log(sumOfN_ik_overRangeOfX.map((y, i) => ({x: this.xValues[i], y: y})));
    }

    draw(): void {
        if (this.dataPoints.length > 0) {
            this.drawBSplineCurves();
            this.drawAxisRulersAndLabels();
            this.drawLineAtT();
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
                const x1 = x * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y1 = this.p5.height - this.axisRulerOffsetFromBorder - y * this.distMinToMaxYAxis;
                const x2 = nextX * this.distMinToMaxXAxis + this.axisRulerOffsetFromBorder;
                const y2 = this.p5.height - this.axisRulerOffsetFromBorder - nextY * this.distMinToMaxYAxis;
                drawLineXYCoords(this.p5, x1, y1, x2, y2, lineColor, lineThickness);
            });
        });
    }

    private drawAxisRulersAndLabels() {
        //horizontal line
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder,
            this.p5.width, this.p5.height - this.axisRulerOffsetFromBorder, this.axisRulerAndLabelColor, 1);
        //vertical line
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder, 0, this.axisRulerAndLabelColor, 1);

        this.drawRulerMarkersAndLabelsXAxis();
        this.drawRulerMarkersAndLabelsYAxis();
    }

    private drawRulerMarkersAndLabelsXAxis() {
        const knotVector = this.bSplineDemo.knotVector;
        const knotVectorPositionsXAxis = knotVector.map(t_i => (t_i / (this.bSplineDemo.tMax - this.bSplineDemo.tMin)) * this.distMinToMaxXAxis);
        for (let i = 0; i < knotVectorPositionsXAxis.length; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder,
                this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder + this.rulerMarkerSize,
                this.axisRulerAndLabelColor, 1);

            //label
            this.p5.push();
            this.p5.textAlign(this.p5.CENTER);
            renderTextWithSubscript(this.p5, `t_{${i}}`, this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder / 3);
            this.p5.text(knotVector[i], this.axisRulerOffsetFromBorder + knotVectorPositionsXAxis[i], this.p5.height - this.axisRulerOffsetFromBorder / 1.5);
            this.p5.pop();
        }
    }

    private drawRulerMarkersAndLabelsYAxis() {
        const steps = 10;
        const rulerMarkerIncrementY = this.distMinToMaxYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? this.rulerMarkerSize * 2 : this.rulerMarkerSize), this.p5.height - this.axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);

        this.p5.text('0.5', this.axisRulerOffsetFromBorder / 2, this.p5.height - this.axisRulerOffsetFromBorder - steps / 2 * rulerMarkerIncrementY);
        this.p5.text('1', this.axisRulerOffsetFromBorder / 2, this.p5.height - this.axisRulerOffsetFromBorder - steps * rulerMarkerIncrementY);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        renderTextWithSubscript(this.p5, 'c_{i,n}', this.axisRulerOffsetFromBorder / 10, this.axisRulerOffsetFromBorder * 1.5 + this.distMinToMaxYAxis / 2);

        this.p5.pop();
    }

    private drawLineAtT() {
        const currT = this.bSplineDemo.t;
        const x = this.axisRulerOffsetFromBorder + currT / (this.bSplineDemo.tMax - this.bSplineDemo.tMin) * this.distMinToMaxXAxis;
        drawLineXYCoords(this.p5, x, 0, x, this.p5.height, this.lineThroughTColor, 2);
    }

    private renderInfoText() {
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text('Add at least two control points to the canvas on the left!\nThe B-spline basis functions will then show up here.', this.p5.width / 2, this.p5.height / 2);
        this.p5.pop();
    }
}