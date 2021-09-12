//Initial goal: notify "users" of my DragVertex class (like DragPolygon or BezierCurve) whenever the delete or add button of a DragVertex they use has been clicked
//The observer pattern allows an object (called Subject) to notify several other entities who explicitly stated that they want to get notified when it changes (its observers) whenever it changes state
//Advantage: observers don't have to constantly check for changes, Subject has reference to observers and can simply call their update() method
// => the Subject pushes changes ONLY after a state change occured, observers don't have to regularly poll the Subject for state changes (e.g. by checking properties regularly etc.)

export interface Subject<T> {
    subscribe(observer: Observer<T>): void;
    unsubscribe(observer: Observer<T>): void;

    /**
     * notify all observers of certain changes that happened to a Subject
     * @param data data providing context to what happened so that Observers can react accordingly
     */
    notifyObservers(data: T): void;
}

export interface Observer<T> {
    /**
     * Called by the Subject that the Observer listens to
     * Typically this method would be called in the Subject's notify() method
     * @param change data giving some context to what changed
     */
    update(change: T): void;
}
