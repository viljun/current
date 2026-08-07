import { Coordinates } from "./Coordinates.js";
import { EncounterCard } from "./EncounterCard.js";
import { EncounterText } from "./EncounterText.js";
import { Effects } from "./Effects.js";
import { ItemExplanation } from "./ItemExplanation.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
import { Inventory } from "./Inventory.js";
import { Map } from "./Map.js";
export class TakeItemButton {
    constructor(item_taking_summary, inventory, selected_coordinates, map, messageBox) {
        this.item_taking_summary = item_taking_summary;
        this.inventory = inventory;
        this.selected_coordinates = selected_coordinates;
        this.map = map;
        this.messageBox = messageBox;
    }
    element() {
        const takeItemButton = document.createElement("div");
        takeItemButton.setAttribute("class", "message encounter-action");
        const merchant = this.item_taking_summary.itemType.name.startsWith("cat buying ") || this.item_taking_summary.itemType.name.startsWith("cat selling ")
            || this.item_taking_summary.itemType.name.startsWith("magician selling ");
        const takeButtonText = this.item_taking_summary.getTakeButtonText();
        if (merchant) {
            const identity = EncounterText.for(this.item_taking_summary.itemType.name, this.selected_coordinates.latitude, this.selected_coordinates.longitude);
            EncounterCard.show(identity.description, "");
        }
        else {
            EncounterCard.show("", ItemExplanation.element(this.item_taking_summary.itemType.name, this.selected_coordinates.latitude, this.selected_coordinates.longitude, this.inventory.getAreaId()), ItemExplanation.displayName(this.item_taking_summary.itemType.name));
        }
        // Take item button.
        const button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("class", "button");
        if (this.item_taking_summary.missing.length > 0) {
            button.setAttribute("disabled", 'true');
        }
        button.setAttribute("value", takeButtonText.buttonText);
        button.onclick = () => {
            if (!this.map.isWithinTakingRange(this.selected_coordinates)) {
                this.map.show({});
                return;
            }
            const sourceElement = document.querySelector(".cell.selected .item.collectible");
            const result = this.inventory.takeItem(this.selected_coordinates);
            if (result === null) {
                return;
            }
            Effects.playItemAction(result, sourceElement, this.selected_coordinates.getSeed());
            this.map.show({});
        };
        takeItemButton.append(button);
        // Text after the button.
        if (takeButtonText.additionalText !== "") {
            takeItemButton.append(takeButtonText.additionalText);
        }
        return takeItemButton;
    }
}
