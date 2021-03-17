import p5 from 'p5';
import { CanvasEventHandlers, Drawable } from './app';
import { DragPolygon, DragVertex } from './polygon';

export class BarycentricTriangle implements Drawable {
    private pointInsideTriangle: PointOnTriangleSurface;
    private triangle: DragPolygon;

    constructor(
        private p5: p5,
        canvasEventHandlers: CanvasEventHandlers,
        vertexPositions: [p5.Vector, p5.Vector, p5.Vector]
    ) {
        this.triangle = new DragPolygon(p5, canvasEventHandlers, vertexPositions);
        this.pointInsideTriangle = new PointOnTriangleSurface(p5, [this.triangle.vertices[0], this.triangle.vertices[1], this.triangle.vertices[2]]);
        canvasEventHandlers.mousePressed.push(() => this.handleMousePressed());
        canvasEventHandlers.mouseReleased.push(() => this.handleMouseReleased());
        canvasEventHandlers.mouseMoved.push(() => this.handleMouseMoved());
    }

    draw(): void {
        this.triangle.draw();
        this.pointInsideTriangle.draw();
    }

    private handleMouseMoved() {
        if (this.pointInsideTriangle.dragging || this.pointInsideTriangle.hovering) this.p5.cursor(this.p5.MOVE);
    }

    private handleMousePressed() {
        if (this.pointInsideTriangle.hovering) this.pointInsideTriangle.dragging = true;
    }

    private handleMouseReleased() {
        if (this.pointInsideTriangle.dragging) this.pointInsideTriangle.dragging = false;
    }
}

class PointOnTriangleSurface extends DragVertex {
    private coefficients: [number, number, number];

    constructor(p5: p5, private triangleVertices: [DragVertex, DragVertex, DragVertex]) {
        super(p5, p5.createVector(
            triangleVertices.map(v => v.x).reduce((prev, curr) => prev + curr, 0) / 3,//centerX
            triangleVertices.map(v => v.y).reduce((prev, curr) => prev + curr, 0) / 3//centerY
        ));
        this.coefficients = [0, 0, 0];
        
    }

    public draw(): void {
        if (this.triangleVertices.some(v => v.dragging)) this.updatePosRelativeToTriangle();
        if (this.dragging) {
            super.updatePos();
            this.updateCoefficients();
        }

        super.draw();
    }

    public updateCoefficients() {
        //TODO: calculate properly
        this.coefficients = [0, 0, 0];
    }

    updatePosRelativeToTriangle() {
        const centerX = this.triangleVertices.map(v => v.x).reduce((prev, curr) => prev + curr, 0) / 3;
        const centerY = this.triangleVertices.map(v => v.y).reduce((prev, curr) => prev + curr, 0) / 3;
        this.pos.x = centerX;
        this.pos.y = centerY;
        //I have no idea how barycentric coordinates worked lol
        // console.log(this.triangleVertices);
        // const weightedSumOfVertices = this.triangleVertices.map((v, i) => v.mult(this.coefficients[i]))
        //     .reduce((prev, curr) => prev.add(curr), this.p5.createVector(0, 0));
        // console.log('weighted sum', weightedSumOfVertices);
        // this.pos = [ weightedSumOfVertices.x, weightedSumOfVertices.y ];
    }
}