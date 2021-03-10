import P5 from 'p5';
import DraggableTriangle from './triangle';

export interface Drawable {
    draw(): void
}

export interface Clickable {
    checkClicked(x: number, y: number): void
}

export type Vec2 = [number, number];

// Creating the sketch itself
const sketch = (p5: P5) => {
    // The sketch setup method 

    const stuffToDraw: Drawable[] = []

    p5.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5.createCanvas(800, 600);
        canvas.parent("app");

        // Configuring the canvas
        p5.background("white");

        stuffToDraw.push(new DraggableTriangle(p5, [80, 100], [400, 140], [130, 310]));

    };

    // The sketch draw method
    p5.draw = () => {
        stuffToDraw.forEach(i => i.draw());
    };
};

new P5(sketch);