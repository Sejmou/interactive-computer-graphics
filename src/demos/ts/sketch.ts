import p5 from "p5";
import { BezierDemo } from "./bezier-curve";
import { Drawable, isClickable, isDraggable, isTouchable } from "./ui-interfaces";

//this is ugly as hell lol, sry
export class SketchFactory<T extends Drawable> {
    constructor(private createSketchContent: (p5Instance: p5, canvas: p5.Element, parentContainerId?: string) => T) { }


    createSketch(parentContainerId: string, onSketchContentCreated?: (sketchContent: T) => void) {
        const setupSketch = (p5Instance: p5) => {
            /**
             * the object which holds logic for what should be sketched
             */
            let sketchContent: T;
            const bgColor = p5Instance.color(230);

            function calcCanvasWidth() {
                return Math.min(p5Instance.windowWidth, 800);
            }

            function calcCanvasHeight() {
                return p5Instance.windowHeight * 0.6;
            }

            p5Instance.setup = () => {

                const canvas = p5Instance.createCanvas(calcCanvasWidth(), calcCanvasHeight());
                sketchContent = this.createSketchContent(p5Instance, canvas, parentContainerId);
                if (onSketchContentCreated) onSketchContentCreated(sketchContent);

                //only !== undefined if the sketchContent is Draggable
                let updateCursor: () => void;

                if (isDraggable(sketchContent)) {
                    //without this assignment typescript somehow can't infer that this._sketchContent is draggable? -> can't use this._sketchContent in p5Instance.cursor() below
                    const draggable = sketchContent;
                    updateCursor = () => p5Instance.cursor(draggable.dragging ? 'grabbing' : draggable.hovering ? 'grab' : 'default');

                    if (isTouchable(sketchContent)) {
                        const touchable = sketchContent;
                        canvas.touchStarted(() => {
                            //calling this in setTimeout as p5Inst.touches is apparently not updated until after canvas.touchStarted is done executing
                            setTimeout(() => {
                                touchable.handleTouchStarted();
                                //TODO: think about whether those two code lines below are even useful at all
                                //we can't really prevent touch-actions once they have already started (before .dragging is evaluated)...
                                if (!touchable.dragging) canvas.style('touch-action', 'auto');
                                else canvas.style('touch-action', 'none');
                            });
                            return false; // prevent any browser defaults
                        });

                        canvas.touchEnded(() => {
                            touchable.handleTouchReleased();
                            //TODO: think about whether those two code lines below are even useful at all
                            //we can't really prevent touch-actions once they have already started (before .dragging is evaluated)...
                            if (!touchable.dragging) canvas.style('touch-action', 'auto');
                            else canvas.style('touch-action', 'none');
                            return false; // prevent any browser defaults
                        });

                        const preventScrollIfDragging = (e: TouchEvent) => {
                            if (touchable.dragging) e.preventDefault();
                        };
                        document.addEventListener('touchstart', preventScrollIfDragging, { passive: false });// https://stackoverflow.com/a/49582193/13727176
                        document.addEventListener('touchmove', preventScrollIfDragging, { passive: false });
                        document.addEventListener('touchend', preventScrollIfDragging, { passive: false });
                        document.addEventListener('touchcancel', preventScrollIfDragging, { passive: false });
                    }
                }

                if (isClickable(sketchContent)) {
                    //similar to above, without this assignment typescript somehow can't infer that this._sketchContent is clickable?
                    const clickable = sketchContent;
                    canvas.mousePressed(() => {
                        clickable.handleMousePressed();
                        if (updateCursor) updateCursor();
                        return false; // prevent any browser defaults
                    });

                    canvas.mouseReleased(() => {
                        clickable.handleMouseReleased();
                        if (updateCursor) updateCursor();
                    });
                }

                canvas.mouseMoved(() => {
                    if (updateCursor) updateCursor();
                    return false;
                });

                document.querySelector('#cover')?.remove();
            };

            p5Instance.draw = () => {
                p5Instance.background(bgColor);
                if (sketchContent) sketchContent.draw();
            };

            p5Instance.windowResized = () => {
                p5Instance.resizeCanvas(calcCanvasWidth(), calcCanvasHeight());
            }
        }

        new p5(setupSketch);
    }
}

const createBezierSketch = (p5: p5, canvas: p5.Element, parentContainer?: string) => new BezierDemo(p5, canvas, parentContainer);
export const bezierSketchFactory: SketchFactory<BezierDemo> = new SketchFactory(createBezierSketch);