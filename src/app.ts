import P5 from 'p5';
import { Polygon, DragPolygon } from './polygon';
import { BarycentricTriangle } from './barycentric-triangle';

export interface Drawable {
    draw(): void
}

export interface Clickable {
    checkClicked(x: number, y: number): void
}

export type Vec2 = [number, number];

// Creating the sketch itself
const sketch = (p5: P5) => {
    const bgColor = 230;
    const stuffToDraw: Drawable[] = []
    
    // The sketch setup method 
    p5.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5.createCanvas(800, 600);
        canvas.parent("app");

        // Configuring the canvas
        p5.background(bgColor);

        // stuffToDraw.push(new DragPolygon(p5, canvas, [[80, 100], [400, 140], [130, 310]]));
        stuffToDraw.push(new BarycentricTriangle(p5, canvas, [[80, 100], [400, 140], [130, 310]]));

    };

    // The sketch draw method
    p5.draw = () => {
        p5.background(bgColor);
        stuffToDraw.forEach(i => i.draw());
    };
};

new P5(sketch);