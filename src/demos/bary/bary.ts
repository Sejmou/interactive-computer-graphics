import './bary.scss';
import { BarycentricTriangle } from "../ts/demo-material/barycentric-triangle";
import { Sketch } from '../ts/utils/interactivity/p5/sketch';
import { addTextAsParagraphToElement } from '../ts/utils/dom';

const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description-container';

addTextAsParagraphToElement(descriptionContainerId, 
    `Move the point on this triangle around and notice how the coefficients of the three points in the equation below change.
    Those coefficients are the <em>barycentric coordinates</em> of the triangle. `
);

addTextAsParagraphToElement(descriptionContainerId, 
    `You can see in this example that we can use barycentric coordinates to mix the colors of the three triangle vertices.
    <br>The closer you move the point on the triangle to one of the vertices, the higher the coefficient of that vertex and the more of its color the point gets.`
);

addTextAsParagraphToElement(descriptionContainerId, 
    `An important property of barycentric coordinates is that their sum is always 1.
    <br>While every coordinate is bigger than or equal to 0 and smaller than or equal to 1, we know that we are somewhere on the triangle surface.`
);

addTextAsParagraphToElement(descriptionContainerId,
    `With barycentric coordinates we can not only mix or, in math terms, <em>interpolate</em> colors of three triangle vertices. We could store arbitrary numerical data in the vertices and interpolate it.`
);

async function createSketch() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    sketch.add((p5) => new BarycentricTriangle(p5, [p5.createVector(80, 100), p5.createVector(130, 310), p5.createVector(400, 140)]));
    document.querySelector('#cover')?.remove();
};

createSketch();