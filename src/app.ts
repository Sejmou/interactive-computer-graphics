import p5 from 'p5';
import { BarycentricTriangle } from './barycentric-triangle';
import { BezierCurve } from './bezier-curve';

const bgColor = 230;

// Creating sketch for barycentric coordinate demo
const barycentricCoordinatesSketch = (p5Instance: p5) => {
    let triangle: BarycentricTriangle;

    // The sketch setup method 
    p5Instance.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5Instance.createCanvas(600, 450);
        canvas.parent('barycentric-sketch');

        // Configuring the canvas
        p5Instance.background(bgColor);

        triangle = new BarycentricTriangle(p5Instance, [p5Instance.createVector(80, 100), p5Instance.createVector(130, 310), p5Instance.createVector(400, 140)]);

        const updateCursor = () => p5Instance.cursor(triangle.dragging ? 'grabbing' : triangle.hovering ? 'grab' : 'default');

        canvas.mousePressed(() => {
            triangle.handleMousePressed();
            updateCursor();
            return false; // prevent any browser defaults
        });
        canvas.touchStarted(() => {
            triangle.handleTouchStarted();
            return false; // prevent any browser defaults
        });
        canvas.mouseReleased(() => {
            triangle.handleReleased();
            updateCursor();
        });
        canvas.touchEnded(() => {
            triangle.handleReleased();
            return false; // prevent any browser defaults
        });
        canvas.mouseMoved(() => {
            updateCursor();
            return false; // prevent any browser defaults
        });

        document.querySelector('#cover')?.remove();
    };

    // The sketch draw method
    p5Instance.draw = () => {
        p5Instance.background(bgColor);
        triangle.draw();
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

        const updateCursor = () => p5Instance.cursor(bezierCurve.dragging ? 'grabbing' : bezierCurve.hovering ? 'grab' : 'default');

        canvas.mousePressed(() => {
            bezierCurve.handleMousePressed();
            updateCursor();
            return false; // prevent any browser defaults
        });
        canvas.touchStarted(() => {
            bezierCurve.handleTouchStarted();
            return false; // prevent any browser defaults
        });
        canvas.mouseReleased(() => {
            bezierCurve.handleReleased();
            updateCursor();
        });
        canvas.touchEnded(() => {
            bezierCurve.handleReleased();
            return false; // prevent any browser defaults
        });
        canvas.mouseMoved(() => {
            updateCursor();
            return false;
        });

        document.querySelector('#cover')?.remove();
    };

    p5Instance.draw = () => {
        p5Instance.background(bgColor);
        bezierCurve.draw();
    };
};

new p5(bezierSketch);