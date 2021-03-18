import p5 from "p5";

export function drawLine(p5: p5, a: p5.Vector, b: p5.Vector, color: p5.Color = p5.color(0)) {
    p5.push();
    p5.stroke(color);
    p5.line(a.x, a.y, b.x, b.y);
    p5.pop();
}

export function linearInterpolation(a: p5.Vector, b: p5.Vector, u: number = 0.5) {
    return p5.Vector.add(a, p5.Vector.mult(p5.Vector.sub(b, a), u));
}

export function directionVector(pointA: p5.Vector, pointB: p5.Vector) {
    return p5.Vector.sub(pointB, pointA);
}

//determinant can be interpreted as the oriented area of a parallelogram spanned by the two column vectors of a 2x2 matrix
//https://math.stackexchange.com/a/115545
export function twoByTwoDeterminant(colVec1: p5.Vector, colVec2: p5.Vector): number {
    return (p5.Vector.cross(colVec1, colVec2) as unknown as p5.Vector).z;//return type of cross() certainly is NOT number, bug in @types?
}

export function triangleArea(...[a, b, c]: [p5.Vector, p5.Vector, p5.Vector]): number {
    return (p5.Vector.cross(p5.Vector.sub(b, a), p5.Vector.sub(c, a)) as unknown as p5.Vector).mag() / 2;//bug in @types???
}

export function indexToLowercaseLetter(i: number): string {
    return String.fromCharCode(i + 97);
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