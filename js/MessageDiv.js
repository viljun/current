import { Coordinates } from "./Coordinates.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
import { Inventory } from "./Inventory.js";
import { Map } from "./Map.js";
import { View } from "./View.js";
export class MessageDiv {
    constructor(item_taking_summary, inventory, selected_coordinates, map, messageBox) {
        this.item_taking_summary = item_taking_summary;
        this.inventory = inventory;
        this.selected_coordinates = selected_coordinates;
        this.map = map;
        this.messageBox = messageBox;
    }
    element() {
        const messageDiv = document.createElement("div");
        messageDiv.setAttribute("class", "message");
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
        messageDiv.append(button);
        // Text after the button.
        if (takeButtonText.additionalText !== "") {
            messageDiv.append(takeButtonText.additionalText);
        }
        return messageDiv;
    }
}
