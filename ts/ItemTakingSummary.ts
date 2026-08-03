import { ItemType }            from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { View }                from './View.js';

export class ItemTakingSummary {
    itemType: ItemType;
    prizes:   ItemTypeAndQuantity[];
    expenses: ItemTypeAndQuantity[];
    requirements: ItemTypeAndQuantity[];
    missing:  ItemTypeAndQuantity[];
    constructor(
        itemType: ItemType,
        prizes:   ItemTypeAndQuantity[],
        expenses: ItemTypeAndQuantity[],
        requirements: ItemTypeAndQuantity[],
        missing:  ItemTypeAndQuantity[],
    ) {
        this.itemType = itemType;  // Item type of the item that is being taken.
        this.prizes   = prizes;    // Items that will be added to inventory.
        this.expenses = expenses;  // Items that will be removed from inventory.
        this.requirements = requirements;
        this.missing  = missing;   // Items that are missing in inventory to take the item.
    }

    // Returns "take"-button text.
    getTakeButtonText() {
        const craftable = [
            "crucible",
            "padded hide",
            "wooden shield",
            "reinforced shield",
            "iron-spiked club",
            "iron hand axe",
            "flanged mace",
            "bearded battle axe",
            "arming sword",
            "war hammer",
            "longsword",
            "two-handed battle axe",
            "poleaxe",
            "masterwork greatsword",
            "healing potion",
            "poison potion",
            "poisoned masterwork greatsword",
            "bone knife",
            "spiked cudgel",
            "iron dagger",
            "falchion",
            "morning star",
            "war pick",
            "heavy crossbow",
            "zweihander",
            "halberd",
            "executioner's axe",
            "estoc",
            "bec de corbin",
            "gothic mace",
            "runed longsword",
            "blacksteel glaive",
            "relic warhammer",
            "dragonbone axe",
            "royal claymore",
            "obsidian polearm",
            "dungeon-forged greatblade",
            "bone carving",
            "skull crushing",
            "chain smelting",
            "dust distilling",
            "wing tanning",
            "silk binding",
            "candle reclaiming",
            "nail reforging",
            "tile knapping",
            "moss brewing",
        ].includes(this.itemType.name);
        const merchant = this.itemType.name.startsWith("cat buying ")
            || this.itemType.name.startsWith("cat selling ");
        let buttonText = merchant
            ? "Trade with cat"
            : this.itemType.name === "furnace"
            ? "Smelt iron"
            : this.itemType.name === "armorer's bench"
                ? "Use armorer's bench"
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
                itemTexts.push(View.getQuantityText(
                    value.itemType.name,
                    value.quantity,
                ));
            }
            additionalText += " using " + View.arrayToText(itemTexts);
        }

        // Prizes.
        if (this.prizes.length > 0) {
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
                if (this.expenses.length === 1 && this.expenses[0]?.quantity === -1) {
                    additionalText += " Find it somewhere.";
                } else {
                    additionalText += " Find them somewhere.";
                }
            } else {
                const itemTexts = [];
                for (const value of this.missing) {
                    itemTexts.push(View.getQuantityText(value.itemType.name, -value.quantity));
                }
                additionalText += " You still need " + View.arrayToText(itemTexts) + '.';
            }
        }

        return {buttonText: buttonText, additionalText: additionalText};
    }

    private areSameChanges(
        first: ItemTypeAndQuantity[],
        second: ItemTypeAndQuantity[],
    ): boolean {
        return first.length === second.length
            && first.every((change, index) => {
                const other = second[index];

                return other !== undefined
                    && change.itemType.name === other.itemType.name
                    && change.quantity === other.quantity;
            });
    }
}
