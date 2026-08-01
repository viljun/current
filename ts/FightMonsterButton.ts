import { Coordinates }       from "./Coordinates.js";
import { FightView }         from "./FightView.js";
import { Inventory }         from "./Inventory.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { Map }               from "./Map.js";

export class FightMonsterButton {
    constructor(
        private itemTakingSummary: ItemTakingSummary,
        private inventory: Inventory,
        private selectedCoordinates: Coordinates,
        private map: Map,
    ) {}

    element(): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "message";
        const button = document.createElement("button");
        button.className = "button";
        button.textContent = "Fight " + this.itemTakingSummary.itemType.name;
        button.disabled = this.itemTakingSummary.missing.length > 0
            || (this.inventory.totalQuantities["heart"] ?? 0) <= 0;
        button.onclick = () => {
            if (!this.map.isWithinTakingRange(this.selectedCoordinates)) {
                this.map.show({});

                return;
            }
            new FightView(
                this.itemTakingSummary,
                this.inventory,
                this.selectedCoordinates,
                this.map,
            ).open();
        };
        container.append(button);

        const text = this.itemTakingSummary.getTakeButtonText().additionalText;
        if (text !== "") {
            container.append(text);
        }

        return container;
    }
}
