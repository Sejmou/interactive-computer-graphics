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


//Those interfaces are probably overkill for my use case, but nvm
//Goal: notify "users" of my DragVertex class (like DragPolygon or BezierCurve) whenever the delete "button" (DeleteCircle) of a DragVertex they use has been clicked
//The observer pattern allows an object (observable) to notify several other entities who explicitly stated that they want to get notified when it changes (its observers) whenever it changes state
//Advantage: observers don't have to constantly check for changes, observable has reference to observers and can simply call their update() method
// => the observable pushes changes ONLY and IMMEDIATELY after a state change occured, observers don't have to regularly poll observable for state changes
//not sure if the pattern is really the right one for my use case, as the observer pattern is great for one to many relationships (one observable, many observers)

//adding 'My' prefix so that it is clear that I don't user rxjs or anything similar
export interface MyObservable {
    subscribe(observer: MyObserver): void,
    unsubscribe(observer: MyObserver): void,

    //notify all observers of a change
    notify(): void
}

export interface MyObserver {
    //called by the observable which the observer listens to if it wants to inform the observer that some state change occured
    //typically this would happen in the observable's notify() method
    update(): void
}


//don't know if the foloowing two interfaces make any sense at all lol


export interface MyTypedObservable<T> {
    subscribe(observer: MyObserverForType<T>): void,
    unsubscribe(observer: MyObserverForType<T>): void,

    //in this method, update() of observers should be called
    notify(): void
}

export interface MyObserverForType<T> {
    //don't know if this method is a good idea, but I figured it might be useful for my use case
    //handles notify() of one of the Observables
    //However, the observer also receives a reference to the instance which changed and whose changes he subscribed to 
    update(updatedObservable: T): void
}