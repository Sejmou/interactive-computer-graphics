import './bary.scss';
import p5 from "p5";
import { BarycentricTriangle } from "../ts/barycentric-triangle";


const bgColor = 230;

const barycentricCoordinatesSketch = (p5Instance: p5) => {
    let triangle: BarycentricTriangle;

    p5Instance.setup = () => {
        const parentContainer = 'demo';

        const heading = p5Instance.select('#demo-title')!;
        heading.html('Barycentric coordinates');

        const canvas = p5Instance.createCanvas(600, 450);
        canvas.parent(parentContainer);

        p5Instance.background(bgColor);

        triangle = new BarycentricTriangle(p5Instance, [p5Instance.createVector(80, 100), p5Instance.createVector(130, 310), p5Instance.createVector(400, 140)]);

        const updateCursor = () => p5Instance.cursor(triangle.dragging ? 'grabbing' : triangle.hovering ? 'grab' : 'default');

        canvas.mousePressed(() => {
            triangle.handleMousePressed();
            updateCursor();
            return false; // prevent any browser defaults
        });
        canvas.touchStarted(() => {
            //calling this in setTimeout as p5Inst.touches is apparently not updated until after handleTouchStarted is done executing
            setTimeout(() => {
                triangle.handleTouchStarted();
            });
            return false; // prevent any browser defaults
        });
        canvas.mouseReleased(() => {
            triangle.handleMouseReleased();
            updateCursor();
        });
        canvas.touchEnded(() => {
            triangle.handleTouchReleased();
            return false; // prevent any browser defaults
        });
        canvas.mouseMoved(() => {
            updateCursor();
            return false; // prevent any browser defaults
        });

        const preventScrollIfDragging = (e: TouchEvent) => {
            if (triangle.dragging) e.preventDefault();
        };
        document.addEventListener('touchstart', preventScrollIfDragging, { passive: false });// https://stackoverflow.com/a/49582193/13727176
        document.addEventListener('touchmove', preventScrollIfDragging, { passive: false });
        document.addEventListener('touchend', preventScrollIfDragging, { passive: false });
        document.addEventListener('touchcancel', preventScrollIfDragging, { passive: false });

        //remove cover (full page loading screen)
        document.querySelector('#cover')?.remove();
    };

    p5Instance.draw = () => {
        p5Instance.background(bgColor);
        triangle.draw();
    };
};

new p5(barycentricCoordinatesSketch);