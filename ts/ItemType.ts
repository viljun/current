import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";

export class ItemType {
    private static readonly ENTRANCE_MODULUS = 4120;
    private static readonly SHOP_ENTRANCE_REMAINDER = 2;
    private static readonly SHOP_TRADE_DENSITY_DIVISOR = 85;
    private static readonly SHOP_TRADES: readonly {
        item: string;
        quantity: number;
    }[] = [
        { item: "stick", quantity: 3 },
        { item: "stone", quantity: 3 },
        { item: "hay", quantity: 3 },
        { item: "root", quantity: 3 },
        { item: "iron ore", quantity: 3 },
        { item: "iron", quantity: 3 },
        { item: "yarrow", quantity: 1 },
        { item: "hide", quantity: 1 },
        { item: "chest", quantity: 1 },
        { item: "rat", quantity: 1 },
        { item: "orc", quantity: 1 },
        { item: "troll", quantity: 1 },
        { item: "torch", quantity: 1 },
        { item: "club", quantity: 1 },
        { item: "stone axe", quantity: 1 },
        { item: "sword", quantity: 1 },
        { item: "padded hide", quantity: 1 },
        { item: "wooden shield", quantity: 1 },
        { item: "reinforced shield", quantity: 1 },
        { item: "crucible", quantity: 1 },
        { item: "treasure", quantity: 1 },
    ];
    private static readonly FOUNDATIONAL_VALUES: Readonly<Record<string, number>> = {
        coin: 1,
        hay: 1,
        hide: 6,
        "iron ore": 3,
        root: 1,
        stick: 1,
        stone: 2,
        yarrow: 10,
    };
    private static readonly PRODUCTION_ACTIONS = ["furnace"];

    name: string;
    constructor(name: string) {
        this.name = name;
    }

    isMonster(): boolean {
        return ["rat", "orc", "troll"].includes(this.name);
    }

