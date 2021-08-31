import p5 from "p5";
import { isNumeric } from "./math";

// --------------------------- Color ----------------------------

export function parseColorString(rgb: string): [number, number, number, number] {
    const [r, g, b, a] = rgb.replace(/[^\d,]/g, '').split(',').map(str => +str);
    return [r, g, b, a];
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
        color = color.substr(0, 7); //7 digits: '#' + rgba values (in range 00 to FF each)
    }

    let usePound = false;

    if (color[0] == "#") {
        color = color.slice(1);
        usePound = true;
    }

    const num = parseInt(color, 16);

    let r = (num >> 16) + amount;

    if (r > 255)
        r = 255;
    else if (r < 0)
        r = 0;

    let b = ((num >> 8) & 0x00FF) + amount;

    if (b > 255)
        b = 255;
    else if (b < 0)
        b = 0;

    let g = (num & 0x0000FF) + amount;

    if (g > 255)
        g = 255;
    else if (g < 0)
        g = 0;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16); // + (alpha? alpha.toString(16) : '');
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

export function extractColorChannelsFromRGBAString(rgbaStr: string): { r: number; g: number; b: number; a: number; } {
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


export function randomHexColorCode() {
    return Math.floor(Math.random() * 16777215).toString(16);
}


export function randomColorHexString() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

export function areColorsTooSimilar(colorA: p5.Color, colorB: p5.Color) {
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
