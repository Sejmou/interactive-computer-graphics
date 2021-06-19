import './nurbs.scss';
import { Sketch } from "../ts/sketch";
import { BSplineDemo, BSplineGraphPlotter, CurveTypeControls, DeBoorControlPointInfluenceVisualization, KnotVectorControls, LineAtTPlotter } from '../ts/curves/b-spline-curve';
import { DemoChange } from '../ts/curves/base-curve';
import { addParagraphWithGivenContentToHtmlElementWithId, BooleanPropCheckbox } from '../ts/util';
import { ControlsForControlPointWeights, NURBSDemo } from "../ts/curves/nurbs-curve";

const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description';

addParagraphWithGivenContentToHtmlElementWithId(descriptionContainerId,
    String.raw`Compared to B-Splines, NURBS add yet another tool for shaping the curve: Each control point now has a weight.`
);

// MathJax.typeset([`#${descriptionContainerId}`]);

//add container for b-spline basis functions visualization
const basisFuncContainer = document.createElement('div');
const basisFuncContainerId = 'b-spline-basis-function-visualization';
basisFuncContainer.id = basisFuncContainerId;
basisFuncContainer.className = 'flex-col center-cross-axis';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', basisFuncContainer);

async function createDemo() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    const nurbsDemo = sketch.add((p5, containerId) => new NURBSDemo(p5, containerId));
    nurbsDemo.showPointLabels = true;

    const influenceVis = sketch.add((p5) => new DeBoorControlPointInfluenceVisualization(p5, nurbsDemo, false));
    new BooleanPropCheckbox<DeBoorControlPointInfluenceVisualization, BSplineDemo, DemoChange>({
        objectToModify: influenceVis,
        objectToSubscribeTo: nurbsDemo,
        labelText: 'show control point influence bars',
        getCurrValOfPropToModify: influenceVis => influenceVis.visible,
        setNewPropertyValue: (val, visualization) => visualization.visible = val,
        showCheckBoxIf: demo => demo.valid,
        parentContainerId: demoContainerId
    });
    new BooleanPropCheckbox<BSplineDemo, BSplineDemo, DemoChange>({
         objectToModify: nurbsDemo,
         objectToSubscribeTo: nurbsDemo,
         getCurrValOfPropToModify: demo => demo.showCurveDrawingVisualization,
         setNewPropertyValue: (val, demo) => demo.showCurveDrawingVisualization = val,
         showCheckBoxIf: demo => demo.valid,
         labelText: 'show curve evaluation visualization',
         parentContainerId: demoContainerId
    }); 

    //setting FPS to 0 causes sketch to instantiate p5 with noLoop() as last call in setup
    //this causes the sketch to only be redrawn when p5.redraw() is called, improving performance
    const basisFuncSketch = new Sketch(basisFuncContainerId, undefined, undefined, undefined, 0);
    await basisFuncSketch.create();

    //the graphPlotter calls p5.redraw() whenever something relevant changes in the bSplineDemo
    //the graphPlotter gets notified by the bSplineDemo via its update() method as it has subscribed to the DemoChanges of the bSplineDemo
    const graphPlotter = basisFuncSketch.add(p5 => new BSplineGraphPlotter(p5, nurbsDemo));

    //if the hover/drag state of a control point of the BSplineDemo changes, the graph has to be redrawn (hovered functions are drawn bold)
    nurbsDemo.onHoverChange = () => graphPlotter.redraw();
    nurbsDemo.onDraggingChange = () => graphPlotter.redraw();

    //drawing line for current value of t on top of plot's canvas (onto new transparent canvas that is positioned above the plot's canvas)
    const lineForTSketch = new Sketch(basisFuncContainerId, undefined, undefined, () => undefined);
    await lineForTSketch.create();
    lineForTSketch.add(p5 => new LineAtTPlotter(p5, nurbsDemo, graphPlotter));

    new KnotVectorControls(nurbsDemo, basisFuncContainerId);
    new ControlsForControlPointWeights(nurbsDemo, basisFuncContainerId);

    new CurveTypeControls(nurbsDemo, demoContainerId);

    document.querySelector('#cover')?.remove();
};

createDemo();