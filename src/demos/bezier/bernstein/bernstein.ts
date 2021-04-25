import './bernstein.scss';
import p5 from "p5";
import { BezierDemo } from "../../ts/bezier-curve";
import { SketchFactory } from '../../ts/sketch';


const bezierFactoryFunction = (p5: p5, canvas: p5.Element, parentContainer?: string) => new BezierDemo(p5, canvas, parentContainer);
const bezierSketchFactory: SketchFactory<BezierDemo> = new SketchFactory(bezierFactoryFunction);

const onBezierDemoSketchCreated = (bezierDemo: BezierDemo) => {
    //just demonstrating that we can access the created demo instance
    setInterval(() => console.log(bezierDemo.controlVertices.length), 1000);
}

bezierSketchFactory.createSketch('demo', onBezierDemoSketchCreated);