import './b-spline.scss';
import { Sketch } from "../ts/utils/interactivity/p5/sketch";
import { BSplineDemo } from '../ts/demo-material/curves/b-spline/demo';
import { BSplineGraphPlotter } from "../ts/demo-material/curves/b-spline/graph-plotter";
import { CurveTypeControls } from "../ts/demo-material/curves/b-spline/curve-type-controls";
import { KnotVectorControls } from "../ts/demo-material/curves/b-spline/knot-vector-controls";
import { DemoChange } from '../ts/demo-material/curves/base/demo';
import { addTextAsParagraphToElement } from "../ts/utils/dom";
import { BooleanPropCheckbox } from "../ts/utils/interactivity/checkbox";
import { LineAtTPlotter } from '../ts/demo-material/curves/base/line-at-t-plotter';
import { ControlPointInfluenceBarVisualization } from '../ts/demo-material/curves/base/ctrl-pt-influence-vis';

const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description-container';

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`B-Spline curves are a generalization of Bèzier curves with two very practical properties compared to Bézier curves:<br>
    Their evaluation remains efficient even for very large numbers of control points, and their control points only have "local control".`
);

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`B-Spline curves can be expressed mathematically using the formula \[ S(t) = \sum_{i=0}^{n}{N_{i,p}(t) \cdot P_{i}}. \]
where \(p\) is the degree of the curve and \( k = p + 1 \) is its order. The \(N_{i,p}(t)\) are the <em>basis functions</em> of the B-Spline curve. The \(P_{i}\) are the curve's \(n + 1\) control points, sometimes called <em>de Boor points</em>.`
);

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`Note that, contrary to Bézier curves, the degree of a B-Spline curve (and therefore also its order) is independent of the number of control points.<br>
It stays the same even if more points are added, getting rid of the problem of exponentially increasing computational effort with each added control point.`
);

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`For B-Spline curves, a new concept is introduced: a knot vector \(T = \{t_0, t_1, ..., t_m\}\) containing \(m + 1\) values (where \( m = n + k \)) in non-decreasing order, called knots.<br>
If we have a "valid" knot vector, this allows us to define the basis functions \(N_{i,p}\) of degree \(p\) of the B-Spline curve that are computed using a recursive formula:
\[N_{i,j}(t) = \frac{ t - t_{i} } { t_{i + j} - t_i } \cdot N_{i, j - 1}(t) + \frac{ t_{i + j + 1} - t } { t_{i + j + 1} - t_{i + 1} } \cdot N_{i + 1, j - 1}(t),\]
With the "base case" being:
\[N_{i,0} = \begin{cases} 1 & \text{if } t_{i} \leq x < t_{i + 1} \\ 0 & \text{otherwise.} \end{cases} \]`
);

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`The knots of the knot vector determine at what value of \(t\) a basis function starts to gain influence on the position of the point on the curve while another one looses influence.<br>
They split the space for parameter \(t\) into segments. In each so-called <em>span</em> \([t_i,t_{i+1})\) defined by two adjacent knots \(t_i\) and \(t_{i+1}\), at most \(p+1\) degree \(p\) basis functions are non-zero.<br>
For a given \(t\), each \(N_{i,p}(t)\) is only \(> 0\) in a certain interval and \(0\) outside of it. Those properties combined give us the desired local (instead of global) influence of control points.<br>
We can think of B-Splines as piecewise polynomial functions (or, more specific, Bézier curves) of degree \( p \) that meet at the knots of the knot vector.<br>
Side-note: there is no upper limit for the largest knot value which means that the domain where a B-Spline is defined is no longer necessarily \([0, 1]\).<br>`
);

addTextAsParagraphToElement(descriptionContainerId,
    String.raw`B-Spline curves are only defined in the interval for \(t\) where the condition \(\sum_{i=0}^{n}{N_{i,p}(t)} = 1\) is satisfied. We differentiate between open and clamped B-Spline curves.<br>
Compared to open B-Spline curves, clamped B-Spline curves put additional restrictions on the knot vector: Its first \(k\) values must be the same. The same restriction also applies to its last \(k\) values.<br>
A consequence of this restriction is that clamped B-Spline curves are defined in the interval \([t_0, t_m)\), while for open B-Spline curves we can only guarantee that they are defined in the interval \([t_p, t_{m-p})\).`
);