    // Returns item type by seed or null if there is no item in the location with the given seed.
    static getWithSeed(seed: number, areaId: number): ItemType|null {
        let name = null;

        if (areaId === 2) {
            if (ItemType.isShopEntranceSeed(seed)) {
                name = "stairs up";
            } else {
                const tradeCount = ItemType.SHOP_TRADES.length * 2;
                const tradePeriod = tradeCount
                    * ItemType.SHOP_TRADE_DENSITY_DIVISOR;
                const tradeIndex = ((seed % tradePeriod) + tradePeriod) % tradePeriod;
                if (tradeIndex >= tradeCount) {
                    return null;
                }
                const trade = ItemType.SHOP_TRADES[
                    tradeIndex % ItemType.SHOP_TRADES.length
                ];
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
            if (ItemType.isDungeonEntranceSeed(seed)) {
                name = "stairs up";
            } else if (!(seed % 1201)) {
                name = "armorer's bench";
            } else if (!(seed % 2039) || !(seed % 3001)) {
                name = "furnace";
            } else {
                return null;
            }

            return new ItemType(name);
        }

        if (ItemType.isDungeonEntranceSeed(seed)) {
            name = "dungeon entrance";
        } else if (ItemType.isShopEntranceSeed(seed)) {
            name = "shop entrance";
        } else if (!(seed % 101)) {
            name = "coin";
        } else if (!(seed % 47)) {
            name = "stick";
        } else if (!(seed % 53)) {
            name = "stone";
        } else if (!(seed % 71)) {
            name = "hay";
        } else if (!(seed % 31)) {
            name = "root";
        } else if (!(seed % 191)) {
            name = "iron ore";
        } else if (!(seed % 349)) {
            name = "yarrow";
        } else if (!(seed % 367)) {
            name = "hide";
        } else if (!(seed % 503)) {
            name = "chest";
        } else if (!(seed % 509)) {
            name = "rat";
        } else if (!(seed % 607)) {
            name = "crucible";
        } else if (!(seed % 709)) {
            name = "orc";
        } else if (!(seed % 811)) {
            name = "torch";
        } else if (!(seed % 859)) {
            name = "club";
        } else if (!(seed % 877)) {
            name = "padded hide";
        } else if (!(seed % 881) || !(seed % 883)) {
            name = "wooden shield";
        } else if (!(seed % 929)) {
            name = "stone axe";
        } else if (!(seed % 997)) {
            name = "troll";
        } else if (!(seed % 1301)) {
            name = "sword";
        } else if (!(seed % 1423) || !(seed % 1427)) {
            name = "reinforced shield";
        } else if (!(seed % 2013)) {
            name = "treasure";
        } else {
            return null;
        }

        return new ItemType(name);
    }

    // Returns
    prizes(): ItemTypeAndQuantity[] {
        const buyingPrefix = "cat buying ";
        const sellingPrefix = "cat selling ";
        if (this.name.startsWith(buyingPrefix) || this.name.startsWith(sellingPrefix)) {
            const buying = this.name.startsWith(buyingPrefix);
            const itemName = this.name.slice(
                buying ? buyingPrefix.length : sellingPrefix.length,
            );
            const trade = ItemType.SHOP_TRADES.find(value => value.item === itemName);
            if (trade !== undefined) {
                const price = ItemType.shopPrice(
                    trade.item,
                    trade.quantity,
                    buying,
                );
                return buying
                    ? [
                        new ItemTypeAndQuantity(
                            new ItemType(trade.item),
                            -trade.quantity,
                        ),
                        new ItemTypeAndQuantity(new ItemType("coin"), price),
                    ]
                    : [
                        new ItemTypeAndQuantity(new ItemType("coin"), -price),
                        new ItemTypeAndQuantity(
                            new ItemType(trade.item),
                            trade.quantity,
                        ),
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
    requirements(): ItemTypeAndQuantity[] {
        if (this.name === "furnace") {
            return [
                new ItemTypeAndQuantity(new ItemType("crucible"), 1),
            ];
        }

        return [];
    }

    static intrinsicValue(itemName: string): number {
        return ItemType.calculateIntrinsicValue(itemName, new Set<string>());
    }

    static shopPrice(itemName: string, quantity: number, buying: boolean): number {
        const lotValue = ItemType.intrinsicValue(itemName) * quantity;

        return Math.max(
            1,
            buying ? Math.floor(lotValue * .75) : Math.ceil(lotValue * 1.5),
        );
    }

    private static calculateIntrinsicValue(
        itemName: string,
        visiting: Set<string>,
    ): number {
        const foundational = ItemType.FOUNDATIONAL_VALUES[itemName];
        if (foundational !== undefined) {
            return foundational;
        }
        if (visiting.has(itemName)) {
            return 1;
        }
        const nextVisiting = new Set(visiting);
        nextVisiting.add(itemName);
        const itemType = new ItemType(itemName);
        const changes = itemType.prizes();
        const expenses = changes.filter(change => change.quantity < 0);
        const rewards = changes.filter(change => change.quantity > 0);

        if (itemType.isMonster()) {
            const rewardValue = ItemType.valueChanges(rewards, nextVisiting);
            const combatCost = ItemType.valueChanges(expenses, nextVisiting);

            return Math.max(1, Math.round((rewardValue - combatCost) * .5));
        }
        if (expenses.length > 0) {
            const materialValue = ItemType.valueChanges(expenses, nextVisiting);

            return Math.max(1, Math.ceil(materialValue * 1.2));
        }
        if (rewards.length > 0) {
            return Math.max(1, ItemType.valueChanges(rewards, nextVisiting));
        }

        for (const actionName of ItemType.PRODUCTION_ACTIONS) {
            const production = new ItemType(actionName).prizes();
            const output = production.find(change =>
                change.itemType.name === itemName && change.quantity > 0
            );
            if (output === undefined) {
                continue;
            }
            const productionCost = ItemType.valueChanges(
                production.filter(change => change.quantity < 0),
                nextVisiting,
            );

            return Math.max(1, productionCost * 1.2 / output.quantity);
        }

        return 1;
    }

    private static valueChanges(
        changes: ItemTypeAndQuantity[],
        visiting: Set<string>,
    ): number {
        return changes.reduce((total, change) =>
            total + Math.abs(change.quantity)
                * ItemType.calculateIntrinsicValue(change.itemType.name, visiting),
        0);
    }

    private static isDungeonEntranceSeed(seed: number): boolean {
        const modulus = ItemType.ENTRANCE_MODULUS;
        const remainder = ((seed % modulus) + modulus) % modulus;

        return remainder < 2;
    }

    private static isShopEntranceSeed(seed: number): boolean {
        const modulus = ItemType.ENTRANCE_MODULUS;
        const remainder = ((seed % modulus) + modulus) % modulus;

        return remainder === ItemType.SHOP_ENTRANCE_REMAINDER;
    }

}
