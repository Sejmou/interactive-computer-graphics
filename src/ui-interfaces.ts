export interface Drawable {
    draw(): void
}

export interface Clickable {
    handlePressed(): void,
    handleReleased(): void
}

export interface Draggable {
    hovering: boolean,
    dragging: boolean,
    handleMoved(): void
}

export function isClickable(object: any): object is Clickable {
    return ('handleMousePressed' in object) && (typeof object.handleMousePressed === 'function') &&
        ('handleMouseReleased' in object) && (typeof object.handleMouseReleased === 'function');
}

export function isHoverable(object: any): object is Draggable {
    return ('handleMouseMoved' in object) && (typeof object.handleMouseMoved === 'function');
}