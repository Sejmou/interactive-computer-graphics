import './b-spline.scss';
import { Sketch } from "../ts/sketch";
import { BSplineDemo } from '../ts/curves/b-spline-curve';

const demoContainerId = 'demo';

const descriptionId = 'demo-description'
const descriptionParagraph = document.getElementById(descriptionId);
if (descriptionParagraph) descriptionParagraph.innerText = `B-spline curves are a generalization of Bèzier curves with a very nice property: Contrary to Bézier curves, their control points only have local control instead of global control.`;


async function createDemo() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    sketch.add((p5, containerId) => new BSplineDemo(p5, containerId));
    document.querySelector('#cover')?.remove();
};

createDemo();