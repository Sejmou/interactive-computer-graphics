import './bernstein.scss';
import p5 from "p5";
import { BezierDemo } from "../../ts/demo-material/curves/bezier/demo";
import { Sketch } from '../../ts/utils/sketch';
import { addTextAsParagraphToElement } from "../../ts/utils/dom-helpers";
import { BernsteinPolynomialVisualization } from '../../ts/demo-material/curves/bezier/bernstein-influence-vis';
import { BernsteinCurveFormulas } from '../../ts/demo-material/curves/bezier/bernstein-curve-formulas';
import { ControlPointInfluenceVisualization } from '../../ts/demo-material/curves/bezier/ctrl-pt-influence-vis';


const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description';

export const descriptionParagraph = addTextAsParagraphToElement(descriptionContainerId,
    String.raw`In math terms, a Bézier curve of degree \(n\) is expressed as \[ C(t) = \sum_{i=0}^{n}{b_{i,n}(t) \cdot P_{i}}. \]
Each \( b_{i,n}(t) \) is the <b>Bernstein polynomial</b> of \(P_i\), a particular control point of the Bézier curve. \( P_i \) is a 2D vector \( (x, y)\).<br>The Bernstein polynomial represents the 'influence' of the control point on the shape of the Bézier curve for the current value of \(t\).`
    );

MathJax.typeset([`#${descriptionContainerId}`]);

//add container for bernstein polynomial visualization
const bernsteinGraphContainer = document.createElement('div');
const bernsteinGraphContainerId = 'bernstein-visualization';
bernsteinGraphContainer.id = bernsteinGraphContainerId;
bernsteinGraphContainer.className = 'flex-column center-cross-axis';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', bernsteinGraphContainer);


async function createDemo() {
    //override default sketch width for bezier sketch
    const bezierSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.6, 800);
    //setting frame rate to 30 as steady 60 fps are not possible somehow (too many calculations?)
    const bezierSketch = new Sketch(demoContainerId, bezierSketchWidth, undefined, undefined, 30);
    await bezierSketch.create();
    //bezierDemo animation has to be twice as fast as we use only half the FPS
    const bezierDemo = bezierSketch.add((p5, containerId) => new BezierDemo(p5, containerId, 2));
    bezierDemo.showPointLabels = true;
    bezierDemo.showPointPositions = true;

    const bernsteinVisSketchWidth = (p5: p5) => Math.min(p5.windowWidth * 0.35, 400);
    const bernsteinVisSketchHeight = bernsteinVisSketchWidth;
    const bernsteinVisSketch = new Sketch(bernsteinGraphContainerId, bernsteinVisSketchWidth, bernsteinVisSketchHeight, () => undefined, 30);
    await bernsteinVisSketch.create();
    const bernsteinVis = bernsteinVisSketch.add((p5) => new BernsteinPolynomialVisualization(p5, bezierDemo));

    //this isn't actually added to the canvas or anything, however it needs to be updated every time t of bezier demo changes -> easiest solution: update on every draw() by adding to sketch
    bernsteinVisSketch.add(() => new BernsteinCurveFormulas(bernsteinVis, bernsteinGraphContainerId));

    bezierSketch.add((p5) => new ControlPointInfluenceVisualization(p5, bernsteinVis));

    document.querySelector('#cover')?.remove();
}

createDemo();