import p5 from "p5";
import { Drawable } from "./canvas-content";

/**
 * For some reason this is not defined in @types/p5...
 * A touch point on the screen, relative to (0, 0) of the canvas
 */
export interface p5TouchPoint {
    x: number;
    y: number;
    id: number;
}

export function drawLineVector(p5: p5, a: p5.Vector, b: p5.Vector, color: p5.Color = p5.color(0), lineWidth = 3) {
    p5.push();
    p5.strokeWeight(lineWidth);
    p5.stroke(color);
    p5.line(a.x, a.y, b.x, b.y);
    p5.pop();
}

export function drawLineXYCoords(p5: p5, x1: number, y1: number, x2: number, y2: number, color: p5.Color = p5.color(0), lineWidth = 3) {
    p5.push();
    p5.strokeWeight(lineWidth);
    p5.stroke(color);
    p5.line(x1, y1, x2, y2);
    p5.pop();
}

export function drawPointVector(p5: p5, pos: p5.Vector, color: p5.Color, thickness: number) {
    p5.push();
    p5.stroke(color);
    p5.strokeWeight(thickness);
    p5.point(pos.x, pos.y);
    p5.pop();
}

export function drawSquare(p5: p5, pos: p5.Vector, color: p5.Color, sideLength: number) {
    p5.push();
    p5.noStroke();
    p5.fill(color);
    p5.rectMode(p5.CENTER);
    p5.rect(pos.x, pos.y, sideLength, sideLength);
    p5.pop();
}

export function drawCircle(p5Instance: p5, pos: p5.Vector, color: p5.Color, diameter: number) {
    p5Instance.push();
    p5Instance.noStroke();
    p5Instance.fill(color);
    p5Instance.circle(pos.x, pos.y, diameter);
    p5Instance.pop();
}

export function directionVector(pointA: p5.Vector, pointB: p5.Vector) {
    return p5.Vector.sub(pointB, pointA);
}
//determinant can be interpreted as the oriented area of a parallelogram spanned by the two column vectors of a 2x2 matrix
//https://math.stackexchange.com/a/115545

export function twoByTwoDeterminant(colVec1: p5.Vector, colVec2: p5.Vector): number {
    return (p5.Vector.cross(colVec1, colVec2) as unknown as p5.Vector).z; //return type of cross() certainly is NOT number, bug in @types?
}

export function triangleArea(...[a, b, c]: [p5.Vector, p5.Vector, p5.Vector]): number {
    return (p5.Vector.cross(p5.Vector.sub(b, a), p5.Vector.sub(c, a)) as unknown as p5.Vector).mag() / 2; //bug in @types???
}

export function renderTextWithDifferentColors(p5: p5, x: number, y: number, ...textAndColor: [string, p5.Color][]) {
    let posX = x;
    textAndColor.forEach(([text, color]) => {
        p5.push();
        const textWidth = p5.textWidth(text);
        p5.fill(color);
        p5.text(text, posX, y);
        posX += textWidth;
        p5.pop();
    });
}
/**
 *
 * @param p5
 * @param text text which contains '{textWhichShouldBeSubscripted}'
 * @param x
 * @param y
 */

export function renderTextWithSubscript(p5: p5, text: string, x: number, y: number, color?: p5.Color) {
    p5.push();
    p5.textAlign(p5.LEFT, p5.CENTER);
    if (color) p5.fill(color);

    let xOffset = 0;
    let currCharIndex = 0;
    let openingBracesIndex = text.indexOf('_{');
    while (openingBracesIndex !== -1 && currCharIndex < text.length) {
        const textBeforeSubscript = text.substring(currCharIndex, currCharIndex + openingBracesIndex);
        p5.text(textBeforeSubscript, x + xOffset, y);

        currCharIndex += (openingBracesIndex + '_{'.length);
        xOffset += p5.textWidth(textBeforeSubscript);

        const closingBracesIndex = text.substring(currCharIndex).indexOf('}');
        if (closingBracesIndex === -1) {
            console.warn('invalid text with subscript:', text);
            return;
        }

        const textInSubscript = text.substring(currCharIndex, currCharIndex + closingBracesIndex);
        currCharIndex += closingBracesIndex + 1;

        p5.text(textInSubscript, x + xOffset, y + p5.textDescent());
        xOffset += p5.textWidth(textInSubscript);

        openingBracesIndex = text.substring(currCharIndex).indexOf('_{');
    }

    p5.text(text.substring(currCharIndex), x + xOffset, y);

    p5.pop();
}

export class FrameRateMonitor implements Drawable {
    constructor(private p5: p5) { }

    draw(): void {
        this.p5.text(`FPS: ${this.p5.frameRate().toFixed(2)}`, 20, 20);
    }
}
