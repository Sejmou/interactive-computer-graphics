import p5 from "p5";

/**
 * For some reason this is not defined in @types/p5...
 * A touch point on the screen, relative to (0, 0) of the canvas
 */
 export interface p5TouchPoint {
    x: number,
    y: number,
    id: number
}

export function drawLine(p5: p5, a: p5.Vector, b: p5.Vector, color: p5.Color = p5.color(0), lineWidth = 3) {
    p5.push();
    p5.strokeWeight(lineWidth);
    p5.stroke(color);
    p5.line(a.x, a.y, b.x, b.y);
    p5.pop();
}

export function isCloseToZero(val: number) {
    return Math.abs(val) < 1e-10;
}

export function directionVector(pointA: p5.Vector, pointB: p5.Vector) {
    return p5.Vector.sub(pointB, pointA);
}

export function clamp(val: number, min: number, max: number) {
    return Math.max(Math.min(val, Math.max(min, max)), Math.min(min, max));
}

export function drawCircle(p5Instance: p5, pos: p5.Vector, color: p5.Color, diameter: number) {
    p5Instance.push();
    p5Instance.noStroke();
    p5Instance.fill(color);
    p5Instance.circle(pos.x, pos.y, diameter);
    p5Instance.pop();
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

// inspired by: https://css-tricks.com/snippets/javascript/lighten-darken-color/
//returns color as string in hex format (only accepts inputs in rgba or hex notation atm)
// TODO: generalize and improve this mess if motivated
export function lightenDarkenColor(color: string, amount: number): string {
    let alpha: number | undefined;

    if (color.startsWith('rgba(') && color.endsWith(')')) {
        color = rgbaStringToHexA(color);
        alpha = parseInt(color.substr(6), 16);
        color = color.substr(0, 7);//7 digits: '#' + rgba values (in range 00 to FF each)
    }


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

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);// + (alpha? alpha.toString(16) : '');

}

//this assumes p5 colorMode() is set to rgb
export function lightenDarkenP5Color(p5: p5, color: p5.Color, amount: number) {
    const colStr = color.toString();
    const hexCol = lightenDarkenColor(colStr, amount);
    return p5.color(hexCol);
}

// https://css-tricks.com/converting-color-spaces-in-javascript/#rgba-to-hex-rrggbbaa
export function rgbaToHexA(red: number, green: number, blue: number, alpha: number) {
    let r = red.toString(16);
    let g = green.toString(16);
    let b = blue.toString(16);
    let a = Math.round(alpha * 255).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;
    if (a.length == 1)
        a = "0" + a;

    return "#" + r + g + b + a;
}

export function rgbaStringToHexA(color: string) {
    const rgbaSeparatedByCommas = color.substring('rgba('.length, color.indexOf(')'));
    const rgba = rgbaSeparatedByCommas.split(',');
    if (rgba.length === 4 && rgba.every(val => isNumeric(val))) {
        const [r, g, b, a] = rgba.map(val => +val);
        return rgbaToHexA(r, g, b, a);
    } else {
        console.error(`Could not extract r, g, b and a from provided string '${color}'`);
        return '#ffffff';
    }
}

// https://stackoverflow.com/a/175787/13727176
export function isNumeric(str: string) {
    return !isNaN(+str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)... wat does he mean lol?!
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}