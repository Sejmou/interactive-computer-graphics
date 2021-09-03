import { Drawable } from "../../../utils/ui";
import { CurveDemo } from "./demo";



export abstract class InfluenceVisualizerForActiveControlPoint implements Drawable {
    constructor(private demo: CurveDemo) { }

    draw(): void {
        if (this.demo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt)
            this.drawInfluenceOfCurrentlyActiveCtrlPt();
    }

    protected abstract drawInfluenceOfCurrentlyActiveCtrlPt(): void;
}
