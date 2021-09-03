import './nurbs.scss';
import { Sketch } from "../ts/utils/sketch";
import { LineAtTPlotter } from "../ts/demo-material/curves/b-spline/line-at-t-plotter";
import { CurveTypeControls } from "../ts/demo-material/curves/b-spline/curve-type-controls";
import { KnotVectorControls } from "../ts/demo-material/curves/b-spline/knot-vector-controls";
import { DemoChange } from '../ts/demo-material/curves/base/demo';
import { addTextAsParagraphToElement, BooleanPropCheckbox } from "../ts/utils/dom-helpers";
import { NURBSDemo } from "../ts/demo-material/curves/nurbs/demo";
import { NURBSControlPointInfluenceBarVisualization } from "../ts/demo-material/curves/nurbs/ctrl-pt-influence-vis";
import { NURBSGraphPlotter } from "../ts/demo-material/curves/nurbs/graph-plotter";
import { ControlsForControlPointWeights } from "../ts/demo-material/curves/nurbs/ctrl-pt-weight-controls";

const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description';

addTextAsParagraphToElement(descriptionContainerId,
    `Compared to B-Splines, NURBS add yet another tool for shaping the curve: Each control point now has a weight.
    <br>Weights can be any given value >= 0. Note that a weight of 0 essentially means that the control point is "deactivated".
    <br>
    <br>Try playing around with the control point weights. Observe how the "magnetic force" of any point becomes stronger/weaker if its weight is increased/decreased.
    <br>Also have a look at the plot and notice how the basis function for each control point changes if you modify the weights.
    <br>You can compare each weighted basis function (weight != 1) with the original one (weight = 1) that is displayed with a dotted line.
    <br>
    <br>NURBS curves are evaluated/rendered with an adaptation of De Boor's Algorithm. It uses an additional, in this case, third dimension.
    <br>The curve is then projected back onto the 2D plane. Unlike in the previous demos this process cannot be visualized in a visual manner.`
);

// MathJax.typeset([`#${descriptionContainerId}`]);

//add container for b-spline basis functions visualization
const basisFuncContainer = document.createElement('div');
const basisFuncContainerId = 'b-spline-basis-function-visualization';
basisFuncContainer.id = basisFuncContainerId;
basisFuncContainer.className = 'flex-column';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', basisFuncContainer);

const demoWrapperContainer = document.getElementById('demo-wrapper')!;

async function createDemo() {
    const sketch = new Sketch(demoContainerId, p5 => Math.min(p5.windowWidth * 0.6, 800));
    await sketch.create();
    const nurbsDemo = sketch.add((p5, containerId) => new NURBSDemo(p5, containerId));
    nurbsDemo.showPointLabels = true;

    const influenceVis = sketch.add((p5) => new NURBSControlPointInfluenceBarVisualization(p5, nurbsDemo, false));
    new BooleanPropCheckbox<NURBSDemo, DemoChange>({
        objectToSubscribeTo: nurbsDemo,
        labelText: 'show control point influence bars',
        getCurrValOfPropToModify: () => influenceVis.visible,
        onUserChangedCheckboxChecked: newVal => influenceVis.visible = newVal,
        shouldCheckboxBeVisible: demo => demo.valid,
        parentContainerId: demoContainerId
    });
    new BooleanPropCheckbox<NURBSDemo, DemoChange>({
         objectToSubscribeTo: nurbsDemo,
         getCurrValOfPropToModify: () => nurbsDemo.showCurveDrawingVisualization,
         onUserChangedCheckboxChecked: newVal => nurbsDemo.showCurveDrawingVisualization = newVal,
         shouldCheckboxBeVisible: demo => demo.valid,
         labelText: 'show point on curve',
         parentContainerId: demoContainerId
    });

    //setting FPS to 0 causes sketch to instantiate p5 with noLoop() as last call in setup
    //this causes the sketch to only be redrawn when p5.redraw() is called, improving performance
    const basisFuncSketch = new Sketch(basisFuncContainerId, (p5) => {
        const width = Math.min(p5.windowWidth * 0.4 - 10 , 600);
        basisFuncContainer.style.maxWidth = `${width}px`;
        return width;
    }, undefined, undefined, 0);
    await basisFuncSketch.create();

    //the graphPlotter calls p5.redraw() whenever something relevant changes in the NURBSDemo
    //the graphPlotter gets notified by the NURBSDemo via its update() method as it has subscribed to the DemoChanges of the NURBSDemo
    const graphPlotter = basisFuncSketch.add(p5 => new NURBSGraphPlotter(p5, nurbsDemo));

    //if the hover/drag state of a control point of the NURBSDemo changes, the graph has to be redrawn (hovered functions are drawn bold)
    nurbsDemo.onHoverChange = () => graphPlotter.redraw();
    nurbsDemo.onDraggingChange = () => graphPlotter.redraw();

    //drawing line for current value of t on top of plot's canvas (onto new transparent canvas that is positioned above the plot's canvas)
    const lineForTSketch = new Sketch(basisFuncContainerId, (p5) => Math.min(p5.windowWidth * 0.4 - 10, 600), undefined, () => undefined);
    await lineForTSketch.create();
    lineForTSketch.add(p5 => new LineAtTPlotter(p5, nurbsDemo, graphPlotter));

    new KnotVectorControls(nurbsDemo, basisFuncContainerId);
    new ControlsForControlPointWeights(nurbsDemo, basisFuncContainerId);

    new CurveTypeControls(nurbsDemo, demoContainerId);

    document.querySelector('#cover')?.remove();
};

createDemo();