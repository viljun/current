import { Coordinates } from "./Coordinates.js";
import { FightView } from "./FightView.js";
import { Inventory } from "./Inventory.js";
export class FightMonsterButton {
    constructor(itemTakingSummary, inventory, selectedCoordinates, map, messageBox) {
        this.itemTakingSummary = itemTakingSummary;
        this.inventory = inventory;
        this.selectedCoordinates = selectedCoordinates;
        this.map = map;
        this.messageBox = messageBox;
    }
    element() {
        const container = document.createElement("div");
        container.className = "message";
        const button = document.createElement("button");
        button.className = "button";
        button.textContent = "Fight " + this.itemTakingSummary.itemType.name;
        button.disabled = this.itemTakingSummary.missing.length > 0;
        button.onclick = () => {
            if (!this.map.isWithinTakingRange(this.selectedCoordinates)) {
                this.map.show({});
                return;
            }
            new FightView(this.itemTakingSummary, this.inventory, this.selectedCoordinates, this.map, this.messageBox).open();
        };
        container.append(button);
        const text = this.itemTakingSummary.getTakeButtonText().additionalText;
        if (text !== "") {
            container.append(text);
        }
        return container;
    }
}
