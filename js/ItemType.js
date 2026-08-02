import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export class ItemType {
    constructor(name) {
        this.name = name;
    }
    isMonster() {
        return ["rat", "orc", "troll"].includes(this.name);
    }
    // Returns item type by seed or null if there is no item in the location with the given seed.
    static getWithSeed(seed, areaId) {
        let name = null;
        if (areaId === 2) {
            if (!(seed % 1133) && seed % 1030 !== 0) {
                name = "stairs up";
            }
            else {
                const tradeCount = ItemType.SHOP_TRADES.length * 2;
                const tradeIndex = ((seed % (tradeCount * 17))
                    + tradeCount * 17) % (tradeCount * 17);
                if (tradeIndex >= tradeCount) {
                    return null;
                }
                const trade = ItemType.SHOP_TRADES[tradeIndex % ItemType.SHOP_TRADES.length];
                if (trade === undefined) {
                    return null;
                }
                name = tradeIndex < ItemType.SHOP_TRADES.length
                    ? "cat buying " + trade.item
                    : "cat selling " + trade.item;
            }
            return new ItemType(name);
        }
        if (areaId === 1) {
            if (!(seed % 1030)) {
                name = "stairs up";
            }
            else if (!(seed % 1201)) {
                name = "armorer's bench";
            }
            else if (!(seed % 2039) || !(seed % 3001)) {
                name = "furnace";
            }
            else {
                return null;
            }
            return new ItemType(name);
        }
        if (!(seed % 1030)) {
            name = "dungeon entrance";
        }
        else if (!(seed % 1133)) {
            name = "shop entrance";
        }
        else if (!(seed % 101)) {
            name = "coin";
        }
        else if (!(seed % 47)) {
            name = "stick";
        }
        else if (!(seed % 53)) {
            name = "stone";
        }
        else if (!(seed % 71)) {
            name = "hay";
        }
        else if (!(seed % 31)) {
            name = "root";
        }
        else if (!(seed % 191)) {
            name = "iron ore";
        }
        else if (!(seed % 349)) {
            name = "yarrow";
        }
        else if (!(seed % 367)) {
            name = "hide";
        }
        else if (!(seed % 503)) {
            name = "chest";
        }
        else if (!(seed % 509)) {
            name = "rat";
        }
        else if (!(seed % 607)) {
            name = "crucible";
        }
        else if (!(seed % 709)) {
            name = "orc";
        }
        else if (!(seed % 811)) {
            name = "torch";
        }
        else if (!(seed % 859)) {
            name = "club";
        }
        else if (!(seed % 877)) {
            name = "padded hide";
        }
        else if (!(seed % 881) || !(seed % 883)) {
            name = "wooden shield";
        }
        else if (!(seed % 929)) {
            name = "stone axe";
        }
        else if (!(seed % 997)) {
            name = "troll";
        }
        else if (!(seed % 1301)) {
            name = "sword";
        }
        else if (!(seed % 1423) || !(seed % 1427)) {
            name = "reinforced shield";
        }
        else if (!(seed % 2013)) {
            name = "treasure";
        }
        else {
            return null;
        }
        return new ItemType(name);
    }
    // Returns
    prizes() {
        const buyingPrefix = "cat buying ";
        const sellingPrefix = "cat selling ";
        if (this.name.startsWith(buyingPrefix) || this.name.startsWith(sellingPrefix)) {
            const buying = this.name.startsWith(buyingPrefix);
            const itemName = this.name.slice(buying ? buyingPrefix.length : sellingPrefix.length);
            const trade = ItemType.SHOP_TRADES.find(value => value.item === itemName);
            if (trade !== undefined) {
                return buying
                    ? [
                        new ItemTypeAndQuantity(new ItemType(trade.item), -trade.quantity),
                        new ItemTypeAndQuantity(new ItemType("coin"), trade.price),
                    ]
                    : [
                        new ItemTypeAndQuantity(new ItemType("coin"), -trade.price),
                        new ItemTypeAndQuantity(new ItemType(trade.item), trade.quantity),
                    ];
            }
        }
        if (this.name === "chest") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), 5),
            ];
        }
        if (this.name === "club") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "crucible") {
            return [
                new ItemTypeAndQuantity(new ItemType("stone"), -5),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
            ];
        }
        if (this.name === "dungeon wall") {
            return [
                new ItemTypeAndQuantity(new ItemType("dungeon wall"), 1),
            ];
        }
        if (this.name === "dungeon floor") {
            return [
                new ItemTypeAndQuantity(new ItemType("dungeon floor"), -300),
            ];
        }
        if (this.name === "orc") {
            return [
                new ItemTypeAndQuantity(new ItemType("torch"), -2),
                new ItemTypeAndQuantity(new ItemType("coin"), 100),
            ];
        }
        if (this.name === "furnace") {
            return [
                new ItemTypeAndQuantity(new ItemType("iron ore"), -3),
                new ItemTypeAndQuantity(new ItemType("hay"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), 9),
            ];
        }
        if (this.name === "armorer's bench") {
            return [
                new ItemTypeAndQuantity(new ItemType("padded hide"), -1),
                new ItemTypeAndQuantity(new ItemType("stick"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
                new ItemTypeAndQuantity(new ItemType("reinforced shield"), 1),
            ];
        }
        if (this.name === "padded hide") {
            return [
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
            ];
        }
        if (this.name === "wooden shield") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -3),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
            ];
        }
        if (this.name === "reinforced shield") {
            return [
                new ItemTypeAndQuantity(new ItemType("wooden shield"), -1),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
            ];
        }
        if (this.name === "rat") {
            return [
                new ItemTypeAndQuantity(new ItemType("torch"), -1),
                new ItemTypeAndQuantity(new ItemType("coin"), 100),
            ];
        }
        if (this.name === "stone axe") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("stone"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -3),
            ];
        }
        if (this.name === "sword") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -2),
                new ItemTypeAndQuantity(new ItemType("iron"), -5),
            ];
        }
        if (this.name === "torch") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "treasure") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), 50),
            ];
        }
        if (this.name === "troll") {
            return [
                new ItemTypeAndQuantity(new ItemType("torch"), -3),
                new ItemTypeAndQuantity(new ItemType("coin"), 1000),
                new ItemTypeAndQuantity(new ItemType("club"), 1),
                new ItemTypeAndQuantity(new ItemType("stone"), 3),
            ];
        }
        return [];
    }
    // Reusable items needed for an action but not consumed by it.
    requirements() {
        if (this.name === "furnace") {
            return [
                new ItemTypeAndQuantity(new ItemType("crucible"), 1),
            ];
        }
        return [];
    }
}
ItemType.SHOP_TRADES = [
    { item: "stick", price: 1, quantity: 3 },
    { item: "stone", price: 2, quantity: 3 },
    { item: "hay", price: 3, quantity: 3 },
    { item: "root", price: 2, quantity: 3 },
    { item: "iron ore", price: 8, quantity: 3 },
    { item: "iron", price: 12, quantity: 3 },
    { item: "yarrow", price: 15, quantity: 1 },
    { item: "hide", price: 8, quantity: 1 },
    { item: "chest", price: 30, quantity: 1 },
    { item: "rat", price: 20, quantity: 1 },
    { item: "orc", price: 50, quantity: 1 },
    { item: "troll", price: 300, quantity: 1 },
    { item: "torch", price: 15, quantity: 1 },
    { item: "club", price: 35, quantity: 1 },
    { item: "stone axe", price: 80, quantity: 1 },
    { item: "sword", price: 200, quantity: 1 },
    { item: "padded hide", price: 35, quantity: 1 },
    { item: "wooden shield", price: 90, quantity: 1 },
    { item: "reinforced shield", price: 240, quantity: 1 },
    { item: "crucible", price: 35, quantity: 1 },
    { item: "treasure", price: 60, quantity: 1 },
];
