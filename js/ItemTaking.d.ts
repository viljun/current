import type { Inventory } from "./Inventory.js";
import { ItemType } from "./ItemType.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { MaximumQuantityViolation } from "./ItemTakingSummary.js";
export declare class ItemTaking {
    itemType: ItemType;
    inventory: Inventory;
    constructor(itemType: ItemType, inventory: Inventory);
    summary(): ItemTakingSummary;
    static maximumQuantityViolations(itemType: ItemType, currentQuantities: Readonly<Record<string, number>>): MaximumQuantityViolation[];
}
//# sourceMappingURL=ItemTaking.d.ts.map