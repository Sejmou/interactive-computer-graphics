import { MyObservable, MyObserver } from "./ui";

// ------------------------ DOM helpers ----------------------------

export function addTextAsParagraphToElement(elementId: string, pContent: string): HTMLParagraphElement | undefined {
    const element = document.getElementById(elementId);
    if (element) {
        const p = document.createElement('p');
        p.innerHTML = pContent;
        element.appendChild(p);
        return p;
    }
    else
        console.warn(`HTML element with id ${elementId} not found`);
}

export interface SettingsCheckboxConfig<T, U extends MyObservable<V>, V> {
    /**
     * the object whose boolean property should be toggled with the checkbox
     */
    objectToModify: T;

    /**
     * the object whose changes should be listened to
     */
    objectToSubscribeTo: U;

    /**
     * the text of the label for the checkbox
     */
    labelText: string;

    /**
     * gets the current value of the object property that should be toggled by the checkbox
     */
    getCurrValOfPropToModify: (objectToModify: T) => boolean;

    /**
     * tells the checkbox whether it should be visible after it gets notified of an update
     * Called whenever objectToSubscribeTo notifies the checkbox of a change
     */
    showCheckBoxIf: (objectToSubscribeTo: U) => boolean;

    /**
     * sets the boolean property of the object that should be modified by this checkbox
     */
    setNewPropertyValue: (newValue: boolean, objectToModify: T) => void;

    /**
     * The ID of the container where the checkBox should be created
     */
    parentContainerId?: string;
}
/**
 * Creates a checkbox that modifies a boolean property of some object listening for changes to some observable. (modified object and subscribed object can also be the same object!)
 * Automatically subscribes to the Observable, a function defining if the modified object's checkbox should be visible (after the observed object emits some change event) can also be provided
 */

export class BooleanPropCheckbox<T, U extends MyObservable<V>, V> implements MyObserver<V> {
    private form: HTMLFormElement;
    private objectToModify: T;
    private objectToSubscribeTo: U;

    private showCheckBoxIf: (objectToSubscribeTo: U) => boolean;

    constructor(config: SettingsCheckboxConfig<T, U, V>) {
        const { objectToModify, objectToSubscribeTo, labelText, getCurrValOfPropToModify, setNewPropertyValue, showCheckBoxIf, parentContainerId } = config;
        this.objectToModify = objectToModify;
        this.showCheckBoxIf = showCheckBoxIf;

        this.objectToSubscribeTo = objectToSubscribeTo;
        this.objectToSubscribeTo.subscribe(this);

        const formFieldName = 'field';

        const checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.name = formFieldName;
        checkBox.checked = getCurrValOfPropToModify(this.objectToModify);
        checkBox.className = 'filled-in';
        const desc = document.createElement('span');
        desc.innerText = labelText;
        const label = document.createElement('label');
        label.appendChild(checkBox);
        label.appendChild(desc);
        this.form = document.createElement('form');
        this.form.appendChild(label);
        this.form.addEventListener('change', () => {
            setNewPropertyValue(new FormData(this.form).get(formFieldName) !== null, this.objectToModify);
            checkBox.checked = getCurrValOfPropToModify(this.objectToModify);
        });
        this.updateCheckboxVisibility(this.showCheckBoxIf(this.objectToSubscribeTo));

        if (parentContainerId) {
            const parentContainer = document.getElementById(parentContainerId);
            if (parentContainer) {
                parentContainer.appendChild(this.form);
                return;
            }
            console.warn(`parent container with id '${parentContainerId}' for checkbox that sets '${labelText}' not found`);
        }
        else {
            console.warn(`no parent container for checkbox that sets '${labelText}' provided`);
        }
        document.body.appendChild(label);
    }

    update(data: V): void {
        this.updateCheckboxVisibility(this.showCheckBoxIf(this.objectToSubscribeTo));
    }

    private updateCheckboxVisibility(visible: boolean) {
        if (visible)
            this.form.style.removeProperty('visibility');
        else
            this.form.style.visibility = 'hidden';
    }
}
