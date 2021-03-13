import p5 from 'p5';
import { Drawable, Vec2 } from './app';
import { DragPolygon } from './polygon';

export class BarycentricTriangle implements Drawable {
    private pointInsideTriangle: Vec2;
    private triangle: DragPolygon;

    constructor(
        private p5: p5,
        canvas: p5.Renderer,
        private vertices: [Vec2, Vec2, Vec2]
    ) {
        this.triangle = new DragPolygon(p5, canvas, vertices);
        const centerX = (vertices.map(v => v[0]).reduce((prev, curr) => prev + curr, 0) / 3);
        const centerY = (vertices.map(v => v[1]).reduce((prev, curr) => prev + curr, 0) / 3);
        this.pointInsideTriangle = [centerX, centerY];
    }

    draw(): void {
        this.triangle.draw();
        const centerX = (this.vertices.map(v => v[0]).reduce((prev, curr) => prev + curr, 0) / 3);
        const centerY = (this.vertices.map(v => v[1]).reduce((prev, curr) => prev + curr, 0) / 3);
        this.p5.point(centerX, centerY);
    }
}