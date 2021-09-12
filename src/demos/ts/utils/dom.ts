/**
 * Adds a <p> tag containing custom text to an HTML element targeted by its ID (as child)
 * @param elementId ID of the HTML element
 * @param pContent the text to add
 */
export function addTextAsParagraphToElement(elementId: string, pContent: string) {
    const element = document.getElementById(elementId);
    if (element) {
        const p = document.createElement('p');
        p.innerHTML = pContent;
        element.appendChild(p);
    }
    else console.warn(`HTML element with id ${elementId} not found`);
}


