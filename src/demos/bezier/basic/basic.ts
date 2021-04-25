import './basic.scss';
import p5 from "p5";
import { BezierDemo } from "../../ts/bezier-curve";



const bezierSketchConfig = (p5Instance: p5) => {
    const bgColor = p5Instance.color(230);

    let bezierDemo: BezierDemo;

    function calcCanvasX() {
        return Math.min(p5Instance.windowWidth, 800);
    }

    function calcCanvasY() {
        return p5Instance.windowHeight * 0.6;
    }

    p5Instance.setup = () => {
        const parentContainer = 'demo';

        const divAboveCanvas = p5Instance.createDiv();
        divAboveCanvas.parent(parentContainer);

        const canvas = p5Instance.createCanvas(calcCanvasX(), calcCanvasY());
        canvas.parent(parentContainer);

        bezierDemo = new BezierDemo(p5Instance, parentContainer, divAboveCanvas);

        const updateCursor = () => p5Instance.cursor(bezierDemo.dragging ? 'grabbing' : bezierDemo.hovering ? 'grab' : 'default');

        canvas.mousePressed(() => {
            bezierDemo.handleMousePressed();
            updateCursor();
            return false; // prevent any browser defaults
        });
        canvas.touchStarted(() => {
            //calling this in setTimeout as p5Inst.touches is apparently not updated until after handleTouchStarted is done executing
            setTimeout(() => {
                bezierDemo.handleTouchStarted();
                if (!bezierDemo.dragging) canvas.style('touch-action', 'auto');
                else canvas.style('touch-action', 'none');
            });
            return false; // prevent any browser defaults
        });
        canvas.mouseReleased(() => {
            bezierDemo.handleMouseReleased();
            updateCursor();
        });
        canvas.touchEnded(() => {
            bezierDemo.handleTouchReleased();
            if (!bezierDemo.dragging) canvas.style('touch-action', 'auto');
            else canvas.style('touch-action', 'none');
            return false; // prevent any browser defaults
        });
        canvas.mouseMoved(() => {
            updateCursor();
            return false;
        });

        const preventScrollIfDragging = (e: TouchEvent) => {
            if (bezierDemo.dragging) e.preventDefault();
        };
        document.addEventListener('touchstart', preventScrollIfDragging, { passive: false });// https://stackoverflow.com/a/49582193/13727176
        document.addEventListener('touchmove', preventScrollIfDragging, { passive: false });
        document.addEventListener('touchend', preventScrollIfDragging, { passive: false });
        document.addEventListener('touchcancel', preventScrollIfDragging, { passive: false });

        document.querySelector('#cover')?.remove();
    };

    p5Instance.draw = () => {
        p5Instance.background(bgColor);
        bezierDemo.draw();
    };

    p5Instance.windowResized = () => {
        p5Instance.resizeCanvas(calcCanvasX(), calcCanvasY());
    }
};

new p5(bezierSketchConfig);