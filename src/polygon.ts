import P5 from "p5";
import { Drawable, Vec2 } from './app';

export class Polygon implements Drawable {
    constructor(protected p5: P5, protected vertexPositions: Vec2[]) {}

    draw(): void {
        const p5 = this.p5;
        p5.push();

		p5.beginShape();
        this.vertexPositions.forEach(pos => p5.vertex(...pos));
        // p5.fill(0);
        p5.endShape(p5.CLOSE);
    }
}

export class DragPolygon extends Polygon {
    private dragCircleRadius = 5;
    private indexOfDraggedVertex: number | null = null;

    constructor(p5: P5, private canvas: P5.Renderer, vertexPositions: Vec2[]) {
        super(p5, vertexPositions);
        //side note: the use of arrow function is preferred to using Function.prototype.bind(), e.g.:
        //canvas.mousePressed(this.handleMousePressed.bind(this));
        //https://stackoverflow.com/questions/42117911/lambda-functions-vs-bind-memory-and-performance
        this.canvas.mousePressed(() => this.handleMousePressed());
        this.canvas.mouseReleased(() => this.handleMouseReleased());
    }

    private handleMousePressed() {
        // console.log('in handleMousePressed');
        this.checkForHoverOverVertex([this.p5.mouseX, this.p5.mouseY]);
        // console.log(this.indexOfDraggedVertex);
    }

    private handleMouseReleased() {
        this.indexOfDraggedVertex = null;
    }

    

    private checkForHoverOverVertex(mousePos: Vec2) {
        const distancesOfVerticesToMouse = this.vertexPositions.map(pos => this.p5.dist(...pos, ...mousePos));
        // console.log(distancesOfVerticesToMouse);
        const indexOfVertexWithSmallestDist = distancesOfVerticesToMouse.reduce((smallest, currVal, currIndex, arr) => currVal < arr[smallest]? currIndex: smallest, 0);
        // console.log(indexOfVertexWithSmallestDist);
        if (distancesOfVerticesToMouse[indexOfVertexWithSmallestDist] <= this.dragCircleRadius) {
            this.indexOfDraggedVertex = indexOfVertexWithSmallestDist;
        }
        else this.indexOfDraggedVertex = null;
    }

    draw() {
        if (this.indexOfDraggedVertex != null) this.vertexPositions[this.indexOfDraggedVertex] = [this.p5.mouseX, this.p5.mouseY];
        super.draw();
        this.vertexPositions.forEach(pos => this.p5.circle(...pos, 2 * this.dragCircleRadius));
    }
}