MathJax.typeset([`#${descriptionContainerId}`]);

//add container for b-spline basis functions visualization
const basisFuncContainer = document.createElement('div');
const basisFuncContainerId = 'b-spline-basis-function-visualization';
basisFuncContainer.id = basisFuncContainerId;
basisFuncContainer.className = 'flex-column';
document.getElementById(demoContainerId)!.insertAdjacentElement('afterend', basisFuncContainer);

const demoWrapperContainer = document.getElementById('demo-wrapper')!;

async function createDemo() {
    const sketch = new Sketch(demoContainerId, p5 => Math.min(p5.windowWidth * 0.6, 700));
    await sketch.create();
    const bSplineDemo = sketch.add((p5, containerId) => new BSplineDemo(p5, containerId));
    bSplineDemo.showPointLabels = true;

    const influenceBarVis = sketch.add((p5) => new ControlPointInfluenceBarVisualization(p5, bSplineDemo, false));

    new BooleanPropCheckbox<BSplineDemo, DemoChange>({
        objectToSubscribeTo: bSplineDemo,
        labelText: 'show control point influence bars',
        getCurrValOfPropToModify: () => influenceBarVis.visible,
        onUserChangedCheckboxChecked: newVal => influenceBarVis.visible = newVal,
        shouldCheckboxBeVisible: demo => demo.valid,
        parentContainerId: demoContainerId
    });
    new BooleanPropCheckbox<BSplineDemo, DemoChange>({
         objectToSubscribeTo: bSplineDemo,
         getCurrValOfPropToModify: () => bSplineDemo.showCurveDrawingVisualization,
         onUserChangedCheckboxChecked: newVal => bSplineDemo.showCurveDrawingVisualization = newVal,
         shouldCheckboxBeVisible: demo => demo.valid,
         labelText: 'show curve evaluation visualization',
         parentContainerId: demoContainerId
    });
    new BooleanPropCheckbox<BSplineDemo, DemoChange>({
        objectToSubscribeTo: bSplineDemo,
        labelText: 'Show influence of hovered/dragged control point via line width',
        tooltipText: 'The thicker the line, the more influence the control point has. If influence is 0, the line is also not drawn.',
        getCurrValOfPropToModify: () => bSplineDemo.showInfluenceVisForCurrentlyActiveCtrlPt,
        onUserChangedCheckboxChecked: newVal => bSplineDemo.showInfluenceVisForCurrentlyActiveCtrlPt = newVal,
        shouldCheckboxBeVisible: demo => demo.valid,
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

    //the graphPlotter calls p5.redraw() whenever something relevant changes in the bSplineDemo
    //the graphPlotter gets notified by the bSplineDemo via its update() method as it has subscribed to the DemoChanges of the bSplineDemo
    const graphPlotter = basisFuncSketch.add(p5 => new BSplineGraphPlotter(p5, bSplineDemo));

    //if the hover/drag state of a control point of the BSplineDemo changes, the graph has to be redrawn (hovered functions are drawn bold)
    bSplineDemo.onHoverChange = () => graphPlotter.redraw();
    bSplineDemo.onDraggingChange = () => graphPlotter.redraw();

    //drawing line for current value of t on top of plot's canvas (onto new transparent canvas that is positioned above the plot's canvas)
    const lineForTSketch = new Sketch(basisFuncContainerId, (p5) => Math.min(p5.windowWidth * 0.4 - 10, 600), undefined, () => undefined);
    await lineForTSketch.create();
    lineForTSketch.add(p5 => new LineAtTPlotter(p5, bSplineDemo, graphPlotter));

    new KnotVectorControls(bSplineDemo, basisFuncContainerId);

    new CurveTypeControls(bSplineDemo, demoContainerId);

    document.querySelector('#cover')?.remove();
};

createDemo();