import p5 from "p5";
import { Clickable, Draggable, Drawable, isClickable, isDraggable, isResponsive, isTouchable, Responsive, Touchable } from "./sketch-content";

/**
 * Utitility class, wrapping p5's createCanvas() in a dedicated Sketch class.
 * It allows users to add new Drawables (classes implementing the custom Drawable interface used in this project) dynamically. 
 * It also mitigates the problem that p5 doesn't natively offer support for attaching multiple canvas event listeners (e.g. one per each created canvas object - also see https://discourse.processing.org/t/adding-event-handlers-to-sketch/21863)
 */
export class Sketch {
    private p5?: p5;

    /**
     * Creates a sketch that can display instances of class implementing the Drawable, Clickable, Touchable, Draggable or Responsive interfaces
     * 
     * @param parentContainerId ID of HTML tag/container in which the sketch and its canvas should be created
     * @param calcCanvasWidth function for (re-)calculating the height of the sketch's canvas
     * @param calcCanvasHeight function for (re-)calculating the height of the sketch's canvas
     * @param createBGColor define a function for setting the desired background color (called w/ p5 instance provided by p5 when setup() is called); return undefined if sketch should have transparent background
     * @param frameRate >= 0; if 0, sketch is only updated if redraw() is called!
     */
    constructor(
        private parentContainerId: string, public calcCanvasWidth?: (p5Instance: p5) => number, public calcCanvasHeight?: (p5Instance: p5) => number,
        private createBGColor: (p5: p5) => p5.Color | undefined = (p5) => p5.color(230), private frameRate?: number
    ) { }

    private drawables: Drawable[] = [];
    private clickables: Clickable[] = [];
    private touchables: Touchable[] = [];
    private draggables: Draggable[] = [];
    private responsiveThings: Responsive[] = [];

    private updateCursor = (p5Instance: p5) => {
        p5Instance.cursor(
            this.draggables.some(d => d.dragging) ? 'grabbing' : this.draggables.some(d => d.hovering) ? 'grab' : 'default'
        )
    };

    public get backgroundColor() {
        return this._backgroundColor;
    }
    private _backgroundColor: p5.Color | undefined;

    /**
     * Creates the sketch; Once the promise this method returns has resolved, the Sketch is ready and add() can be called on it to add Drawables.
     * At any moment before this, calling add() will not work as p5 is not configured yet!
     * 
     * @returns promise that resolves as soon as sketch was created (p5 instance is available to the sketch)
     */
    public async create(): Promise<void> {
        return new Promise((resolve) => {
            const setupSketch = (p5Instance: p5) => {
                if (this.frameRate) p5Instance.frameRate(this.frameRate);
                this._backgroundColor = this.createBGColor(p5Instance);

                const calcCanvasWidth = this.calcCanvasWidth ?? ((p5: p5) => Math.min(p5.windowWidth, 800));
                const calcCanvasHeight = this.calcCanvasHeight ?? ((p5: p5) => calcCanvasWidth(p5) * 0.75);

                p5Instance.setup = () => {
                    const canvas = p5Instance.createCanvas(calcCanvasWidth(p5Instance), calcCanvasHeight(p5Instance));
                    if (this.parentContainerId) canvas.parent(this.parentContainerId);

                    canvas.mousePressed(() => {
                        this.clickables.forEach(c => c.handleMousePressed());
                        //the following line somehow fixed the issue that grabbing cursor was not applied correctly, some weird timing issues behind the scenes lol
                        setTimeout(() => this.updateCursor(p5Instance), 0);
                        return false; // prevent any browser defaults
                    });

                    canvas.mouseReleased(() => {
                        this.clickables.forEach(c => c.handleMouseReleased());
                        this.updateCursor(p5Instance);
                    });

                    canvas.mouseMoved(() => {
                        this.updateCursor(p5Instance);
                        return false;
                    });

                    canvas.touchStarted(() => {
                        //calling this in setTimeout as p5Inst.touches is apparently not updated until after canvas.touchStarted is done executing
                        setTimeout(() => this.touchables.forEach(t => t.handleTouchStarted()));
                        return false; // prevent any browser defaults
                    });

                    canvas.touchEnded(() => {
                        this.touchables.forEach(t => t.handleTouchReleased());
                        return false; // prevent any browser defaults
                    });

                    const preventScrollIfDragging = (e: TouchEvent) => {
                        if (this.draggables.some(t => t.dragging)) e.preventDefault();
                    };

                    document.addEventListener('touchstart', preventScrollIfDragging, { passive: false });// https://stackoverflow.com/a/49582193/13727176
                    document.addEventListener('touchmove', preventScrollIfDragging, { passive: false });
                    document.addEventListener('touchend', preventScrollIfDragging, { passive: false });
                    document.addEventListener('touchcancel', preventScrollIfDragging, { passive: false });

                    //if 0 is provided as framerate, sketch should only update if redraw() is called explicitly
                    if (this.frameRate === 0) p5Instance.noLoop();

                    //everything set up, we can resolve the promise
                    resolve();
                };

                p5Instance.draw = () => {
                    if (this._backgroundColor !== undefined) p5Instance.background(this._backgroundColor);
                    else p5Instance.clear();
                    this.drawables.forEach(d => d.draw());
                };

                p5Instance.windowResized = () => {
                    // console.log('resizing', p5Instance.width, p5Instance.height);
                    p5Instance.resizeCanvas(calcCanvasWidth(p5Instance), calcCanvasHeight(p5Instance));
                    this.responsiveThings.forEach(r => r.canvasResized());
                }
            }

            //after this line this.p5 is defined, but the sketch actually hasn't been set up yet!
            //for example, width and height are still 0!
            //that's why we package the whole thing in a promise which is resolved on the last line of the p5.setup function we defined in setupSketch 
            this.p5 = new p5(setupSketch);
        });
    }

    /**
     * This function can be used after create() has resolved.
     * 
     * Any Drawable can be created and added to this Sketch by supplying a creator function for it to this method. Its draw() method will then be called everytime the Sketch's canvas is rerendered.
     * Per default, the framerate of the Sketch is 60 FPS, so draw() is then called 60 times a second.
     * 
     * If the Drawable provided also implements the Clickable, Touchable, Draggable or Responsive interface,
     * the respective event handling functions of each interface will be called anytime the canvas receives those triggering events.
     * 
     * For example, if the added Drawable implements the Clickable interface, each click on the canvas will be forwarded to it by calling its handleMousePressed() method.
     * 
     * @param creatorFunction a function returning a new instance of the Drawable that should be added to the sketch
     * @returns A reference to the created Drawable
     */
    public add<T extends Drawable>(creatorFunction: (p5Instance: p5, parentContainerId?: string) => T): T {
        if (!this.p5) {
            throw Error(`couldn't add Drawable, p5 instance of sketch not created yet!`);
        }
        const drawable = creatorFunction(this.p5, this.parentContainerId);
        this.drawables.push(drawable);
        if (isClickable(drawable)) this.clickables.push(drawable);
        if (isTouchable(drawable)) this.touchables.push(drawable);
        if (isDraggable(drawable)) this.draggables.push(drawable);
        if (isResponsive(drawable)) this.responsiveThings.push(drawable);
        return drawable;
    }
}