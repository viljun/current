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
    // - requirements: reusable items needed but not removed.
    // - missing:  items that are missing in inventory to take the item.
    summary() {
        var _a, _b;
        const prizes = [];
        const expenses = [];
        const requirements = this.itemType.requirements();
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
        for (const requirement of requirements) {
            const have = (_b = this.inventory.totalQuantities[requirement.itemType.name]) !== null && _b !== void 0 ? _b : 0;
            if (requirement.quantity > have) {
                missing.push(new ItemTypeAndQuantity(requirement.itemType, have - requirement.quantity));
            }
        }
        return new ItemTakingSummary(this.itemType, prizes, expenses, requirements, missing, ItemTaking.maximumQuantityViolations(this.itemType, this.inventory.totalQuantities));
    }
    static maximumQuantityViolations(itemType, currentQuantities) {
        var _a, _b;
        const changes = new Map();
        const types = new Map();
        const addChange = (changedType, quantity) => {
            var _a;
            changes.set(changedType.name, ((_a = changes.get(changedType.name)) !== null && _a !== void 0 ? _a : 0) + quantity);
            types.set(changedType.name, changedType);
        };
        if (!ItemType.isTransientAction(itemType.name)) {
            addChange(itemType, 1);
        }
        for (const change of itemType.prizes()) {
            addChange(change.itemType, change.quantity);
        }
        const violations = [];
        for (const [itemName, quantity] of changes) {
            if (quantity <= 0) {
                continue;
            }
            const changedType = types.get(itemName);
            const maximum = (_a = changedType === null || changedType === void 0 ? void 0 : changedType.maximumQuantity()) !== null && _a !== void 0 ? _a : null;
            const resultingQuantity = ((_b = currentQuantities[itemName]) !== null && _b !== void 0 ? _b : 0)
                + quantity;
            if (changedType !== undefined
                && maximum !== null
                && resultingQuantity > maximum) {
                violations.push({
                    itemType: changedType,
                    maximum,
                    resultingQuantity,
                });
            }
        }
        return violations.sort((first, second) => first.itemType.name.localeCompare(second.itemType.name));
    }
}
