import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { View } from './View.js';
export class ItemTakingSummary {
    constructor(itemType, prizes, expenses, requirements, missing) {
        this.itemType = itemType; // Item type of the item that is being taken.
        this.prizes = prizes; // Items that will be added to inventory.
        this.expenses = expenses; // Items that will be removed from inventory.
        this.requirements = requirements;
        this.missing = missing; // Items that are missing in inventory to take the item.
    }
    // Returns "take"-button text.
    getTakeButtonText() {
        var _a;
        const craftable = [
            "crucible",
            "padded hide",
            "wooden shield",
            "reinforced shield",
        ].includes(this.itemType.name);
        let buttonText = this.itemType.name === "iron"
            ? "Smelt iron"
            : craftable
                ? "Craft " + this.itemType.name
                : "Take " + this.itemType.name;
        let additionalText = "";
        // Expenses.
        if (this.expenses.length > 0) {
            const itemTexts = [];
            for (const value of this.expenses) {
                itemTexts.push(View.getQuantityText(value.itemType.name, -value.quantity));
            }
            additionalText += " with " + View.arrayToText(itemTexts);
        }
        // Reusable requirements.
        if (this.requirements.length > 0) {
            const itemTexts = [];
            for (const value of this.requirements) {
                itemTexts.push(View.getQuantityText(value.itemType.name, value.quantity));
            }
            additionalText += " using " + View.arrayToText(itemTexts);
        }
        // Prizes.
        if (this.missing.length === 0 && this.prizes.length > 0) {
            const itemTexts = [];
            for (const value of this.prizes) {
                itemTexts.push(View.getQuantityText(value.itemType.name, value.quantity));
            }
            additionalText += " to get " + View.arrayToText(itemTexts);
        }
        if (additionalText.length > 0) {
            additionalText += ".";
        }
        // Missing items.
        if (this.missing.length > 0) {
            if (this.areSameChanges(this.expenses, this.missing)) {
                if (this.expenses.length === 1 && ((_a = this.expenses[0]) === null || _a === void 0 ? void 0 : _a.quantity) === -1) {
                    additionalText += " Find it somewhere.";
                }
                else {
                    additionalText += " Find them somewhere.";
                }
            }
            else {
                const itemTexts = [];
                for (const value of this.missing) {
                    itemTexts.push(View.getQuantityText(value.itemType.name, -value.quantity));
                }
                additionalText += " You still need " + View.arrayToText(itemTexts) + '.';
            }
        }
        return { buttonText: buttonText, additionalText: additionalText };
    }
    areSameChanges(first, second) {
        return first.length === second.length
            && first.every((change, index) => {
                const other = second[index];
                return other !== undefined
                    && change.itemType.name === other.itemType.name
                    && change.quantity === other.quantity;
            });
    }
}
