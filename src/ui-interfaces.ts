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

export function isClickable(object: any): object is Clickable {
    return ('handleMousePressed' in object) && (typeof object.handleMousePressed === 'function') &&
        ('handleMouseReleased' in object) && (typeof object.handleMouseReleased === 'function');
}

export function isHoverable(object: any): object is Draggable {
    return ('handleMouseMoved' in object) && (typeof object.handleMouseMoved === 'function');
}