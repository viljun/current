import { Coordinates } from "./Coordinates.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
import { Inventory } from "./Inventory.js";
import { Map } from "./Map.js";
export declare class TakeItemButton {
    item_taking_summary: ItemTakingSummary;
    inventory: Inventory;
    selected_coordinates: Coordinates;
    map: Map;
    messageBox: HTMLDivElement;
    constructor(item_taking_summary: ItemTakingSummary, inventory: Inventory, selected_coordinates: Coordinates, map: Map, messageBox: HTMLDivElement);
    element(): HTMLDivElement;
}
//# sourceMappingURL=TakeItemButton.d.ts.map