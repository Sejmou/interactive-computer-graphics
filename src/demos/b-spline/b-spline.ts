import './b-spline.scss';
import { Sketch } from "../ts/sketch";
import { BSplineDemo } from '../ts/curves/b-spline-curve';
import { DemoChange } from '../ts/curves/base-curve';
import colors from '../../global-styles/color_exports.scss';
import p5 from 'p5';
import { createArrayOfEquidistantAscendingNumbersInRange, drawLineXYCoords, renderTextWithSubscript } from '../ts/util';
import { Drawable, MyObserver } from '../ts/ui-interfaces';

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
    color?: p5.Color
}

class BSplineGraphPlotter implements Drawable, MyObserver<DemoChange> {
    private noOfStepsXAxis: number = 200;
    private xValues: number[] = [];

    private lineThroughTColor: p5.Color;
    private axisRulerOffsetFromBorder: number;
    private axisRulerAndLabelColor: p5.Color;
    private distMinToMaxXAxis: number;
    private distMinToMaxYAxis: number;

    private dataPoints: CurveData[] = [];

    constructor(private p5: p5, private bSplineDemo: BSplineDemo) {
        this.lineThroughTColor = this.p5.color(colors.errorColor);

        this.axisRulerOffsetFromBorder = this.p5.width / 15;
        this.axisRulerAndLabelColor = p5.color(30);
        this.distMinToMaxXAxis = this.p5.width - this.axisRulerOffsetFromBorder * 1.5;
        this.distMinToMaxYAxis = this.p5.height - this.axisRulerOffsetFromBorder * 1.5;

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
        const k = this.bSplineDemo.order;

        this.xValues = createArrayOfEquidistantAscendingNumbersInRange(this.noOfStepsXAxis, this.bSplineDemo.tMin, this.bSplineDemo.tMax);

        this.dataPoints = ctrlPts.map((pt, i) => ({
            yValues: this.xValues.map(x => basisFunctions[i][k](x)),
            color: pt.color
        }));
        this.dataPoints.forEach((d, i) => {
            console.log(`N_{${i},${k}}`);
            d.yValues.forEach((y, i) => console.log(`x: ${this.xValues[i]}, y: ${y}`));
            console.log('');
        });
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
            const lineColor = d.color;
            const lineThickness = 1.5;

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


        //ruler markers
        const steps = 10;
        const rulerMarkerSize = this.axisRulerOffsetFromBorder * 0.075;

        const rulerMarkerIncrementX = this.distMinToMaxXAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder,
                this.axisRulerOffsetFromBorder + i * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder + (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize),
                this.axisRulerAndLabelColor, 1);
        }

        const rulerMarkerIncrementY = this.distMinToMaxYAxis / steps;
        for (let i = 1; i <= steps; i++) {
            drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder - (i === steps / 2 || i === steps ? rulerMarkerSize * 2 : rulerMarkerSize), this.p5.height - this.axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerOffsetFromBorder, this.p5.height - this.axisRulerOffsetFromBorder - i * rulerMarkerIncrementY,
                this.axisRulerAndLabelColor, 1);
        }


        //labels
        this.p5.push();
        this.p5.textAlign(this.p5.CENTER);

        //x-axis
        this.p5.text('t', this.axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height);
        //this.p5.text('0.5', this.axisRulerOffsetFromBorder + steps / 2 * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder / 2);
        this.p5.text(this.bSplineDemo.tMax, this.axisRulerOffsetFromBorder + steps * rulerMarkerIncrementX, this.p5.height - this.axisRulerOffsetFromBorder / 2);

        //y-axis
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