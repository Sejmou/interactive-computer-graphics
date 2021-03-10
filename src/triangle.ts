import P5 from "p5";
import { Drawable, Vec2 } from './app';

export default class DraggableTriangle implements Drawable {
    private vertices: DragVertex[] = [];

	constructor(private p5: P5, firstVertexPos: Vec2, secondVertexPos: Vec2, thirdVertexPos: Vec2) {
        this.vertices.push(new DragVertex(p5, firstVertexPos));
        this.vertices.push(new DragVertex(p5, secondVertexPos));
        this.vertices.push(new DragVertex(p5, thirdVertexPos));
	}

	draw() {
        const p5 = this.p5;
		p5.push();

		p5.beginShape();
        this.vertices.forEach(v => v.drawVertex());
        // p5.fill(0);
        p5.endShape(p5.CLOSE);

        this.vertices.forEach(v => v.drawOuterCircle());

		this.p5.pop();
	}
}

class DragVertex {
    constructor(private p5: P5, private pos: Vec2) {}

    drawVertex() {
        this.p5.vertex(...this.pos);
    }

    drawOuterCircle() {
        const p5 = this.p5;
        p5.push();
        p5.noFill();
        p5.circle(...this.pos, 10);
        p5.pop();

    }
}