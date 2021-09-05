import './bernstein.scss';
import p5 from "p5";
import { BezierDemo } from "../../ts/demo-material/curves/bezier/demo";
import { Sketch } from '../../ts/utils/sketch';
import { addTextAsParagraphToElement, BooleanPropCheckbox } from "../../ts/utils/dom-helpers";
import { BernsteinCurveFormulas } from '../../ts/demo-material/curves/bezier/bernstein-curve-formulas';
import { BernsteinPolynomialInfluenceBarVisualization } from '../../ts/demo-material/curves/bezier/ctrl-pt-influence-vis';
import { DemoChange } from '../../ts/demo-material/curves/base/demo';
import { BernsteinGraphPlotter } from '../../ts/demo-material/curves/bezier/graph-plotter';
import { LineAtTPlotter } from '../../ts/demo-material/curves/bezier/line-at-t-plotter';



const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description-container';
const descriptionContainer = document.getElementById(descriptionContainerId)!;

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`In math terms, a Bézier curve of degree \(n\) can be expressed as \[ C(t) = \sum_{i=0}^{n}{b_{i,n}(t) \cdot P_{i}}. \]
Each \( b_{i,n}(t) \) is the <b>Bernstein polynomial</b> of \(P_i\), a particular control point of the Bézier curve. \( P_i \) is a 2D vector \( (x, y)\).
<br>The Bernstein polynomial represents the 'influence' of the control point on the shape of the Bézier curve for the current value of \(t\).`
);

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`The formula for computing each Bernstein polynomial is \[ b_{i,n} = \binom{n}{i} \cdot t^{i} \cdot (1-t)^{n - i} \]`
);

MathJax.typeset([`#${descriptionContainerId}`]);

//add container for bernstein polynomial visualization
const bernsteinGraphContainer = document.createElement('div');
const bernsteinGraphContainerId = 'bernstein-graph-container';
bernsteinGraphContainer.id = bernsteinGraphContainerId;
bernsteinGraphContainer.className = 'flex-column center-cross-axis';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', bernsteinGraphContainer);


async function createDemo() {
    //override default sketch width for bezier sketch
    const bezierSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.6, 700);
    //setting frame rate to 30 as steady 60 fps are not possible somehow (too many calculations?)
    const bezierSketch = new Sketch(demoContainerId, bezierSketchWidth, undefined, undefined, 30);
    await bezierSketch.create();
    //bezierDemo animation has to be twice as fast as we use only half the FPS
    const bezierDemo = bezierSketch.add((p5, containerId) => new BezierDemo(p5, containerId, 2));
    bezierDemo.showPointLabels = true;
    bezierDemo.showPointPositions = true;

    const bernsteinInfluenceBarVis = bezierSketch.add(p5 => new BernsteinPolynomialInfluenceBarVisualization(p5, bezierDemo, false));
    new BooleanPropCheckbox<BezierDemo, DemoChange>({
        objectToSubscribeTo: bezierDemo,
        labelText: 'show control point influence bars',
        getCurrValOfPropToModify: () => bernsteinInfluenceBarVis.visible,
        onUserChangedCheckboxChecked: newVal => {
            bernsteinInfluenceBarVis.visible = newVal;
            console.log(newVal);
            console.log(bernsteinInfluenceBarVis.visible);
        },
        shouldCheckboxBeVisible: demo => demo.valid,
        parentContainerId: demoContainerId
    });

    const bernsteinVisSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.35, 400);
    const bernsteinVisSketchHeight = bernsteinVisSketchWidth;
    const bernsteinGraphSketch = new Sketch(bernsteinGraphContainerId, bernsteinVisSketchWidth, bernsteinVisSketchHeight, () => undefined, 0);
    await bernsteinGraphSketch.create();

    const bernsteinGraphPlotter = bernsteinGraphSketch.add((p5) => new BernsteinGraphPlotter(p5, bezierDemo));
    //if the hover/drag state of a control point of the BezierDemo changes, the graph has to be redrawn (hovered functions are drawn bold)
    bezierDemo.onHoverChange = () => bernsteinGraphPlotter.redraw();
    bezierDemo.onDraggingChange = () => bernsteinGraphPlotter.redraw();

    //drawing line for current value of t on top of plot's canvas (onto new transparent canvas that is positioned above the graph plot's canvas)
    const lineForTSketch = new Sketch(bernsteinGraphContainerId, bernsteinVisSketchWidth, bernsteinVisSketchHeight, () => undefined);
    await lineForTSketch.create();
    lineForTSketch.add(p5 => new LineAtTPlotter(p5, bezierDemo, bernsteinGraphPlotter));

    //this class instance isn't actually added to the canvas or anything, however it needs to be updated every time t of bezier demo changes -> easiest solution: update on every draw() by adding to sketch
    bezierSketch.add(() => new BernsteinCurveFormulas(bezierDemo, descriptionContainer, bernsteinGraphContainer));

    document.querySelector('#cover')?.remove();
}

createDemo();