import { Coordinates } from "./Coordinates.js";
import { Inventory } from "./Inventory.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { Map } from "./Map.js";
export declare class FightMonsterButton {
    private itemTakingSummary;
    private inventory;
    private selectedCoordinates;
    private map;
    constructor(itemTakingSummary: ItemTakingSummary, inventory: Inventory, selectedCoordinates: Coordinates, map: Map);
    element(): HTMLDivElement;
}
//# sourceMappingURL=FightMonsterButton.d.ts.map