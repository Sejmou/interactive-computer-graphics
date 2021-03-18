import P5 from 'p5';
import { BarycentricTriangle } from './barycentric-triangle';

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

// Creating the sketch itself
const sketch1 = (p5: P5) => {
    const bgColor = 230;
    const stuffToDraw: Drawable[] = [];

    //using array of event handler functions to be able to have multiple event handlers
    //we can't use addEventListener on the p5 canvas (p5.Renderer)
    const canvasEventHandlers: CanvasEventHandlers = {
        mousePressed: [],
        mouseMoved: [],
        mouseReleased: []
    };

    // The sketch setup method 
    p5.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5.createCanvas(800, 600);
        canvas.parent("sketch1");

        canvas.mousePressed(() => canvasEventHandlers.mousePressed.forEach(handler => handler()));
        canvas.mouseReleased(() => canvasEventHandlers.mouseReleased.forEach(handler => handler()));
        canvas.mouseMoved(() => canvasEventHandlers.mouseMoved.forEach(handler => handler()));

        // Configuring the canvas
        p5.background(bgColor);

        stuffToDraw.push(new BarycentricTriangle(p5, canvasEventHandlers, [p5.createVector(80, 100), p5.createVector(130, 310), p5.createVector(400, 140)]));

    };

    // The sketch draw method
    p5.draw = () => {
        p5.background(bgColor);
        stuffToDraw.forEach(i => i.draw());
    };
};

new P5(sketch1);


// Creating the sketch itself
const sketch2 = (p5: P5) => {
    let vertexAnchor: P5.Vector;
    let bezierControlPoint1: P5.Vector;
    let bezierControlPoint2: P5.Vector;
    let bezierAnchor: P5.Vector;

    let lineSize: number;
    let dotSize: number;

    // The sketch setup method 
    p5.setup = () => {
        const canvas = p5.createCanvas(600, 450);
        canvas.parent("sketch2");
        p5.frameRate(36);

        const w = p5.width * 0.65;
        const h = p5.height * 0.60;
        const shift = p5.width * 0.1;
        const x = (p5.width / 2) - (w / 2) + (shift / 2);
        const y = (p5.height / 2) - (h / 2);

        lineSize = p5.width * 0.005;
        dotSize = p5.width * 0.015;

        vertexAnchor = p5.createVector(x, y + h);
        bezierAnchor = p5.createVector(x + w, y + h);
        bezierControlPoint1 = p5.createVector(x - shift, y);
        bezierControlPoint2 = p5.createVector(x + w - shift, y);

    };

    // The sketch draw method
    p5.draw = () => {
        p5.background(240);

        const percent = p5.frameCount % 100 / 100;

        // draw bezier line
        p5.strokeWeight(lineSize);
        p5.stroke(30);
        p5.noFill();
        p5.beginShape();
        p5.vertex(vertexAnchor.x, vertexAnchor.y);
        p5.bezierVertex(bezierControlPoint1.x, bezierControlPoint1.y, bezierControlPoint2.x, bezierControlPoint2.y, bezierAnchor.x, bezierAnchor.y);
        p5.endShape();

        // draw dots in between
        const pointBetween1 = drawDotBetween(vertexAnchor, bezierControlPoint1, percent, '#E1B000', dotSize);
        const pointBetween2 = drawDotBetween(bezierControlPoint1, bezierControlPoint2, percent, '#E1B000', dotSize);
        const pointBetween3 = drawDotBetween(bezierControlPoint2, bezierAnchor, percent, '#E1B000', dotSize);
        const pointBetween4 = drawDotBetween(pointBetween1, pointBetween2, percent, '#E1B000', dotSize);
        const pointBetween5 = drawDotBetween(pointBetween2, pointBetween3, percent, '#E1B000', dotSize);
        const pointBetween6 = drawDotBetween(pointBetween4, pointBetween5, percent, '#c64821', dotSize * 1.5);

        // draw anchor points
        p5.noStroke();
        p5.fill('#E1B000');
        p5.ellipse(vertexAnchor.x, vertexAnchor.y, dotSize, dotSize);
        p5.ellipse(bezierAnchor.x, bezierAnchor.y, dotSize, dotSize);

        // draw control points
        p5.noStroke();
        p5.fill('#E1B000');
        p5.ellipse(bezierControlPoint1.x, bezierControlPoint1.y, dotSize, dotSize);
        p5.ellipse(bezierControlPoint2.x, bezierControlPoint2.y, dotSize, dotSize);
    };

    function drawDotBetween(start: P5.Vector, stop: P5.Vector, percent: number, col: string, s: number) {
        const pointBetween = P5.Vector.lerp(start, stop, percent) as unknown as P5.Vector;
    
        // draw line
        p5.stroke('#FFDAA2');
        p5.strokeWeight(lineSize / 2);
        p5.line(start.x, start.y, stop.x, stop.y);
    
        // draw dot
        p5.noStroke();
        p5.fill(col);
        p5.ellipse(pointBetween.x, pointBetween.y, s, s);
    
        return pointBetween;
    }
};

new P5(sketch2);