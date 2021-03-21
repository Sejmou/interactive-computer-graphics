import p5 from 'p5';
import { Clickable, Drawable, Draggable } from './app';
import { DragPolygon } from './polygon';
import { DragVertex } from './vertex';
import { twoByTwoDeterminant, directionVector, drawLine, renderTextWithDifferentColors, parseColorString } from './util';

export class BarycentricTriangle implements Drawable, Clickable, Draggable {
    private pointInsideTriangle: PointOnTriangleSurface;
    private triangle: DragPolygon;

    public get hovering(): boolean {
        return this.triangle.hovering || this.pointInsideTriangle.hovering;
    };

    public get dragging(): boolean {
        return this.triangle.dragging || this.pointInsideTriangle.dragging;
    };

    constructor(
        p5: p5,
        vertexPositions: [p5.Vector, p5.Vector, p5.Vector]
    ) {
        this.triangle = new DragPolygon(p5, vertexPositions);
        this.triangle.vertices[0].color = p5.color('#C64821');
        this.triangle.vertices[1].color = p5.color('#E1B000');
        this.triangle.vertices[2].color = p5.color('#2AB7A9');

        this.pointInsideTriangle = new PointOnTriangleSurface(p5, [this.triangle.vertices[0], this.triangle.vertices[1], this.triangle.vertices[2]], 'P');
    }

    draw(): void {
        this.triangle.draw();
        this.pointInsideTriangle.draw();
        this.triangle.drawVertices();//draw triangle vertices so that lines for pointInsideTriangle don't get rendered over them 
    }

    handleMousePressed(): void {
        this.pointInsideTriangle.handleMousePressed();//after this call pointInsideTriangle.dragging might be true

        //we don't want the user to be allowed to drag a triangle vertex and the pointInsideTriangle at the same time
        //if this were allowed, the pointInsideTriangle would be stuck at the same pos as the triangle vertex
        if (!this.pointInsideTriangle.dragging) this.triangle.handleMousePressed();
    }

    handleMouseReleased(): void {
        this.triangle.handleMouseReleased();
        this.pointInsideTriangle.handleMouseReleased();
    }

    handleMouseMoved(): void {
        this.triangle.handleMouseMoved();
        this.pointInsideTriangle.handleMouseMoved();
    }
}

class PointOnTriangleSurface extends DragVertex {
    private coefficients: [number, number, number];

    constructor(p5: p5, private triangleVertices: [DragVertex, DragVertex, DragVertex], label: string = '') {
        super(p5, p5.createVector(
            triangleVertices.map(v => v.x).reduce((prev, curr) => prev + curr, 0) / 3,//centerX
            triangleVertices.map(v => v.y).reduce((prev, curr) => prev + curr, 0) / 3//centerY
        ), label);
        const [u, v] = [0.3333, 0.3333];
        const w = 1 - u - v;
        this.coefficients = [u, v, w];
        this.updateColor();
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
        const [a, b, c] = this.triangleVertices.map(v => v.position);
        //an important property of barycentric coordinates: u + v + w = 1
        //barycentric coordinates of a point P can be thought of as relationships between the areas of the three triangles which P creates
        //the point P on the surface defined by the triangle vertices A, B, C creates three triangles (A,B,P), (B,C,P) and (C,A,P)
        //if P is inside the triangle, we can simply calculate size of the areas of each of these three triangles to the size of the whole triangle
        //this relationship gives us the barycentric coordinates

        //e.g. u (or alpha) can be defined as the area of the triangle (B,C,P) in relation to the area of the whole triangle (A, B, C)
        //  if u is 1, then P is exactly at A (the area of (B,C,P) is the same as the area of (A, B, C))
        //  u will be 0, if P is on the line BC (as the area of (B,C,P) is then also 0)

        //However, things get a bit more complicated, if P is outside of the triangle
        //As the area of one of the three triangles created by P (described above) is then bigger than the whole triangle, one of the barycentric coordinates becomes > 1
        //But we somehow have to make sure that the sum of u, v and w is still 1
        //This can be done using determinants!
        //the determinant also encodes information about the orientation of surfaces (or, more generally, vector spaces), we use this to our advantage

        //For each of the triangles, we pick one of its vertices and create direction vectors, each pointing from the vertex to on of the other two vertices
        //These two vectors define a surface: a parallelogram (or even a square, if they are orthogonal)
        //If we take the cross product of those two vectors, we get a 3D-vector, which is orthogonal to this parallelogram and pointing either in the positive or negative z-direction
        //The z-coordinate of this vector is the same as the determinant of a 2x2-matrix
        //The important thing is: the absolute value of this determinant is the area of this parallelogram, if we divide it by two, we then get the area of the triangle!
        //Note: As we are only interested in the relationships of the areas of the triangles, we can save ourselves the division by 2 by comparing the areas of those parallelograms instead

        //Furthermore, the sign of the determinant encodes the orientation of the vectors!
        //If point P is outside of the triangle, the orientation of at least one of the triangles which P creates
        //If the orientation of a triangle changes, its respective pairs of vectors used for the computation of the determinant also get swapped!
        //This makes it possible to detect, if one of the three triangles is outside of the base triangle and subtract its area instead
        //This way, we can achieve the desired effect that the sum of u, v and w is still 1
        const detACAB = twoByTwoDeterminant(directionVector(a, c), directionVector(a, b));
        const detBPBC = twoByTwoDeterminant(directionVector(b, this.position), directionVector(b, c));
        const detCPCA = twoByTwoDeterminant(directionVector(c, this.position), directionVector(c, a));
        const u = detBPBC / detACAB;
        const v = detCPCA / detACAB;
        const w = 1 - u - v;
        this.coefficients = [u, v, w];

        this.updateColor();
    }

    private updateColor() {
        const weightedVertexColors = this.triangleVertices.map(v => (parseColorString(v.color.toString())))
            .map((color, i) => color.map(num => num * this.coefficients[i]));
        const mixOfAllColors = weightedVertexColors.reduce((curr, prev) => curr.map((num, i) => num + prev[i]), [0, 0, 0, 0]);
        const [r, g, b, a] = mixOfAllColors;
        this.color = this.p5.color(r, g, b);//alpha doesn't work correctly, it's 1 (if all alphas are maxed out), however the function expects a number in range [0, 255]
        this.color.setAlpha(a * 255);
    }

    updatePosRelativeToTriangle() {
        const [u, v, w] = this.coefficients;
        const [a, b, c] = this.triangleVertices.map(v => v.position);
        const newPos = p5.Vector.mult(a, u).add(p5.Vector.mult(b, v)).add(p5.Vector.mult(c, w));
        this.position.x = newPos.x;
        this.position.y = newPos.y;
    }
}