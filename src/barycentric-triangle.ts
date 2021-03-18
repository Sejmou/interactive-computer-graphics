import p5 from 'p5';
import { CanvasEventHandlers, Drawable } from './app';
import { DragPolygon, DragVertex } from './polygon';
import { drawLine, linearInterpolation, renderTextWithDifferentColors } from './util';

export class BarycentricTriangle implements Drawable {
    private pointInsideTriangle: PointOnTriangleSurface;
    private triangle: DragPolygon;

    constructor(
        private p5: p5,
        canvasEventHandlers: CanvasEventHandlers,
        vertexPositions: [p5.Vector, p5.Vector, p5.Vector]
    ) {
        this.triangle = new DragPolygon(p5, canvasEventHandlers, vertexPositions);
        this.triangle.vertices[0].color = p5.color('red');
        this.triangle.vertices[1].color = p5.color('green');
        this.triangle.vertices[2].color = p5.color('blue');
        this.pointInsideTriangle = new PointOnTriangleSurface(p5, [this.triangle.vertices[0], this.triangle.vertices[1], this.triangle.vertices[2]], 'P');
        canvasEventHandlers.mousePressed.push(() => this.handleMousePressed());
        canvasEventHandlers.mouseReleased.push(() => this.handleMouseReleased());
        canvasEventHandlers.mouseMoved.push(() => this.handleMouseMoved());
    }

    draw(): void {
        this.triangle.draw();
        this.pointInsideTriangle.draw();
        this.triangle.drawVertices();//draw triangle vertices so that lines for pointInsideTriangle don't get rendered over them 
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

    constructor(p5: p5, private triangleVertices: [DragVertex, DragVertex, DragVertex], label: string = '') {
        super(p5, p5.createVector(
            triangleVertices.map(v => v.x).reduce((prev, curr) => prev + curr, 0) / 3,//centerX
            triangleVertices.map(v => v.y).reduce((prev, curr) => prev + curr, 0) / 3//centerY
        ), label);
        const [u, v] = [0.333, 0.333];
        const w = 1 - u - v;
        this.coefficients = [u, v, w];
    }

    public draw(): void {
        if (this.triangleVertices.some(v => v.dragging)) this.updatePosRelativeToTriangle();
        if (this.dragging) {
            super.updatePos();
            this.updateCoefficients();
        }

        const [a, b, c] = this.triangleVertices.map(v => v.position);
        const [colorA, colorB, colorC] = this.triangleVertices.map(v => v.color);
        drawLine(this.p5, a, this.position, colorA);
        drawLine(this.p5, b, this.position, colorB);
        drawLine(this.p5, c, this.position, colorC);

        this.renderCoefficientsText();

        super.draw();
    }

    private renderCoefficientsText() {
        const [a, b, c] = this.triangleVertices;
        const [u, v, w] = this.coefficients;
        renderTextWithDifferentColors(this.p5, 20, 20,
            [`P = `, this.p5.color(0)],
            [`${u.toFixed(3)} a`, a.color],
            [' + ', this.p5.color(0)],
            [`${v.toFixed(3)} b`, b.color],
            [' + ', this.p5.color(0)],
            [`${w.toFixed(3)} c`, c.color]);
    }

    public updateCoefficients() {
        //link: https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/barycentric-coordinates
        //don't understand why they use different coefficients with a, b, c
        const [a, b, c] = this.triangleVertices.map(v => v.position);
        const wholeTriangleArea = this.computeTriangleArea(a, b, c);
        const areaCBP = this.computeTriangleArea(c, b, this.position);
        const areaACP = this.computeTriangleArea(a, c, this.position);
        const u = areaCBP / wholeTriangleArea;
        const v = areaACP / wholeTriangleArea;
        const w = 1 - u - v;
        this.coefficients = [u, v, w];
    }

    private computeTriangleArea(...[a, b, c]: [p5.Vector, p5.Vector, p5.Vector]): number {
        return (p5.Vector.cross(p5.Vector.sub(b, a), p5.Vector.sub(c, a)) as unknown as p5.Vector).mag() / 2;//bug in @types???
    }

    updatePosRelativeToTriangle() {
        const [u, v, w] = this.coefficients;
        const [a, b, c] = this.triangleVertices.map(v => v.position);
        const newPos = p5.Vector.mult(a, u).add(p5.Vector.mult(b, v)).add(p5.Vector.mult(c,w));
        this.position.x = newPos.x;
        this.position.y = newPos.y;
    }
}