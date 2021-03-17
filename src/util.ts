import p5 from "p5";

export function drawLine(p5: p5, a: p5.Vector, b: p5.Vector, color: p5.Color = p5.color(0)) {
    p5.push();
    p5.stroke(color);
    p5.line(a.x, a.y, b.x, b.y);
    p5.pop();
}

export function linearInterpolation(a: p5.Vector, b: p5.Vector, u: number = 0.5) {
    return p5.Vector.add(a, p5.Vector.mult(p5.Vector.sub(b,a), u));
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