import './bary.scss';
import { BarycentricTriangle } from "../ts/barycentric-triangle";
import { Sketch } from '../ts/sketch';

const demoContainerId = 'demo';

async function createSketch() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    sketch.add((p5) => new BarycentricTriangle(p5, [p5.createVector(80, 100), p5.createVector(130, 310), p5.createVector(400, 140)]));
    document.querySelector('#cover')?.remove();
};

createSketch();