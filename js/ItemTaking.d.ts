import { Inventory } from "./Inventory.js";
import { ItemType } from "./ItemType.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
export declare class ItemTaking {
    itemType: ItemType;
    inventory: Inventory;
    constructor(itemType: ItemType, inventory: Inventory);
    summary(): ItemTakingSummary;
}
//# sourceMappingURL=ItemTaking.d.ts.map