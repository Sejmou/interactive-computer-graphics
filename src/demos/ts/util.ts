import p5 from "p5";
import { Drawable } from "./ui-interfaces";

/**
 * For some reason this is not defined in @types/p5...
 * A touch point on the screen, relative to (0, 0) of the canvas
 */
export interface p5TouchPoint {
    x: number,
    y: number,
    id: number
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


// TODO: generalize and improve this if motivated
/**
 * inspired by: https://css-tricks.com/snippets/javascript/lighten-darken-color/
 * returns color as string in hex format (only accepts inputs in rgba or hex notation atm)
 * @param color some color
 * @param amount if positive, color gets darker, if negative it gets brighter
 * @returns modified color, without alpha channel (couldn't figure out how to handle that yet)
 */
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

export function extractColorChannelsFromRGBAString(rgbaStr: string): { r: number, g: number, b: number, a: number } {
    const rgbaSeparatedByCommas = rgbaStr.substring('rgba('.length, rgbaStr.indexOf(')'));
    const rgba = rgbaSeparatedByCommas.split(',');
    if (rgba.length === 4 && rgba.every(val => isNumeric(val))) {
        const [r, g, b, a] = rgba.map(val => +val);
        return { r, g, b, a };
    } else {
        console.error(`Could not extract r, g, b and a from provided string '${rgbaStr}'`);
        return { r: 0, g: 0, b: 0, a: 255 };
    }
}

// https://stackoverflow.com/a/175787/13727176
export function isNumeric(str: string) {
    return !isNaN(+str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)... wat does he mean lol?!
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}


export function randomHexColorCode() {
    return Math.floor(Math.random() * 16777215).toString(16);
}



//https://stackoverflow.com/a/37716142/13727176
// step 1: precomputed binomials
const binomials = [
    [1],
    [1, 1],
    [1, 2, 1],
    [1, 3, 3, 1],
    [1, 4, 6, 4, 1],
    [1, 5, 10, 10, 5, 1],
    [1, 6, 15, 20, 15, 6, 1],
    [1, 7, 21, 35, 35, 21, 7, 1],
    [1, 8, 28, 56, 70, 56, 28, 8, 1],
    [1, 9, 36, 84, 126, 126, 84, 36, 9, 1],
    [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1],
    [1, 11, 55, 165, 330, 462, 462, 330, 165, 55, 11, 1],
    [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1],
    [1, 13, 78, 286, 715, 1287, 1716, 1716, 1287, 715, 286, 78, 13, 1],
    [1, 14, 91, 364, 1001, 2002, 3003, 3432, 3003, 2002, 1001, 364, 91, 14, 1],
    [1, 15, 105, 455, 1365, 3003, 5005, 6435, 6435, 5005, 3003, 1365, 455, 105, 15, 1],
    [1, 16, 120, 560, 1820, 4368, 8008, 11440, 12870, 11440, 8008, 4368, 1820, 560, 120, 16, 1],
    [1, 17, 136, 680, 2380, 6188, 12376, 19448, 24310, 24310, 19448, 12376, 6188, 2380, 680, 136, 17, 1],
    [1, 18, 153, 816, 3060, 8568, 18564, 31824, 43758, 48620, 43758, 31824, 18564, 8568, 3060, 816, 153, 18, 1],
    [1, 19, 171, 969, 3876, 11628, 27132, 50388, 75582, 92378, 92378, 75582, 50388, 27132, 11628, 3876, 969, 171, 19, 1],
    [1, 20, 190, 1140, 4845, 15504, 38760, 77520, 125970, 167960, 184756, 167960, 125970, 77520, 38760, 15504, 4845, 1140, 190, 20, 1]
];

// step 2: a function that builds out the LUT if it needs to.
export function binomial(n: number, k: number) {
    while (n >= binomials.length) {
        let s = binomials.length;
        let nextRow = [];
        nextRow[0] = 1;
        for (let i = 1, prev = s - 1; i < s; i++) {
            nextRow[i] = binomials[prev][i - 1] + binomials[prev][i];
        }
        nextRow[s] = 1;
        binomials.push(nextRow);
    }
    return binomials[n][k];
}


export function randomColorHexString() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * 
 * @param p5 
 * @param text text which contains '{textWhichShouldBeSubscripted}'
 * @param x 
 * @param y 
 */
export function renderTextWithSubscript(p5: p5, text: string, x: number, y: number) {
    p5.push();
    p5.textAlign(p5.LEFT, p5.CENTER);

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

/**
 * 
 * @param noOfValues the desired length of the array
 * @param begin first desired value in array (inclusive)
 * @param end last desired value in array (inclusive)
 * @returns 
 */
export function createArrayOfEquidistantAscendingNumbersInRange(noOfValues: number, begin: number, end: number): number[] {
    return [...Array(noOfValues).keys()].map(i => begin + (i / (noOfValues - 1)) * (end - begin));
}

/**
 * Emulates Python's built-in range() function (stolen from https://stackoverflow.com/a/8273091/13727176)
 * @param start the start of the range (if only parameter provided this the stop value (exclusive))
 * @param stop the end of the range (exclusive)
 * @param step the step size. If negative, the range starts at stop and ends at start (each value gets decremented by step)
 * @returns an array with the desired range of numbers
 */
export function range(start: number, stop?: number, step?: number) {
    if (stop == undefined) {
        stop = start;
        start = 0;
    }

    if (step == undefined) step = 1;

    //invalid parameter combinations
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    let result = [];
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};

/**
* Returns the index of the last element in the array where predicate is true, and -1
* otherwise. Copied from https://stackoverflow.com/a/53187807/13727176.
* @param array The source array to search in
* @param predicate find calls predicate once for each element of the array, in descending
* order, until it finds one where predicate returns true. If such an element is found,
* findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
*/
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
        if (predicate(array[l], l, array))
            return l;
    }
    return -1;
}

