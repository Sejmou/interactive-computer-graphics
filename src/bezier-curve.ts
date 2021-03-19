import p5 from 'p5';
import { Drawable } from './app';
import { drawLineAndDotBetween } from './util'

export class BezierCurve implements Drawable {
    private vertexAnchor: p5.Vector;
    private bezierControlPoint1: p5.Vector;
    private bezierControlPoint2: p5.Vector;
    private bezierAnchor: p5.Vector;

    private lineWidth: number;
    private dotDiameter: number;

    private t: number = 0;

    constructor(private p5: p5, w: number, h: number, shift: number, x: number, y: number) {
        this.lineWidth = p5.width * 0.0025;
        this.dotDiameter = p5.width * 0.015;

        this.vertexAnchor = p5.createVector(x, y + h);
        this.bezierAnchor = p5.createVector(x + w, y + h);
        this.bezierControlPoint1 = p5.createVector(x - shift, y);
        this.bezierControlPoint2 = p5.createVector(x + w - shift, y);
    }

    draw(): void {
        const p5 = this.p5;
        p5.background(240);

        this.t = p5.frameCount % 100 / 100;

        this.drawBezierLine();

        this.drawDeCasteljauHelperLinesAndDots();

        this.drawAnchorPointsAndControlPoints();
    }
    
    private drawBezierLine() {
        this.p5.push();
        this.p5.strokeWeight(this.lineWidth * 2);
        this.p5.stroke(30);
        this.p5.noFill();
        this.p5.beginShape();
        this.p5.vertex(this.vertexAnchor.x, this.vertexAnchor.y);
        this.p5.bezierVertex(this.bezierControlPoint1.x, this.bezierControlPoint1.y, this.bezierControlPoint2.x, this.bezierControlPoint2.y, this.bezierAnchor.x, this.bezierAnchor.y);
        this.p5.endShape();
        this.p5.pop();
    }

    private drawDeCasteljauHelperLinesAndDots() {
        const pointBetween1 = drawLineAndDotBetween(this.p5, this.vertexAnchor, this.bezierControlPoint1, this.t, this.lineWidth, '#E1B000', this.dotDiameter, '#E1B000');
        const pointBetween2 = drawLineAndDotBetween(this.p5, this.bezierControlPoint1, this.bezierControlPoint2, this.t, this.lineWidth, '#E1B000', this.dotDiameter, '#E1B000');
        const pointBetween3 = drawLineAndDotBetween(this.p5, this.bezierControlPoint2, this.bezierAnchor, this.t, this.lineWidth, '#E1B000', this.dotDiameter, '#E1B000');
        const pointBetween4 = drawLineAndDotBetween(this.p5, pointBetween1, pointBetween2, this.t, this.lineWidth, '#E1B000', this.dotDiameter, '#E1B000');
        const pointBetween5 = drawLineAndDotBetween(this.p5, pointBetween2, pointBetween3, this.t, this.lineWidth, '#E1B000', this.dotDiameter, '#E1B000');
        const pointBetween6 = drawLineAndDotBetween(this.p5, pointBetween4, pointBetween5, this.t, this.lineWidth, '#E1B000', this.dotDiameter * 1.5, '#c64821');
    }

    private drawAnchorPointsAndControlPoints() {
        this.p5.push();
        this.p5.fill('#E1B000');

        this.p5.circle(this.vertexAnchor.x, this.vertexAnchor.y, this.dotDiameter);
        this.p5.circle(this.bezierAnchor.x, this.bezierAnchor.y, this.dotDiameter);

        this.p5.circle(this.bezierControlPoint1.x, this.bezierControlPoint1.y, this.dotDiameter);
        this.p5.circle(this.bezierControlPoint2.x, this.bezierControlPoint2.y, this.dotDiameter);

        this.p5.pop();
    }
}