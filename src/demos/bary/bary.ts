import './bary.scss';
import p5 from "p5";
import { BarycentricTriangle } from "../ts/barycentric-triangle";
import { SketchFactory } from '../ts/sketch';



const barycentricTriangleFactoryFunction =
    (p5: p5, canvas: p5.Element, parentContainer?: string) => {
        if (parentContainer) canvas.parent(parentContainer);
        return new BarycentricTriangle(p5, [p5.createVector(80, 100), p5.createVector(130, 310), p5.createVector(400, 140)]);
    }
const baryCentricTriangleSketchFactory = new SketchFactory<BarycentricTriangle>(barycentricTriangleFactoryFunction);

baryCentricTriangleSketchFactory.createSketch('demo');