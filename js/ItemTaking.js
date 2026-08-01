import { Inventory } from "./Inventory.js";
import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { ItemTakingSummary } from "./ItemTakingSummary.js";
export class ItemTaking {
    constructor(itemType, inventory) {
        this.itemType = itemType; // Item type of the item that is being taken.
        this.inventory = inventory;
    }
    // Returns summary of taking an item.
    // - prizes:   items that will be added to inventory.
    // - expenses: items that will be removed from inventory.
    // - missing:  items that are missing in inventory to take the item.
    summary() {
        var _a;
        const prizes = [];
        const expenses = [];
        const missing = [];
        for (const prize of this.itemType.prizes()) {
            if (prize.quantity > 0) {
                prizes.push(prize);
                continue;
            }
            expenses.push(prize); // negative prize is an expense
            // Checks if the inventory has enough items to take the item.
            const have = (_a = this.inventory.totalQuantities[prize.itemType.name]) !== null && _a !== void 0 ? _a : 0;
            if (-prize.quantity > have) {
                missing.push(new ItemTypeAndQuantity(prize.itemType, prize.quantity + have));
            }
        }
        return new ItemTakingSummary(this.itemType, prizes, expenses, missing);
    }
}
