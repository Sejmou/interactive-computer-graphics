import p5 from "p5";
import { Observer } from "../../../utils/interactivity/observer-pattern";
import { DemoChange, CurveDemo } from "../abstract-base/demo";



/**
 * Gives the user the ability to modify the value of the curve parameter t with a slider and also animate things with play/rewind buttons (controlling animation + animation speed)
 */
export class ControlsForParameterT implements Observer<DemoChange> {
    private baseAnimationSpeedPerFrame = 0.005;

    /**
     * needed so that animation keeps same speed, even if interval for t becomes larger or smaller
     */
    private speedCompensationForSizeOfTInterval: number;
    private static animationSpeedMultipliers = [-4, -2, -1.5, -1, -0.5, -0.25, -0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 4];
    private currAnimationSpeedMultiplierIndex = ControlsForParameterT.animationSpeedMultipliers.findIndex(_ => _ === 1);

    private controlsForTContainer: p5.Element;
    private sliderLabel: p5.Element;
    private slider: p5.Element;
    private playPauseButton: p5.Element;
    private fasterButton: p5.Element;
    private slowerButton: p5.Element;

    public set visible(visible: boolean) {
        this.controlsForTContainer.style('display', visible ? 'flex' : 'none');
    };

    private set animationRunning(newVal: boolean) {
        this._animationRunning = newVal;
        if (this._animationRunning)
            this.playPauseButton.html('<span class="material-icons">pause</span>');
        else
            this.playPauseButton.html('<span class="material-icons">play_arrow</span>');
    }

    private get animationRunning(): boolean {
        return this._animationRunning;
    }
    private _animationRunning: boolean = false;


    constructor(private p5: p5, private demo: CurveDemo, parentContainerId?: string, baseAnimationSpeedMultiplier?: number) {
        this.speedCompensationForSizeOfTInterval = this.demo.tMax - this.demo.tMin;

        this.controlsForTContainer = p5.createDiv();

        if (parentContainerId)
            this.controlsForTContainer.parent(parentContainerId);
        this.controlsForTContainer.class('flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select full-width');
        this.controlsForTContainer.id('controls-for-t');


        this.sliderLabel = p5.createSpan(`t: ${this.demo.t.toFixed(2)}`);
        this.sliderLabel.parent(this.controlsForTContainer);

        this.slider = this.createSlider();

        this.slowerButton = p5.createButton('<span class="material-icons">fast_rewind</span>');
        this.slowerButton.parent(this.controlsForTContainer);
        this.slowerButton.mouseClicked(() => this.rewindClicked());

        this.playPauseButton = p5.createButton('<span class="material-icons">play_arrow</span>');
        this.playPauseButton.parent(this.controlsForTContainer);
        this.playPauseButton.mouseClicked(() => this.animationRunning = !this.animationRunning);

        demo.subscribe(this);
        this.updateVisibility();


        this.fasterButton = p5.createButton('<span class="material-icons">fast_forward</span>');
        this.fasterButton.parent(this.controlsForTContainer);
        this.fasterButton.mouseClicked(() => this.fastForwardClicked());

        if (baseAnimationSpeedMultiplier)
            this.baseAnimationSpeedPerFrame *= baseAnimationSpeedMultiplier;
    }

    private createSlider(): p5.Element {
        const slider = this.p5.createSlider(this.demo.tMin, this.demo.tMax, this.demo.t, 0);
        slider.style('flex-grow', '2');
        slider.mousePressed(() => this.animationRunning = false);
        slider.parent(this.controlsForTContainer);
        return slider;
    }

    update(data: DemoChange): void {
        if (data === 'controlPointsChanged' || data === 'showCurveDrawingVisualizationChanged')
            this.updateVisibility();
        if (data === 'rangeOfTChanged') {
            this.speedCompensationForSizeOfTInterval = this.demo.tMax - this.demo.tMin;
            this.updateSliderRange();
        }
    }
    private updateVisibility() {
        this.visible = this.demo.showCurveDrawingVisualization && this.demo.valid;
    }

    private updateSliderRange() {
        this.slider.remove();
        this.slider = this.createSlider();

        //this is necessary to preserve the order of elements in the controlsContainer
        this.slowerButton.parent(this.controlsForTContainer);
        this.playPauseButton.parent(this.controlsForTContainer);
        this.fasterButton.parent(this.controlsForTContainer);
    }

    public updateT() {
        if (this.animationRunning) {
            this.demo.t += (this.baseAnimationSpeedPerFrame * this.speedCompensationForSizeOfTInterval * ControlsForParameterT.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]);
        }
        else
            this.demo.t = +this.slider.value();
    }

    public updateSlider() {
        this.sliderLabel.html(`t: ${this.demo.t.toFixed(2)}`);
        this.slider.value(this.demo.t);
    }

    private fastForwardClicked() {
        this.animationRunning = true;
        if (this.currAnimationSpeedMultiplierIndex < ControlsForParameterT.animationSpeedMultipliers.length - 1)
            this.currAnimationSpeedMultiplierIndex++;
    }

    private rewindClicked() {
        this.animationRunning = true;
        if (this.currAnimationSpeedMultiplierIndex > 0)
            this.currAnimationSpeedMultiplierIndex--;
    }
}
