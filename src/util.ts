import p5 from "p5";

export function drawLine(p5: p5, a: p5.Vector, b: p5.Vector, color: p5.Color = p5.color(0)) {
    p5.push();
    p5.stroke(color);
    p5.line(a.x, a.y, b.x, b.y);
    p5.pop();
}

export function isCloseToZero(val: number) {
    return Math.abs(val) < 1e-10;
}

export function linearInterpolation(a: p5.Vector, b: p5.Vector, u: number = 0.5) {
    return p5.Vector.add(a, p5.Vector.mult(p5.Vector.sub(b, a), u));
}

export function directionVector(pointA: p5.Vector, pointB: p5.Vector) {
    return p5.Vector.sub(pointB, pointA);
}

export function clamp(val: number, min: number, max: number) {
    return Math.max(Math.min(val, Math.max(min, max)), Math.min(min, max));
}

export function drawLineAndDotBetween(
    p5Instance: p5, start: p5.Vector, stop: p5.Vector, percent: number,
    lineWidth: number = 4, lineColor: p5.Color = p5Instance.color(0), dotDiameter: number = 10, dotColor: p5.Color = p5Instance.color(60)
) {
    const pointBetween = p5.Vector.lerp(start, stop, percent) as unknown as p5.Vector;

    p5Instance.push();
    // draw line
    p5Instance.stroke(lineColor);
    p5Instance.strokeWeight(lineWidth);
    p5Instance.line(start.x, start.y, stop.x, stop.y);

    // draw dot
    p5Instance.noStroke();
    p5Instance.fill(dotColor);
    p5Instance.circle(pointBetween.x, pointBetween.y, dotDiameter);
    p5Instance.pop();

    return pointBetween;
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

export function parseColorString(rgb: string): [number, number, number, number] {
    const [r, g, b, a] = rgb.replace(/[^\d,]/g, '').split(',').map(str => +str);
    return [r, g, b, a];
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

export function lightenDarkenColor(color: string, amount: number): string {

    let usePound = false;

    if (color[0] == "#") {
        color = color.slice(1);
        usePound = true;
    }

    const num = parseInt(color, 16);

    let r = (num >> 16) + amount;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00FF) + amount;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000FF) + amount;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);

}