import './bernstein.scss';
import p5 from "p5";
import { BernsteinPolynomialVisualization, BezierDemo } from "../../ts/bezier-curve";
import { SketchFactory, bezierSketchFactory } from '../../ts/sketch';



const onBezierDemoSketchCreated = (bezierDemo: BezierDemo) => {
    const bernSteinVisFactoryFunction = (p5Instance: p5, canvas: p5.Element, parentContainer?: string) => {
        if (parentContainer) canvas.parent(parentContainer);
        return new BernsteinPolynomialVisualization(p5Instance, bezierDemo);
    }
    new SketchFactory<BernsteinPolynomialVisualization>(bernSteinVisFactoryFunction).createSketch('demo');
}

bezierSketchFactory.createSketch('demo', onBezierDemoSketchCreated);