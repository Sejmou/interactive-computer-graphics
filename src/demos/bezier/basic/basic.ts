import './basic.scss';
import { BezierDemo, BezierDemoChange } from "../../ts/bezier-curve";
import { Sketch } from '../../ts/sketch';
import { MyObserver } from '../../ts/ui-interfaces';



const demoContainerId = 'demo';

async function createDemo() {
    const sketch = new Sketch(demoContainerId);
    await sketch.create();
    const demo = sketch.add((p5, containerId) => new BezierDemo(p5, containerId));
    new BezierDemoGuide(demo, demoContainerId);
    document.querySelector('#cover')?.remove();
};

createDemo();




class BezierDemoGuide implements MyObserver<BezierDemoChange> {
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

        //we want to get notified if the number of control vertices changes
        this.demo.subscribe(this);
    }

    update(change: BezierDemoChange) {
        if (change === 'controlVerticesChanged') {
            const numOfControlVertices = this.demo.controlVertices.length;
            this.visible = numOfControlVertices > 0;
            this.textBoxContainer.innerHTML = this.createParagraphsHTMLFromMessage(this.getMessage(numOfControlVertices));
            //let MathJax convert any LaTeX syntax in the textbox to beautiful formulas (can't pass this.textBox as it is p5.Element and p5 doesn't offer function to get 'raw' DOM node)
            MathJax.typeset([`#${this.id}`]);
        }
    }

    private createParagraphsHTMLFromMessage(message: string) {
        const paragraphContent = message.split('\n\n');
        const paragraphs = paragraphContent.map(str => `<p>${str.trim().replace('\n', '<br>')}</p>`);
        return paragraphs.join('');
    }

    private getMessage(numOfControlVertices: number): string {
        //using String.raw``templateStringContent` allows use of backslashes without having to escape them (so that MathJax can parse LaTeX syntax)
        switch (numOfControlVertices) {
            case 0:
                return "";
            case 1:
                return String.raw`A single point on its own is quite boring, right?
                Add another one by clicking/tapping the '+'-icon of the point!`;
            case 2:
                return String.raw`Great, now we have two points, yay! We can connect them with a line. But how could that work? 🤔

                One way is to "mix" the positions of the two points using linear interpolation with a parameter, let's call it \( t \).
                \( t \) ranges from 0 to 1. The bigger \( t \), the more we move from the first point to the second.
                So, if \( t = 0 \) we are at the first point, if \( t = 0.5 \) we are right between the first and second point, and at \( t = 1 \) we reach the second point.

                Feel free to experiment with the controls for \( t \), if you're ready add another point, we will then get to know the actual Bézier curves :)`;
            case 3:
                return String.raw`What you are seeing now is a quadratic bézier curve. Notice that by moving the points you added, you can change the shape of this nice, smooth curve.
                Because those points can be used to "control" the bézier curve, they are called the "control points" of the bézier curve.

                The weird looking yellow lines and dots between the control points that move as \( t \) changes are a visualization of the so-called "De Casteljau algorithm".
                The algorithm is used for drawing bézier curves. It works like this: we interpolate between each of the adjacent control points with the parameter \( t \), just like we did when we only had two points.
                The interpolations produce two new points on the lines between the control points. By interpolating between those two points again, we get another, single point: the position of the point on the bézier curve!`;
            case 4:
                return String.raw`You were brave and added another point? Congratulations, you have created a cubic bézier curve! Now you have even more control over the shape of the curve.
                Feel free to add as many additional control points as you wish, it just works!
                `
            default:
                return String.raw`As you can see, the De Casteljau algorithm works with arbitrary numbers of control points.
                Notice, however, that it is quite difficult to make changes to the shape of the curve, if we have lots of points.
                Each control point has "global control" on the shape of the curve - that means, if we add a single point, it may impact the whole curve shape significantly.
                
                Also, the computation of bezier curves of higher degrees quickly becomes VERY computationally expensive as the number of control points increases.
                Luckily, there is a solution for those problems of bézier curves: b-spline curves!`;
        }
    }
}