//Initial goal: notify "users" of my DragVertex class (like DragPolygon or BezierCurve) whenever the delete or add button of a DragVertex they use has been clicked
//The observer pattern allows an object (observable) to notify several other entities who explicitly stated that they want to get notified when it changes (its observers) whenever it changes state
//Advantage: observers don't have to constantly check for changes, observable has reference to observers and can simply call their update() method
// => the observable pushes changes ONLY and IMMEDIATELY after a state change occured, observers don't have to regularly poll observable for state changes
//not sure if the pattern is really the right one for my use case, as the observer pattern is great for one to many relationships (one observable, many observers)
//adding 'My' prefix so that it is clear that I don't user rxjs or anything similar

export interface MyObservable<T> {
    subscribe(observer: MyObserver<T>): void;
    unsubscribe(observer: MyObserver<T>): void;

    /**
     * notify all observers of a certain action which the Observable has taken and the changes caused by that
     * @param data data providing context to what happened so that Observers can react accordingly
     */
    notifyObservers(data: T): void;
}

export interface MyObserver<T> {
    /**
     * Called by the observable which the observer listens to if it wants to inform the observer that some state change occured
     * Typically this would happen in the observable's notify() method
     * @param data data providing context to what changed
     */
    update(data: T): void;
}
