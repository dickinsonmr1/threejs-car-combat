export class DebugDivElementManager {

    debugDivElements: HTMLDivElement[] = [];
    currentY: number;
    paddingY: number;
    
    constructor(startY: number, paddingY: number) {
        this.currentY = startY;  
        this.paddingY = paddingY;      
    }

    addNamedElementPlaceholders(items: string[]) {
        
        items.forEach(item =>
        {
            this.currentY += this.paddingY;

            let divElement = this.generateDivElement(item, 25, this.currentY, "");
            this.debugDivElements.push(divElement);
        });        
    }

    addElement(name: string, text: string) {
        this.currentY += this.paddingY;

        let divElement = this.generateDivElement(name, 25, this.currentY, text);
        this.debugDivElements.push(divElement);
    }

    updateElementText(name: string, text: string) {
        let element = this.debugDivElements.find(x => x.id == name);
        
        if(element != null)
            element.innerHTML = text;
    }
   
    private generateDivElement(name: string, screenX: number, screenY: number, text: string): HTMLDivElement {
        let div = document.createElement('div');
        div.id = name;
        div.style.position = 'absolute';
        //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
        div.style.width = "200";
        div.style.height = "200";        
        div.style.color = "white";
        div.style.backgroundColor = "blue";
        div.innerHTML = text;
        div.style.left = screenX + 'px';
        div.style.top = screenY + 'px';
        div.style.visibility = 'visible';
        document.body.appendChild(div);
        
        return div;
    }

    showAllElements() {
        this.debugDivElements.forEach(x => {
            x.style.visibility = 'visible';
        });
    }

    hideAllElements() {
        this.debugDivElements.forEach(x => {
            x.style.visibility = 'hidden';
        });
    }

    toggleShowHideAllElements() {
        if(this.debugDivElements[0].style.visibility === 'visible') {
            this.hideAllElements();
            return;
        }
        if(this.debugDivElements[0].style.visibility === 'hidden') {
            this.showAllElements();
            return;
        }
    }
}