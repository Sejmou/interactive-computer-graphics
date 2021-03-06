/**
 * A container for elements of type T.
 */
export interface Container<T> {
    /**
     *
     * @param element element after which a new element should be added (if the provided element is part of container)
     */
    addElementAfter(element: T): void;
    /**
     *
     * @param element element which should be removed from the container (if it is part of the container)
     */
    remove(element: T): void;
}

/**
 * An element (note: should be of type T) that can be added to a container for elements of type T
 */
export interface ContainerElement<T> {
    /**
     *
     * @param container container which the element should become part of
     */
    assignTo(container: Container<T>): void;
}
