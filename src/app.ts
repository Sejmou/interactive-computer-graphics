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

const bgColor = 230;

// Creating sketch for barycentric coordinate demo
const barycentricCoordinatesSketch = (p5Instance: p5) => {
    const stuffToDraw: Drawable[] = [];
    const clickableStuff: Clickable[] = [];
    const hoverableStuff: Draggable[] = [];

    // The sketch setup method 
    p5Instance.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5Instance.createCanvas(600, 450);
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
        p5Instance.background(bgColor);
        bezierCurve.draw();
    };
};

new p5(bezierSketch);