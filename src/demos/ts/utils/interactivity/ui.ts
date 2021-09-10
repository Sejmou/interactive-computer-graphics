/**
 * An element which can be rendered onto a p5 canvas (or needs to be updated anytime the canvas's draw() is called)
 */
export interface Drawable {
    draw(): void
}

/**
 * an element that can be part of a p5 canvas and can be clicked on (handling mouse events)
 */
export interface Clickable {
    handleMousePressed(): void,
    handleMouseReleased(): void
}

/**
 * an element that can be part of a p5 canvas and is able to/has to handle touch events
 */
export interface Touchable {
    handleTouchStarted(): void,
    handleTouchReleased(): void
}

/**
 * an element that can be part of the p5 canvas and can be dragged with a mouse cursor or via touchscreen
 */
export interface Draggable {
    readonly hovering: boolean,
    readonly dragging: boolean
}

/**
 * An element that can be part of the p5 canvas and reacts to mouse hover events in some way
 */
export interface Hoverable {
    readonly hovering: boolean
}

/**
 * An element that supports some kind of 'edit' functionality.
 * It changes its behavior (and appearance), giving the user some kind of edit functionality if it is editable.
 */
export interface Editable {
    /**
     * If true, controls for editing the element will show up on user interaction
     */
    editable: boolean
}

/**
 * An element that can be part of the p5 canvas and adapts itself to the current size of the canvas on every canvas resize
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
    return ('canvasResized' in object) && (typeof object.canvasResized === 'function');
}

/**
 * An element that displays its position coordinates in some way
 */
export interface showsPositionCoordinates {
    /**
     * The way the position coordinates should be displayed
     */
    positionDisplayMode: PositionDisplayMode;
}

export type PositionDisplayMode = 'normalized coordinates' | 'pixel coordinates';