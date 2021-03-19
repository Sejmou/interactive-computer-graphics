import p5 from 'p5';
import { BarycentricTriangle } from './barycentric-triangle';
import { BezierCurve } from './bezier-curve';

export interface Drawable {
    draw(): void
}

export interface Clickable {
    checkClicked(x: number, y: number): void
}

export interface CanvasEventHandlers {
    mousePressed: Function[],
    mouseReleased: Function[],
    mouseMoved: Function[]
}

// Creating sketch for barycentric coordinate demo
// const sketch1 = (p5: p5) => {
//     const bgColor = 230;
//     const stuffToDraw: Drawable[] = [];

//     //using array of event handler functions to be able to have multiple event handlers
//     //we can't use addEventListener on the p5 canvas (p5.Renderer)
//     const canvasEventHandlers: CanvasEventHandlers = {
//         mousePressed: [],
//         mouseMoved: [],
//         mouseReleased: []
//     };

//     // The sketch setup method 
//     p5.setup = () => {
//         // Creating and positioning the canvas
//         const canvas = p5.createCanvas(800, 600);
//         canvas.parent("sketch1");

//         canvas.mousePressed(() => canvasEventHandlers.mousePressed.forEach(handler => handler()));
//         canvas.mouseReleased(() => canvasEventHandlers.mouseReleased.forEach(handler => handler()));
//         canvas.mouseMoved(() => canvasEventHandlers.mouseMoved.forEach(handler => handler()));

//         // Configuring the canvas
//         p5.background(bgColor);

//         stuffToDraw.push(new BarycentricTriangle(p5, canvasEventHandlers, [p5.createVector(80, 100), p5.createVector(130, 310), p5.createVector(400, 140)]));

//     };

//     // The sketch draw method
//     p5.draw = () => {
//         p5.background(bgColor);
//         stuffToDraw.forEach(i => i.draw());
//     };
// };

// new p5(sketch1);


//Creating sketch for bezier curve demo
const sketch2 = (p5Instance: p5) => {
    let vertexAnchor: p5.Vector;
    let bezierControlPoint1: p5.Vector;
    let bezierControlPoint2: p5.Vector;
    let bezierAnchor: p5.Vector;

    let lineSize: number;
    let dotSize: number;

    // The sketch setup method 
    p5Instance.setup = () => {
        const canvas = p5Instance.createCanvas(600, 450);
        canvas.parent("sketch2");

        const w = p5Instance.width * 0.65;
        const h = p5Instance.height * 0.60;
        const shift = p5Instance.width * 0.1;
        const x = (p5Instance.width / 2) - (w / 2) + (shift / 2);
        const y = (p5Instance.height / 2) - (h / 2);

        lineSize = p5Instance.width * 0.005;
        dotSize = p5Instance.width * 0.015;

        vertexAnchor = p5Instance.createVector(x, y + h);
        bezierAnchor = p5Instance.createVector(x + w, y + h);
        bezierControlPoint1 = p5Instance.createVector(x - shift, y);
        bezierControlPoint2 = p5Instance.createVector(x + w - shift, y);

    };

    // The sketch draw method
    p5Instance.draw = () => {
        p5Instance.background(240);

        const percent = p5Instance.frameCount % 100 / 100;

        // draw bezier line
        p5Instance.strokeWeight(lineSize);
        p5Instance.stroke(30);
        p5Instance.noFill();
        p5Instance.beginShape();
        p5Instance.vertex(vertexAnchor.x, vertexAnchor.y);
        p5Instance.bezierVertex(bezierControlPoint1.x, bezierControlPoint1.y, bezierControlPoint2.x, bezierControlPoint2.y, bezierAnchor.x, bezierAnchor.y);
        p5Instance.endShape();

        // draw dots in between
        const pointBetween1 = drawDotBetween(vertexAnchor, bezierControlPoint1, percent, '#E1B000', dotSize);
        const pointBetween2 = drawDotBetween(bezierControlPoint1, bezierControlPoint2, percent, '#E1B000', dotSize);
        const pointBetween3 = drawDotBetween(bezierControlPoint2, bezierAnchor, percent, '#E1B000', dotSize);
        const pointBetween4 = drawDotBetween(pointBetween1, pointBetween2, percent, '#E1B000', dotSize);
        const pointBetween5 = drawDotBetween(pointBetween2, pointBetween3, percent, '#E1B000', dotSize);
        const pointBetween6 = drawDotBetween(pointBetween4, pointBetween5, percent, '#c64821', dotSize * 1.5);

        // draw anchor points
        p5Instance.noStroke();
        p5Instance.fill('#E1B000');
        p5Instance.ellipse(vertexAnchor.x, vertexAnchor.y, dotSize, dotSize);
        p5Instance.ellipse(bezierAnchor.x, bezierAnchor.y, dotSize, dotSize);

        // draw control points
        p5Instance.noStroke();
        p5Instance.fill('#E1B000');
        p5Instance.ellipse(bezierControlPoint1.x, bezierControlPoint1.y, dotSize, dotSize);
        p5Instance.ellipse(bezierControlPoint2.x, bezierControlPoint2.y, dotSize, dotSize);
    };

    function drawDotBetween(start: p5.Vector, stop: p5.Vector, percent: number, col: string, s: number) {
        const pointBetween = p5.Vector.lerp(start, stop, percent) as unknown as p5.Vector;
    
        // draw line
        p5Instance.stroke('#FFDAA2');
        p5Instance.strokeWeight(lineSize / 2);
        p5Instance.line(start.x, start.y, stop.x, stop.y);
    
        // draw dot
        p5Instance.noStroke();
        p5Instance.fill(col);
        p5Instance.ellipse(pointBetween.x, pointBetween.y, s, s);
    
        return pointBetween;
    }
};

new p5(sketch2);




//Creating sketch for bezier curve demo (using BezierCurve instance)
const sketch3 = (p5Instance: p5) => {
    const stuffToDraw: Drawable[] = [];

    p5Instance.setup = () => {
        const canvas = p5Instance.createCanvas(600, 450);
        canvas.parent("sketch3");

        const w = p5Instance.width * 0.65;
        const h = p5Instance.height * 0.60;
        const shift = p5Instance.width * 0.1;
        const x = (p5Instance.width / 2) - (w / 2) + (shift / 2);
        const y = (p5Instance.height / 2) - (h / 2);

        stuffToDraw.push(new BezierCurve(p5Instance, w, h, shift, x, y));
    };

    p5Instance.draw = () => {
        stuffToDraw.forEach(thing => thing.draw());
    };
};

new p5(sketch3);