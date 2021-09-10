export function addTextAsParagraphToElement(elementId: string, pContent: string) {
    const element = document.getElementById(elementId);
    if (element) {
        const p = document.createElement('p');
        p.innerHTML = pContent;
        element.appendChild(p);
    }
    else console.warn(`HTML element with id ${elementId} not found`);
}


