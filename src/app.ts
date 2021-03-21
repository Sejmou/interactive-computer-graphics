import p5 from 'p5';
import { BarycentricTriangle } from './barycentric-triangle';
import { BezierCurve } from './bezier-curve';

export interface Drawable {
    draw(): void
}

export interface Clickable {
    handleMousePressed(): void,
    handleMouseReleased(): void
}

export interface Draggable {
    handleMouseMoved(): void,
    hovering: boolean,
    dragging: boolean
}

function isClickable(object: any): object is Clickable {
    return ('handleMousePressed' in object) && (typeof object.handleMousePressed === 'function') &&
    ('handleMouseReleased' in object) && (typeof object.handleMouseReleased === 'function') ;
}

function isHoverable(object: any): object is Draggable {
    return ('handleMouseMoved' in object) && (typeof object.handleMouseMoved === 'function');
}

// Creating sketch for barycentric coordinate demo
const barycentricCoordinatesSketch = (p5Instance: p5) => {
    const bgColor = 230;
    const stuffToDraw: Drawable[] = [];
    const clickableStuff: Clickable[] = [];
    const hoverableStuff: Draggable[] = [];

    // The sketch setup method 
    p5Instance.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5Instance.createCanvas(800, 600);
        canvas.parent('barycentric-sketch');

        // Configuring the canvas
        p5Instance.background(bgColor);

        stuffToDraw.push(new BarycentricTriangle(p5Instance, [p5Instance.createVector(80, 100), p5Instance.createVector(130, 310), p5Instance.createVector(400, 140)]));

        stuffToDraw.forEach(thing => {
            if (isClickable(thing)) clickableStuff.push(thing);
        });

        stuffToDraw.forEach(thing => {
            if (isHoverable(thing)) hoverableStuff.push(thing);
        });
        
        canvas.mousePressed(() => clickableStuff.forEach(thing => thing.handleMousePressed()));
        canvas.mouseReleased(() => clickableStuff.forEach(thing => thing.handleMouseReleased()));
        canvas.mouseMoved(() => {
            let hoveringOverSomething = false;
            let draggingSomething = false;
            hoverableStuff.forEach(thing => {
                thing.handleMouseMoved();
                if (thing.hovering) hoveringOverSomething = true;
                if (thing.dragging) draggingSomething = true;
            });
            p5Instance.cursor(draggingSomething? 'grabbing' : hoveringOverSomething? 'grab' : 'default');
        });
    };

    // The sketch draw method
    p5Instance.draw = () => {
        p5Instance.background(bgColor);
        stuffToDraw.forEach(i => i.draw());
    };
};

new p5(barycentricCoordinatesSketch);


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
        canvas.parent('sketch2');

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
const bezierSketch = (p5Instance: p5) => {
    let bezierCurve: BezierCurve;

    p5Instance.setup = () => {
        const parentContainer = 'bezier-sketch';
        const canvas = p5Instance.createCanvas(600, 450);
        canvas.parent(parentContainer);

        const w = p5Instance.width * 0.65;
        const h = p5Instance.height * 0.60;
        const shift = p5Instance.width * 0.1;
        const x = (p5Instance.width / 2) - (w / 2) + (shift / 2);
        const y = (p5Instance.height / 2) - (h / 2);

        bezierCurve = new BezierCurve(p5Instance, parentContainer, w, h, shift, x, y);

        canvas.mousePressed(() => bezierCurve.handleMousePressed());
        canvas.mouseReleased(() => bezierCurve.handleMouseReleased());
        canvas.mouseMoved(() => {
            bezierCurve.handleMouseMoved();
            p5Instance.cursor(bezierCurve.dragging? 'grabbing' : bezierCurve.hovering? 'grab' : 'default');
        });
    };

    p5Instance.draw = () => {
        bezierCurve.draw();
    };
};

new p5(bezierSketch);