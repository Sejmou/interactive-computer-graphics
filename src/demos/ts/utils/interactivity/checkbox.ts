import { Subject, Observer } from "./observer-pattern";


/**
 * Creates a checkbox on the page. The user can define what should happen when the checkbox is toggled.
 * Also, the checkbox subscribes to a Subject. whenever it emits a change, the checkbox updates itself using a user-defined getter and checks whether it should be hidden (also using user-defined function)
 *
 *
 * Note: This is probably unnecessarily complicated but I couldn't come up with a simpler solution at the time I wrote this code
 */
export class BooleanPropCheckbox<T extends Subject<U>, U> implements Observer<U> {
    private objectToSubscribeTo: T;
    private label: HTMLLabelElement;
    private checkBox: HTMLInputElement;

    private getCurrValOfPropToModify: () => boolean;

    private shouldCheckBoxBeVisible: (objectToSubscribeTo: T) => boolean;

    constructor(config: CheckboxConfig<T>) {
        const { objectToSubscribeTo, labelText, getCurrValOfPropToModify, onUserChangedCheckboxChecked, shouldCheckboxBeVisible, parentContainerId, tooltipText } = config;

        this.getCurrValOfPropToModify = getCurrValOfPropToModify;
        this.shouldCheckBoxBeVisible = shouldCheckboxBeVisible;

        this.objectToSubscribeTo = objectToSubscribeTo;
        this.objectToSubscribeTo.subscribe(this);

        this.checkBox = document.createElement('input');
        this.checkBox.type = 'checkbox';
        this.checkBox.className = 'filled-in'; // apply different Materialize style
        this.checkBox.checked = getCurrValOfPropToModify();
        const labelTextSpanEl = document.createElement('span');
        labelTextSpanEl.innerText = labelText;

        this.label = document.createElement('label');
        this.label.style.display = 'block'; // label elements are inline by default, we don't want that
        this.label.appendChild(this.checkBox);
        this.label.appendChild(labelTextSpanEl);

        if (tooltipText) {
            this.label.setAttribute('title', tooltipText);
        }

        this.checkBox.addEventListener('change', () => onUserChangedCheckboxChecked(this.checkBox.checked));

        this.updateCheckboxVisibility(this.shouldCheckBoxBeVisible(this.objectToSubscribeTo));

        if (parentContainerId) {
            const parentContainer = document.getElementById(parentContainerId);
            if (parentContainer) {
                parentContainer.appendChild(this.label);
                return;
            }
            console.warn(`parent container with id '${parentContainerId}' for checkbox that sets '${labelText}' not found`);
        }
        else {
            console.warn(`no parent container for checkbox that sets '${labelText}' provided`);
        }
        document.body.appendChild(this.label);
    }

    // We should get the current values that we are interested in here, but we don't with the current code architecture...
    // So the only thing we could do here would be to ignore certain changes for efficiency reasons, but who cares...
    // TODO: clean up this mess some day when I'm wiser...
    update(data: U): void {
        this.checkBox.checked = this.getCurrValOfPropToModify();
        this.updateCheckboxVisibility(this.shouldCheckBoxBeVisible(this.objectToSubscribeTo));
    }

    private updateCheckboxVisibility(visible: boolean) {
        if (visible)
            this.label.style.removeProperty('visibility');
        else
            this.label.style.visibility = 'hidden';
    }

}

export interface CheckboxConfig<T extends Subject<any>> {
    /**
     * the object whose changes should be listened to (for determining whether checkbox should be visible)
     */
    objectToSubscribeTo: T;

    /**
     * the text of the label for the checkbox
     */
    labelText: string;

    /**
     * gets the current value of the property that should be toggled by the checkbox
     */
    getCurrValOfPropToModify: () => boolean;

    /**
     * defines what should happen if the user changed the checkbox state
     */
    onUserChangedCheckboxChecked: (newCheckedState: boolean) => void;

    /**
     * Called whenever objectToSubscribeTo notifies the checkbox of a change
     * Properties of the objectToSubscribeTo can then be checked to decide if the checkbox should still be shown
     * Return true here whenever the checkbox should be visible and false otherwise
     */
    shouldCheckboxBeVisible: (objectToSubscribeTo: T) => boolean;

    tooltipText?: string;

    /**
     * The ID of the container where the checkBox should be created
     *
     * If not provided, checkbox is appended to body
     */
    parentContainerId?: string;
}
