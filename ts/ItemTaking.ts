import { Inventory }           from "./Inventory.js";
import { ItemType }            from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { ItemTakingSummary }   from "./ItemTakingSummary.js";

export class ItemTaking {
    itemType:  ItemType;
    inventory: Inventory;
    constructor(itemType: ItemType, inventory: Inventory) {
        this.itemType  = itemType;  // Item type of the item that is being taken.
        this.inventory = inventory;
    }

    // Returns summary of taking an item.
    // - prizes:   items that will be added to inventory.
    // - expenses: items that will be removed from inventory.
    // - requirements: reusable items needed but not removed.
    // - missing:  items that are missing in inventory to take the item.
    summary(): ItemTakingSummary {
        const prizes:   ItemTypeAndQuantity[] = [];
        const expenses: ItemTypeAndQuantity[] = [];
        const requirements = this.itemType.requirements();
        const missing:  ItemTypeAndQuantity[] = [];

        for (const prize of this.itemType.prizes()) {
            if (prize.quantity > 0) {
                prizes.push(prize);

                continue;
            }
            expenses.push(prize);  // negative prize is an expense

            // Checks if the inventory has enough items to take the item.
            const have = this.inventory.totalQuantities[prize.itemType.name] ?? 0;
            if (-prize.quantity > have) {
                missing.push(new ItemTypeAndQuantity(prize.itemType, prize.quantity + have));
            }
        }

        for (const requirement of requirements) {
            const have = this.inventory.totalQuantities[requirement.itemType.name] ?? 0;
            if (requirement.quantity > have) {
                missing.push(new ItemTypeAndQuantity(
                    requirement.itemType,
                    have - requirement.quantity,
                ));
            }
        }

        return new ItemTakingSummary(
            this.itemType,
            prizes,
            expenses,
            requirements,
            missing,
        );
    }
}
