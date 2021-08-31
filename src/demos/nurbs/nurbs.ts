import './nurbs.scss';
import { Sketch } from "../ts/utils/sketch";
import { CurveTypeControls, DeBoorControlPointInfluenceVisualization, KnotVectorControls, LineAtTPlotter } from '../ts/demo-material/curves/b-spline-curve';
import { DemoChange } from '../ts/demo-material/curves/base-curve';
import { addTextAsParagraphToElement, BooleanPropCheckbox } from "../ts/utils/dom-helpers";
import { ControlsForControlPointWeights, NURBSDemo, NURBSGraphPlotter } from "../ts/demo-material/curves/nurbs-curve";

const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description';

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`Compared to B-Splines, NURBS add yet another tool for shaping the curve: Each control point now has a weight. Weights can be any given value.<br>
    Theoretically, even negative weights were possible, but this would result in weird behavior. Note that a weight of 0 essentially means that the control point is "deactivated".
    <br>Note: Unfortunately, I couldn't spend as much time on this demo as I wanted, thus there is <b style="color: red">a higher chance for errors.</b> However, the "core ideas" should be implemented correctly.`
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

    const influenceVis = sketch.add((p5) => new DeBoorControlPointInfluenceVisualization(p5, nurbsDemo, false));
    new BooleanPropCheckbox<DeBoorControlPointInfluenceVisualization, NURBSDemo, DemoChange>({
        objectToModify: influenceVis,
        objectToSubscribeTo: nurbsDemo,
        labelText: 'show control point influence bars',
        getCurrValOfPropToModify: influenceVis => influenceVis.visible,
        setNewPropertyValue: (val, visualization) => visualization.visible = val,
        showCheckBoxIf: demo => demo.valid,
        parentContainerId: demoContainerId
    });
    new BooleanPropCheckbox<NURBSDemo, NURBSDemo, DemoChange>({
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