export function colorsTooSimilar(colorA: p5.Color, colorB: p5.Color) {
    let colAAsRGBAObj = extractColorChannelsFromRGBAString(colorA.toString());
    let colBAsRGBAObj = extractColorChannelsFromRGBAString(colorB.toString());

    //for some reason p5 sets alpha to values between 0 to 1 by default, so we map to range [0, 255]
    if (colAAsRGBAObj.a <= 1 && colBAsRGBAObj.a <= 1) {
        colAAsRGBAObj.a = colAAsRGBAObj.a * 255;
        colBAsRGBAObj.a = colBAsRGBAObj.a * 255;
    }

    const colAVals = Object.values(colAAsRGBAObj);
    const colBVals = Object.values(colBAsRGBAObj);
    return !colAVals.some((v, i) => Math.abs(v - colBVals[i]) > 70);
}

//inspired by: https://stackoverflow.com/a/596243/13727176
/**
 * Note: currently only takes into account RGB channels, alpha is ignored
 * 
 * @returns value in range [0, 255], while 0 is the darkest and 255 is the lightest
 */
export function luminanceFromRGBAStr(rgbaStr: string): number {
    const { r, g, b } = extractColorChannelsFromRGBAString(rgbaStr);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Note: currently only takes into account RGB channels, alpha is ignored
 * 
 * @returns value in range [0, 255], while 0 is the darkest and 255 is the lightest
 */
export function luminanceFromP5Color(color: p5.Color): number {
    const rgbaStr = color.toString();
    return luminanceFromRGBAStr(rgbaStr);
}

export function addParagraphWithGivenContentToHtmlElementWithId(id: string, pContent: string): HTMLParagraphElement | undefined {
    const element = document.getElementById(id);
    if (element) {
        const p = document.createElement('p');
        p.innerHTML = pContent;
        element.appendChild(p);
        return p;
    }
    else console.warn(`HTML element with id ${id} not found`);
}


export class FrameRateMonitor implements Drawable {
    constructor(private p5: p5) { }

    draw(): void {
        this.p5.text(`FPS: ${this.p5.frameRate().toFixed(2)}`, 20, 20);
    }
}