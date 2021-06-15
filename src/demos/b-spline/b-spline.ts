import './b-spline.scss';
import { Sketch } from "../ts/sketch";
import { BSplineDemo, DeBoorControlPointInfluenceVisualization } from '../ts/curves/b-spline-curve';
import { DemoChange } from '../ts/curves/base-curve';
import colors from '../../global-styles/color_exports.scss';
import p5 from 'p5';
import { addParagraphWithGivenContentToHtmlElementWithId, createArrayOfEquidistantAscendingNumbersInRange, drawLineXYCoords, FrameRateMonitor, renderTextWithSubscript } from '../ts/util';
import { Drawable, MyObserver } from '../ts/ui-interfaces';
import { DragVertex } from '../ts/vertex';

const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description';

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`B-Spline curves are a generalization of Bèzier curves with two very practical properties compared to Bézier curves:<br>
    Their evaluation remains efficient even for very large numbers of control points, and their control points only have "local control".`
);

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`B-Spline curves can be expressed mathematically using the formula \[ C(t) = \sum_{i=0}^{n}{N_{i,p}(t) \cdot P_{i}}. \]
where \(p\) is the degree of the curve and \( k = p + 1 \) is its order. The \(N_{i,p}(t)\) are the <em>basis functions</em> of the B-Spline curve. The \(P_{i}\) are the curve's \(n + 1\) control points, sometimes called <em>de Boor points</em>.`
);

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`Note that, contrary to Bézier curves, the degree of a B-Spline curve (and therefore also its order) is independent of the number of control points.<br>
It stays the same even if more points are added, getting rid of the problem of exponentially increasing computational effort with each added control point.`
);

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`For B-Spline curves, a new concept is introduced: a knot vector \(T = \{t_0, t_1, ..., t_m\}\) containing \(m + 1\) values (where \( m = n + k \)) in non-decreasing order, called knots.<br>
If we have a "valid" knot vector, this allows us to define the basis functions \(N_{i,p}\) of degree \(p\) of the B-Spline curve that are computed using a recursive formula:
\[N_{i,j}(t) = \frac{ t - t_{i} } { t_{i + j} - t_i } \cdot N_{i, j - 1}(t) + \frac{ t_{i + j + 1} - t } { t_{i + j + 1} - t_{i + 1} } \cdot N_{i + 1, j - 1}(t),\]
With the "base case" being:
\[N_{i,0} = \begin{cases} 1 & \text{if } t_{i} \leq x < t_{i + 1} \\ 0 & \text{otherwise.} \end{cases} \]`
);

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`The knots of the knot vector determine at what value of \(t\) a basis function starts to gain influence on the position of the point on the curve while another one looses influence.<br>
They split the space for parameter \(t\) into segments. In each so-called <em>span</em> \([t_i,t_{i+1})\) defined by two adjacent knots \(t_i\) and \(t_{i+1}\), at most \(p+1\) degree \(p\) basis functions are non-zero.<br>
For a given \(t\), each \(N_{i,p}(t)\) is only \(> 0\) in a certain interval and \(0\) outside of it. Those properties combined give us the desired local (instead of global) influence of control points.<br>
We can think of B-Splines as piecewise polynomial functions (or, more specific, Bézier curves) of degree \( p \) that meet at the knots of the knot vector.<br>
Side-note: there is no upper limit for the largest knot value which means that the domain in which a B-Spline is defined is no longer necessarily \([0, 1]\).<br>`
);

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`B-Spline curves are only defined in the interval for \(t\) where the condition \(\sum_{i=0}^{n}{N_{i,p}(t) \cdot P_{i}} = 1\) is satisfied. We differentiate between open and closed B-Spline curves.<br>
Compared to open B-Spline curves, closed B-Spline curves put additional restrictions on the knot vector: Its first \(k\) values must be the same. The same restriction also applies to its last \(k\) values.<br>
A consequence of this restriction is that closed B-Spline curves are defined in the whole interval \([t_0, t_m]\), while for open B-Spline curves we can only guarantee that they are defined in the interval \([t_p, t_{m-p}]\).`
);

MathJax.typeset([`#${descriptionContainerId}`]);

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
    bSplineDemo.showPointLabels = true;

    sketch.add((p5) => new DeBoorControlPointInfluenceVisualization(p5, bSplineDemo));

    //setting FPS to 0 causes sketch to instantiate p5 with noLoop() as last call in setup
    //this causes the sketch to only be redrawn when p5.redraw() is called, improving performance
    const basisFuncSketch = new Sketch(basisFuncContainerId, undefined, undefined, undefined, 0);
    await basisFuncSketch.create();

    //the graphPlotter calls p5.redraw() whenever something relevant changes in the bSplineDemo
    //the graphPlotter it gets notified by the bSplineDemo via its update() method as it has subscribed to the DemoChanges of the bSplineDemo
    const graphPlotter = basisFuncSketch.add(p5 => new BSplineGraphPlotter(p5, bSplineDemo));

    //if the hover/drag state of a control point of the BSplineDemo changes, the graph has to be redrawn (hovered functions are drawn bold)
    bSplineDemo.onHoverChange = () => graphPlotter.redraw();
    bSplineDemo.onDraggingChange = () => graphPlotter.redraw();

    //drawing line for current value of t on top of plot's canvas (onto new transparent canvas that is positioned above the plot's canvas)
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

    private curveDomainBorderColor: p5.Color;

    private dataPoints: CurveData[] = [];

    constructor(private p5: p5, private bSplineDemo: BSplineDemo) {
        this._axisRulerOffsetFromBorder = this.p5.width / 15;
        this.rulerMarkerSize = this._axisRulerOffsetFromBorder * 0.075;

        this._distMinToMaxXAxis = this.p5.width - this._axisRulerOffsetFromBorder * 1.5;
        this.distMinToMaxYAxis = this.p5.height - this._axisRulerOffsetFromBorder * 1.5;

        this.axisRulerAndLabelColor = p5.color(30);
        this.curveDomainBorderColor = p5.color(120);

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
            if (this.bSplineDemo.valid) this.drawBordersOfCurveDomain();
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

    private drawBordersOfCurveDomain() {
        //lower bound
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + this.bSplineDemo.firstTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder + this.bSplineDemo.firstTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this.distMinToMaxYAxis - this.axisRulerOffsetFromBorder, this.curveDomainBorderColor, 1);
        //upper bound
        drawLineXYCoords(this.p5, this.axisRulerOffsetFromBorder + this.bSplineDemo.lastTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this._axisRulerOffsetFromBorder,
            this.axisRulerOffsetFromBorder + this.bSplineDemo.lastTValueWhereCurveDefined * this.distMinToMaxXAxis, this.p5.height - this.distMinToMaxYAxis - this.axisRulerOffsetFromBorder, this.curveDomainBorderColor, 1);
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

    constructor(private p5: p5, private bSplineDemo: BSplineDemo, private graphPlotter: BSplineGraphPlotter) { }

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