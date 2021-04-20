import './bezier.scss';
import p5 from "p5";
import { BezierCurveDemo } from "../ts/bezier-curve";


const bgColor = 230;

const bezierSketch = (p5Instance: p5) => {
    let bezierCurve: BezierCurveDemo;

    p5Instance.setup = () => {
        const parentContainer = 'sketch';

        const heading = p5Instance.createElement('h4', 'Bézier curve');
        heading.parent(parentContainer);

        const divAboveCanvas = p5Instance.createDiv();
        divAboveCanvas.parent(parentContainer);

        const canvas = p5Instance.createCanvas(600, 450);
        canvas.parent(parentContainer);

        const w = p5Instance.width * 0.65;
        const h = p5Instance.height * 0.60;
        const shift = p5Instance.width * 0.1;
        const x = (p5Instance.width / 2) - (w / 2) + (shift / 2);
        const y = (p5Instance.height / 2) - (h / 2);

        bezierCurve = new BezierCurveDemo(p5Instance, parentContainer, divAboveCanvas);

        const updateCursor = () => p5Instance.cursor(bezierCurve.dragging ? 'grabbing' : bezierCurve.hovering ? 'grab' : 'default');

        canvas.mousePressed(() => {
            bezierCurve.handleMousePressed();
            updateCursor();
            return false; // prevent any browser defaults
        });
        canvas.touchStarted(() => {
            //calling this in setTimeout as p5Inst.touches is apparently not updated until after handleTouchStarted is done executing
            setTimeout(() => {
                bezierCurve.handleTouchStarted();
                if (!bezierCurve.dragging) canvas.style('touch-action', 'auto');
                else canvas.style('touch-action', 'none');
            });
            return false; // prevent any browser defaults
        });
        canvas.mouseReleased(() => {
            bezierCurve.handleMouseReleased();
            updateCursor();
        });
        canvas.touchEnded(() => {
            bezierCurve.handleTouchReleased();
            if (!bezierCurve.dragging) canvas.style('touch-action', 'auto');
            else canvas.style('touch-action', 'none');
            return false; // prevent any browser defaults
        });
        canvas.mouseMoved(() => {
            updateCursor();
            return false;
        });

        const preventScrollIfDragging = (e: TouchEvent) => {
            if (bezierCurve.dragging) e.preventDefault();
        };
        document.addEventListener('touchstart', preventScrollIfDragging, { passive: false });// https://stackoverflow.com/a/49582193/13727176
        document.addEventListener('touchmove', preventScrollIfDragging, { passive: false });
        document.addEventListener('touchend', preventScrollIfDragging, { passive: false });
        document.addEventListener('touchcancel', preventScrollIfDragging, { passive: false });

        document.querySelector('#cover')?.remove();
    };

    p5Instance.draw = () => {
        p5Instance.background(bgColor);
        bezierCurve.draw();
    };
};

new p5(bezierSketch);