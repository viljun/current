import { Coordinates } from "./Coordinates.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
import { Inventory } from "./Inventory.js";
import { Map } from "./Map.js";
import { View } from "./View.js";
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
        takeItemButton.setAttribute("class", "message");
        // Take item button.
        const button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("class", "button");
        if (this.item_taking_summary.missing.length > 0) {
            button.setAttribute("disabled", 'true');
        }
        var takeButtonText = this.item_taking_summary.getTakeButtonText();
        button.setAttribute("value", takeButtonText.buttonText);
        button.onclick = () => {
            this.inventory.takeItem(this.selected_coordinates);
            this.map.show({});
            View.setMessage(this.messageBox, this.inventory.getText(this.messageBox));
        };
        takeItemButton.append(button);
        // Text after the button.
        if (takeButtonText.additionalText !== "") {
            takeItemButton.append(takeButtonText.additionalText);
        }
        return takeItemButton;
    }
}
