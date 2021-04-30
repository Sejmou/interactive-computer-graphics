/**
 * An element which can be rendered onto a p5 canvas (or needs to be updated anytime the canvas's draw() is called)
 */
export interface Drawable {
    draw(): void
}

/**
 * an element which can be clicked on (handling mouse events)
 */
export interface Clickable {
    handleMousePressed(): void,
    handleMouseReleased(): void
}

/**
 * an element which is able to/has to handle touch events
 */
export interface Touchable {
    handleTouchStarted(): void,
    handleTouchReleased(): void
}

/**
 * an element which can be dragged with a mouse cursor or via touchscreen
 */
export interface Draggable {
    readonly hovering: boolean,
    readonly dragging: boolean
}

/**
 * An element which reacts to mouse hover events in some way
 */
export interface Hoverable {
    readonly hovering: boolean
}

/**
 * An element which supports some kind of 'edit' functionality to e.g. change its appearance/properties
 */
export interface Editable {
    /**
     * If true, controls for editing the element will show up on user interaction
     */
    editable: boolean
}

/**
 * An element which adapts itself to the current width of the canvas
 */
export interface Responsive {
    canvasResized(): void
}

export function isClickable(object: any): object is Clickable {
    return ('handleMousePressed' in object) && (typeof object.handleMousePressed === 'function') &&
        ('handleMouseReleased' in object) && (typeof object.handleMouseReleased === 'function');
}

export function isDraggable(object: any): object is Draggable {
    return ('hovering' in object) && (typeof object.hovering === 'boolean') &&
        ('dragging' in object) && (typeof object.dragging === 'boolean');
}

export function isTouchable(object: any): object is Touchable {
    return ('handleTouchStarted' in object) && (typeof object.handleTouchStarted === 'function') &&
        ('handleTouchReleased' in object) && (typeof object.handleTouchReleased === 'function');
}

export function isResponsive(object: any): object is Responsive {
    return ('windowResized' in object) && (typeof object.windowResized === 'function');
}

//Those interfaces might be overkill for my use case, but nvm
//Initial goal: notify "users" of my DragVertex class (like DragPolygon or BezierCurve) whenever the delete or add button of a DragVertex they use has been clicked
//The observer pattern allows an object (observable) to notify several other entities who explicitly stated that they want to get notified when it changes (its observers) whenever it changes state
//Advantage: observers don't have to constantly check for changes, observable has reference to observers and can simply call their update() method
// => the observable pushes changes ONLY and IMMEDIATELY after a state change occured, observers don't have to regularly poll observable for state changes
//not sure if the pattern is really the right one for my use case, as the observer pattern is great for one to many relationships (one observable, many observers)

//adding 'My' prefix so that it is clear that I don't user rxjs or anything similar
export interface MyObservable<T> {
    subscribe(observer: MyObserver<T>): void,
    unsubscribe(observer: MyObserver<T>): void,

    /**
     * notify all observers of a certain action which the Observable has taken and the changes caused by that
     * @param data data providing context to what happened so that Observers can react accordingly
     */
    notifyObservers(data: T): void
}

export interface MyObserver<T> {
    /**
     * Called by the observable which the observer listens to if it wants to inform the observer that some state change occured
     * Typically this would happen in the observable's notify() method
     * @param data data providing context to what changed
     */
    update(data: T): void
}


export interface Container<T> {
    /**
     * 
     * @param element element after which a new element should be added (if the provided element is part of container)
     */
    addElementAfter(element: T): void,
    /**
     * 
     * @param element element which should be removed from the container (if it is part of the container)
     */
    remove(element: T): void
}

export interface ContainerElement<T> {
    /**
     * 
     * @param container container which the element should become part of
     */
    assignTo(container: Container<T>): void
}


export type PositionDisplayMode = 'absolute' | 'relative to canvas';