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
        this.coefficients = [0, 0, 0];
        
    }

    public draw(): void {
        if (this.triangleVertices.some(v => v.dragging)) this.updatePosRelativeToTriangle();
        if (this.dragging) {
            super.updatePos();
            this.updateCoefficients();
        }

        const [a, b, c] = this.triangleVertices.map(v => v.position);
        const midAB = linearInterpolation(a,b);
        const midAC = linearInterpolation(a, c);
        const midBC = linearInterpolation(b, c);
        
        drawLine(this.p5, a, midBC, this.triangleVertices[0].color);
        drawLine(this.p5, b, midAC, this.triangleVertices[1].color);
        drawLine(this.p5, c, midAB, this.triangleVertices[2].color);

        this.renderCoefficientsText();

        super.draw();
    }

    private renderCoefficientsText() {
        const [a, b, c] = this.triangleVertices;
        const [aCoeff, bCoeff, cCoeff] = this.coefficients;
        renderTextWithDifferentColors(this.p5, 20, 20, 
            [`P = `, this.p5.color(0)],
            [`${aCoeff.toFixed(2)} a`, a.color],
            [' + ', this.p5.color(0)],
            [`${bCoeff.toFixed(2)} b`, b.color],
            [' + ', this.p5.color(0)],
            [`${cCoeff.toFixed(2)} c`, c.color]);
    }

    public updateCoefficients() {
        //TODO: calculate properly
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