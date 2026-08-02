import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";

export class ItemType {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    isMonster(): boolean {
        return ["rat", "orc", "troll"].includes(this.name);
    }

    // Returns item type by seed or null if there is no item in the location with the given seed.
    static getWithSeed(seed: number, depth: number): ItemType|null {
        let name = null;

        if (depth > 0) {
            if (!(seed % 103)) {
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

        if (!(seed % 101)) {
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
        } else if (!(seed % 1030)) {
            name = "dungeon entrance";
        } else {
            return null;
        }

        return new ItemType(name);
    }

    // Returns
    prizes(): ItemTypeAndQuantity[] {
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
}
