import './b-spline.scss';
import { Sketch } from "../ts/sketch";

const demoContainerId = 'demo';

const descriptionId = 'demo-description'
const descriptionParagraph = document.getElementById(descriptionId);
if (descriptionParagraph) descriptionParagraph.innerText = `B-spline curves are a generalization of Bèzier curves with a very nice property: Contrary to Bézier curves, their control points only have local control instead of global control.`;


async function createDemo() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    document.querySelector('#cover')?.remove();
};

createDemo();

// m = (# of knots in knotVector T) - 1
// n = (# of control points) - 1
// k = degree of curve
// m = k + n + 1
// e. g. for a cubic B-spline w/ 5 control points m = 3 + 4 + 1

//const knotVector = [0, 1, 2, 3, 4, 5, 6, 7, 8]

//const basisFunctions = knotVector.forEach
//N_{0,0} = 1 if t_0 <= t < t_1, else 0
