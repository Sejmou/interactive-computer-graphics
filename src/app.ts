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
const sketch = (p5: P5) => {
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
        canvas.parent("app");

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

new P5(sketch);