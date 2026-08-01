import { Inventory } from "./Inventory";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity";
export class ItemTaking {
    constructor(inventory, prizes) {
        this.inventory = inventory;
        this.prizes = prizes;
    }
    // Returns summary of taking an item.
    // - prizes:   items that will be added to inventory.
    // - expenses: items that will be removed from inventory.
    // - missing:  items that are missing in inventory to take the item.
    summary() {
        var _a;
        const items = {
            prizes: [],
            expenses: [],
            missing: [],
        };
        for (const prize of this.prizes) {
            if (prize.quantity > 0) {
                items.prizes.push(prize);
                continue;
            }
            items.expenses.push(prize); // negative prize is an expense
            if (this.inventory.totalQuantities.hasOwnProperty(prize.itemTypeName)) {
                if ((_a = this.inventory.totalQuantities[prize.itemTypeName]) !== null && _a !== void 0 ? _a : 0 < -prize.quantity) {
                    items.missing.push(prize);
                }
            }
            else {
                items.missing.push(prize);
            }
        }
        return items;
    }
}
