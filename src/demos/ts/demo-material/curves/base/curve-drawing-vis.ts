import colors from "../../../../../global-styles/color_exports.scss";
import p5 from "p5";
import { Drawable } from "../../../utils/interactivity/ui";
import { CurveDemo } from "./demo";



/**
 * Visualizes how the curve of the curve demo is rendered onto the screen (e.g. for Bézier curves it demonstrates De Casteljau's algorithm)
 */
export abstract class CurveDrawingVisualization implements Drawable {
    protected color: p5.Color;
    protected colorOfPointOnCurve: p5.Color;
    public onlyDrawPointOnCurve: boolean = false;

    constructor(protected p5: p5, protected demo: CurveDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        this.color = color ?? p5.color('#E1B000');
        this.colorOfPointOnCurve = colorOfPointOnCurve ?? p5.color(colors.errorColor);
    }

    public abstract draw(): void;
}
