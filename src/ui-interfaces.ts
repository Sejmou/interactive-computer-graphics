export interface Drawable {
    draw(): void
}

export interface Clickable {
    handleMousePressed(): void,
    handleMouseReleased(): void
}

export interface Touchable {
    handleTouchStarted(): void,
    handleTouchReleased(): void
}

export interface Draggable {
    readonly hovering: boolean,
    readonly dragging: boolean
}

export interface Hoverable {
    readonly hovering: boolean
}

export interface Editable {
    editMode: boolean
}

export function isClickable(object: any): object is Clickable {
    return ('handleMousePressed' in object) && (typeof object.handleMousePressed === 'function') &&
        ('handleMouseReleased' in object) && (typeof object.handleMouseReleased === 'function');
}

export function isHoverable(object: any): object is Draggable {
    return ('handleMouseMoved' in object) && (typeof object.handleMouseMoved === 'function');
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
     * notify all observers of a 
     * @param action action which the observable can emit and its obervers can handle
     */
    notify(action: T): void
}

export interface MyObserver<T> {
    /**
     * Called by the observable which the observer listens to if it wants to inform the observer that some state change occured
     * Typically this would happen in the observable's notify() method
     * @param action one of a certain set of actions which the observer understands and it can react to
     */
    update(action: T): void
}


export type AddOrRemove = 'add' | 'remove';


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
    assign(container: Container<T>): void
}