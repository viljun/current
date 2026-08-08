import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { View } from './View.js';
import { BattleSpell } from "./BattleSpell.js";
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
        const craftable = BattleSpell.isBattleSpell(this.itemType.name) || [
            "binding rope",
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
            "yarrow poultice",
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
            "mushroom mixing",
            "campfire",
        ].includes(this.itemType.name);
        const catBuying = this.itemType.name.startsWith("cat buying ");
        const catSelling = this.itemType.name.startsWith("cat selling ");
        const magicianSelling = this.itemType.name.startsWith("magician selling ");
        const merchant = catBuying || catSelling || magicianSelling;
        let buttonText = merchant
            ? magicianSelling
                ? "Buy spell"
                : catBuying
                    ? "Sell"
                    : "Buy"
            : this.itemType.name === "furnace"
                ? "Smelt iron"
                : this.itemType.name === "mushroom mixing"
                    ? "Mix mushrooms"
                    : this.itemType.name === "campfire"
                        ? "Cook river feast"
                        : this.itemType.name === "armorer's bench"
                            ? "Use armorer's bench"
                            : ItemType.isRiverFish(this.itemType.name)
                                ? "Catch " + this.itemType.name
                                : craftable
                                    ? "Craft " + this.itemType.name
                                    : "Take " + this.itemType.name;
        let additionalText = "";
        const catMerchant = catBuying || catSelling;
        if (catMerchant
            && this.expenses.length > 0
            && this.prizes.length > 0) {
            const expenseTexts = this.expenses.map(value => View.getQuantityText(value.itemType.name, -value.quantity));
            const prizeTexts = this.prizes.map(value => View.getQuantityText(value.itemType.name, value.quantity));
            additionalText = catBuying
                ? " " + View.arrayToText(expenseTexts)
                    + " for " + View.arrayToText(prizeTexts) + "."
                : " " + View.arrayToText(prizeTexts)
                    + " with " + View.arrayToText(expenseTexts) + ".";
        }
        else {
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
        }
        // Missing items.
        if (this.missing.length > 0) {
            if (this.areSameChanges(this.expenses, this.missing)) {
                const merchantItems = catBuying
                    ? this.expenses
                    : this.prizes;
                const merchantItemTexts = merchantItems.map(value => View.getQuantityText(value.itemType.name, Math.abs(value.quantity)));
                const purpose = merchant
                    ? (catBuying ? "sell " : "buy ")
                        + View.arrayToText(merchantItemTexts)
                    : this.itemType.name === "furnace"
                        ? "smelt iron"
                        : this.itemType.name === "mushroom mixing"
                            ? "mix mushrooms"
                            : this.itemType.name === "campfire"
                                ? "cook a river feast"
                                : this.itemType.name === "armorer's bench"
                                    ? "use the armorer's bench"
                                    : ItemType.isRiverFish(this.itemType.name)
                                        ? "catch " + View.getQuantityText(this.itemType.name, 1)
                                        : craftable
                                            ? "craft " + View.getQuantityText(this.itemType.name, 1)
                                            : "take " + View.getQuantityText(this.itemType.name, 1);
                if (this.expenses.length === 1 && ((_a = this.expenses[0]) === null || _a === void 0 ? void 0 : _a.quantity) === -1) {
                    additionalText += " Find it to " + purpose + ".";
                }
                else {
                    additionalText += " Find them to " + purpose + ".";
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
        if (ItemType.isRiverFish(this.itemType.name)
            && this.missing.some(change => change.itemType.name === "worm")) {
            additionalText = " A worm is required as bait.";
        }
        return { buttonText: buttonText, additionalText: additionalText };
    }
    getFightStatusText() {
        if (this.missing.length > 0) {
            const missing = this.missing.map(change => View.getQuantityText(change.itemType.name, -change.quantity));
            return {
                beforeAction: "You still need "
                    + View.arrayToText(missing) + " to",
                afterAction: View.getQuantityText(this.itemType.name, 1) + ".",
            };
        }
        const expenses = this.expenses.map(change => {
            const quantity = -change.quantity;
            return quantity === 1
                ? "one " + change.itemType.name
                : View.getQuantityText(change.itemType.name, quantity);
        });
        const prizes = this.prizes.map(change => {
            const prize = View.getQuantityText(change.itemType.name, change.quantity);
            return change.itemType.name === "coin" ? "its " + prize : prize;
        });
        const rewardText = "You keep the " + this.itemType.name
            + (prizes.length > 0
                ? " and take " + View.arrayToText(prizes)
                : "");
        const expenseQuantity = this.expenses.reduce((total, change) => total - change.quantity, 0);
        const successText = expenses.length > 0
            ? View.arrayToText(expenses) + " "
                + (expenseQuantity === 1 ? "is" : "are")
                + " used. " + rewardText
            : rewardText;
        return {
            beforeAction: "",
            afterAction: View.getQuantityText(this.itemType.name, 1)
                + ". If you succeed, " + successText + ".",
        };
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
