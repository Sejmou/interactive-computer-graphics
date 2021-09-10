import './bezier.scss';
import { BezierDemo } from "../ts/demo-material/curves/bezier/demo";
import { Sketch } from '../ts/utils/interactivity/p5/sketch';
import { MyObserver } from "../ts/utils/interactivity/my-observable";
import { DemoChange } from '../ts/demo-material/curves/base/demo';
import { addTextAsParagraphToElement } from "../ts/utils/dom";



const demoContainerId = 'demo';
const descriptionContainerId = 'demo-description-container';
addTextAsParagraphToElement(descriptionContainerId, 'Get an intuition for Bézier curves (that are used in many graphics applications for drawing nice, smooth curves) interactively!');


async function createDemo() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    const demo = sketch.add((p5, containerId) => new BezierDemo(p5, containerId));
    new BezierDemoGuide(demo, demoContainerId);
    document.querySelector('#cover')?.remove();
};

createDemo();




class BezierDemoGuide implements MyObserver<DemoChange> {
    private textBoxContainer: HTMLDivElement;
    private id: string = 'demo-guide';

    private set visible(visible: boolean) {
        this.textBoxContainer.style.display = visible ? 'block' : 'none';
    }

    constructor(private demo: BezierDemo, demoContainerId: string) {
        this.textBoxContainer = document.createElement('div');
        this.textBoxContainer.id = this.id;
        this.visible = false;

        document.getElementById(demoContainerId)?.insertAdjacentElement('afterend', this.textBoxContainer);

        //we want to get notified if the number of control points changes
        this.demo.subscribe(this);
    }

    update(change: DemoChange) {
        if (change === 'controlPointsChanged') {
            const numOfControlPoints = this.demo.controlPoints.length;
            this.visible = numOfControlPoints > 0;
            this.textBoxContainer.innerHTML = this.createParagraphsHTMLFromMessage(this.getMessage(numOfControlPoints));
            //let MathJax convert any LaTeX syntax in the textbox to beautiful formulas (can't pass this.textBox as it is p5.Element and p5 doesn't offer function to get 'raw' DOM node)
            MathJax.typeset([`#${this.id}`]);
        }
    }

    private createParagraphsHTMLFromMessage(message: string) {
        const paragraphContent = message.split('\n\n');
        const paragraphs = paragraphContent.map(str => `<p>${str.trim().replace('\n', '<br>')}</p>`);
        return paragraphs.join('');
    }

    private getMessage(numOfControlPoints: number): string {
        //using String.raw``templateStringContent` allows use of backslashes without having to escape them (so that MathJax can parse LaTeX syntax)
        switch (numOfControlPoints) {
            case 0:
                return "";
            case 1:
                return String.raw`A single point on its own is quite boring, right?
                Add another one by clicking/tapping the '+'-icon of the point!`;
            case 2:
                return String.raw`Great, now we have two points! We can connect them with a line. But how could that work? 🤔

                One way is to "mix" the positions of the two points using linear interpolation with a parameter, let's call it \( t \).
                \( t \) ranges from 0 to 1. The bigger \( t \), the more we move from the first point to the second.
                So, if \( t = 0 \) we are at the first point, if \( t = 0.5 \) we are right between the first and second point, and at \( t = 1 \) we reach the second point.

                In math terms, we could call this line a <em>linear Bézier curve</em> \(B(t)\) and get the point on the line between the first point (\( P_0 \)) and the second one (\( P_1 \)) with the following formula:
                \[ B(t) = t \cdot P_0 + (1-t) \cdot P_1 \]

                Feel free to experiment with the controls for \( t \), if you're ready add another point, we will then get to know the actual Bézier <em>curves</em> (not just lines) :)`;
            case 3:
                return String.raw`What you are seeing now is a <em>quadratic</em> Bézier curve. Notice that by moving the points you added, you can change the shape of this nice, smooth curve.
                Because those points can be used to "control" the Bézier curve, they are called the <em>control points</em> of the Bézier curve.

                The weird looking yellow lines and dots between the control points that move as \( t \) changes are a visualization of the so-called <em>De Casteljau algorithm</em>.

                The algorithm is used for drawing Bézier curves. It works like this: we interpolate between each of the adjacent control points with the parameter \( t \), just like we did when we only had two points.

                The interpolations produce two new points on the lines between the control points. By interpolating between those two points again, we get another, single point: the position of the point on the Bézier curve!
                
                <br>If you want to derive the formula for the quadratic Bézier curve, have a look at <a href="https://en.wikipedia.org/wiki/B%C3%A9zier_curve">Wikipedia</a>.<br>
                
                <br>Anyway, if you're ready, try adding another control point!`;
            case 4:
                return String.raw`You were brave and added another point? Congratulations, you have created a cubic Bézier curve! Now you have even more control over the shape of the curve.

                Feel free to add as many additional control points as you wish, it just works!
                `
            default:
                return String.raw`As you can see, the De Casteljau algorithm works with arbitrary numbers of control points.

                Notice, however, that it is quite difficult to make changes to the shape of the curve, if we have lots of points.

                Each control point has "global control" on the shape of the curve - that means, if we move, add, or remove a single point, it may impact the whole curve shape significantly.<br>
                
                Also, the computation of Bézier curves of higher degrees quickly becomes <em>very</em> computationally expensive as the number of control points increases.

                Luckily, there is a solution for those problems of Bézier curves: B-Spline curves!`;
        }
    }
}