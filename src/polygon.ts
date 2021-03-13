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

    draw() {
        if (this.indexOfDraggedVertex != null) this.vertexPositions[this.indexOfDraggedVertex] = [this.p5.mouseX, this.p5.mouseY];
        super.draw();
        this.vertexPositions.forEach(pos => this.p5.circle(...pos, 2 * this.dragCircleRadius));
    }

    constructor(p5: P5, private canvas: P5.Renderer, vertexPositions: Vec2[]) {
        super(p5, vertexPositions);
        this.canvas.mousePressed(() => this.handleCanvasMousePressed());
        this.canvas.mouseReleased(() => this.handleCanvasMouseReleased());
        this.canvas.mouseMoved(() => this.handleCanvasMouseMoved());
    }

    private handleCanvasMousePressed() {
        const selectedVertex = this.getVertexUserIsHoveringOver();
        if (selectedVertex != null) {
            this.indexOfDraggedVertex = selectedVertex;
            // this.p5.cursor(this.p5.MOVE);
            //unfortunately, this doesn't work, cursor doesn't update despite property being set on canvas... :/
            this.p5.cursor('default');
        }
    }

    private handleCanvasMouseReleased() {
        this.indexOfDraggedVertex = null;
        //changing different cursor while dragging somehow doesn't work
        //We therefore just set cursor to p5.MOVE if user hovers over a draggable vertex and show default cursor if not
        // this.p5.cursor('grab');
    }

    private handleCanvasMouseMoved() {
        if (this.indexOfDraggedVertex != null) return;
        const hoveredVertex = this.getVertexUserIsHoveringOver();
        if (hoveredVertex != null) {
            this.p5.cursor(this.p5.MOVE);
        }
        else this.p5.cursor('default');
    }

    private getVertexUserIsHoveringOver(): number | null {
        const mousePos: Vec2 = [this.p5.mouseX, this.p5.mouseY];
        const distancesOfVerticesToMouse = this.vertexPositions.map(pos => this.p5.dist(...pos, ...mousePos));
        const indexOfVertexWithSmallestDist = distancesOfVerticesToMouse.reduce((smallest, currVal, currIndex, arr) => currVal < arr[smallest]? currIndex: smallest, 0);
        if (distancesOfVerticesToMouse[indexOfVertexWithSmallestDist] <= this.dragCircleRadius) {
            return indexOfVertexWithSmallestDist;
        }
        return null;
    }
}