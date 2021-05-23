import p5 from 'p5';
import { MyObserver } from '../ui-interfaces';
import { Curve, CurveDemo, CurveDrawingVisualization, DemoChange } from './base-curve';



export class BSplineDemo extends CurveDemo {
    /**
     * degree of Bèzier curve segments which the BSpline is built upon.
     * Also known as k in math literature. E.g. if k is 3, cubic Bèzier curves are used for "building" the B-Spline curve
     */
    private degree: number;

    private knotVector: number[];

    constructor(p5: p5, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        const tMin = 0;
        const tMax = 1;
        super(p5, tMin, tMax, parentContainerId, baseAnimationSpeedMultiplier);
        //after super() call this.tMin and this.tMax are defined and accessible from this subclass too
        //unfortunately, this.tMin and this.tMax can't be set directly before super() call

        this.degree = 3;
        this.knotVector = [];
        this.additionalCurveDegreeChangeHandling();
    }

    //called every time the curve degree changes
    protected additionalCurveDegreeChangeHandling() {
        this.updateKnotVector();
    }

    updateKnotVector() {
        // m = (# of knots in knotVector T) - 1
        // n = (# of control points) - 1
        // k = degree of curve
        // m = k + n + 1
        // e. g. for a cubic B-spline w/ 5 control points m = 3 + 4 + 1

        console.log('if this is reached, we are heading in the right direction!');
        const k = this.degree;
        //const n = this.
        //this.knotVector = this.
    }

    protected addCurve(): Curve {
        return new BSplineCurve(this.p5, this);
    }
    protected addCurveDrawingVisualization(): CurveDrawingVisualization {
        return new BSplineVisualization(this.p5, this);
    }
}



class BSplineCurve extends Curve {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo) {
        super(p5, bSplineDemo);
    }

    public draw() {
        //const basisFunctions = knotVector.forEach
        //N_{0,0} = 1 if t_0 <= t < t_1, else 0
    }
}



class BSplineVisualization extends CurveDrawingVisualization implements MyObserver<DemoChange> {
    //storing bSplineDemo twice, once as Demo so that code of abstract class works and once as BSplineDemo so that we can use its specific subclass properties
    //if anyone reads my comments and knows a better solution: let me know about it (there probably is a better way to do what I want lol)
    constructor(p5: p5, private bSplineDemo: BSplineDemo, color?: p5.Color, colorOfPointOnCurve?: p5.Color) {
        super(p5, bSplineDemo, color, colorOfPointOnCurve);
    }

    public draw(): void {
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged') { }
    }

}