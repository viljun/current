import { Coordinates } from "./Coordinates.js";
import { FightView } from "./FightView.js";
import { Inventory } from "./Inventory.js";
export class FightMonsterButton {
    constructor(itemTakingSummary, inventory, selectedCoordinates, map) {
        this.itemTakingSummary = itemTakingSummary;
        this.inventory = inventory;
        this.selectedCoordinates = selectedCoordinates;
        this.map = map;
    }
    element() {
        var _a;
        const container = document.createElement("div");
        container.className = "message";
        const button = document.createElement("button");
        button.className = "button";
        button.textContent = "Fight " + this.itemTakingSummary.itemType.name;
        button.disabled = this.itemTakingSummary.missing.length > 0
            || ((_a = this.inventory.totalQuantities["heart"]) !== null && _a !== void 0 ? _a : 0) <= 0;
        button.onclick = () => {
            if (!this.map.isWithinTakingRange(this.selectedCoordinates)) {
                this.map.show({});
                return;
            }
            new FightView(this.itemTakingSummary, this.inventory, this.selectedCoordinates, this.map).open();
        };
        container.append(button);
        const text = this.itemTakingSummary.getTakeButtonText().additionalText;
        if (text !== "") {
            container.append(text);
        }
        return container;
    }
}
