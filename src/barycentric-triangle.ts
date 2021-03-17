import p5 from 'p5';
import { Drawable } from './app';
import { DragPolygon, DragVertex } from './polygon';

export class BarycentricTriangle implements Drawable {
    private pointInsideTriangle: PointOnTriangleSurface;
    private triangle: DragPolygon;

    constructor(
        private p5: p5,
        canvas: p5.Renderer,
        vertexPositions: [p5.Vector, p5.Vector, p5.Vector]
    ) {
        this.triangle = new DragPolygon(p5, canvas, vertexPositions);
        this.pointInsideTriangle = new PointOnTriangleSurface(p5, [this.triangle.vertices[0], this.triangle.vertices[1], this.triangle.vertices[2]]);
    }

    draw(): void {
        this.triangle.draw();
        this.pointInsideTriangle.draw();
    }
}

class PointOnTriangleSurface {
    private coefficients: [number, number, number];
    private pos: p5.Vector;

    constructor(private p5: p5, private triangleVertices: [DragVertex, DragVertex, DragVertex]) {
        const centerX = this.triangleVertices.map(v => v.x).reduce((prev, curr) => prev + curr, 0) / 3;
        const centerY = triangleVertices.map(v => v.y).reduce((prev, curr) => prev + curr, 0) / 3
        this.pos = p5.createVector(centerX, centerY);
        this.coefficients = [0, 0, 0];
    }

    public draw(): void {
        this.updatePos();

        this.p5.push()
        this.p5.strokeWeight(10);
        this.p5.point(this.pos.x, this.pos.y);
        this.p5.pop();
    }

    public updateCoefficients() {
        //TODO: calculate properly
        this.coefficients = [0, 0, 0];
    }

    updatePos() {
        //I have no idea how barycentric coordinates worked lol
        // console.log(this.triangleVertices);
        // const weightedSumOfVertices = this.triangleVertices.map((v, i) => v.mult(this.coefficients[i]))
        //     .reduce((prev, curr) => prev.add(curr), this.p5.createVector(0, 0));
        // console.log('weighted sum', weightedSumOfVertices);
        // this.pos = [ weightedSumOfVertices.x, weightedSumOfVertices.y ];
    }
}