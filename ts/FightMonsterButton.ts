import { Coordinates }       from "./Coordinates.js";
import { EncounterCard }     from "./EncounterCard.js";
import { EncounterText }     from "./EncounterText.js";
import { FightView }         from "./FightView.js";
import { Inventory }         from "./Inventory.js";
import { ItemExplanation }   from "./ItemExplanation.js";
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
        container.className =
            "message encounter-action encounter-action--fight";
        const identity = EncounterText.for(
            this.itemTakingSummary.itemType.name,
            this.selectedCoordinates.latitude,
            this.selectedCoordinates.longitude,
        );
        const itemDescription = ItemExplanation.element(
            this.itemTakingSummary.itemType.name,
            this.selectedCoordinates.latitude,
            this.selectedCoordinates.longitude,
            this.inventory.getAreaId(),
        );
        EncounterCard.show(
            identity.description,
            itemDescription,
            ItemExplanation.displayName(this.itemTakingSummary.itemType.name),
        );
        const statusText = this.itemTakingSummary.getFightStatusText();
        const cost = document.createElement("span");
        cost.className = "fight-cost";
        cost.textContent = statusText.beforeAction;
        cost.title = statusText.beforeAction;
        const button = document.createElement("button");
        button.className = "button";
        button.textContent = "Capture";
        const completeStatus = [
            statusText.beforeAction,
            "Capture",
            statusText.afterAction,
        ].filter(part => part !== "").join(" ");
        container.title = completeStatus;
        button.setAttribute("aria-label", completeStatus);
        button.disabled = this.itemTakingSummary.missing.length > 0;
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
        const reward = document.createElement("span");
        reward.className = "fight-reward";
        reward.textContent = statusText.afterAction;
        reward.title = statusText.afterAction;
        if (statusText.beforeAction !== "") {
            container.append(cost);
        }
        container.append(button, reward);

        return container;
    }
}
