import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";

export class ItemType {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    // Returns true if the item can be taken only once.
    canBeTakenOnlyOnce(): boolean {
        return [
            "smelter",
            "nature shop",
            "weapon shop",
        ].includes(this.name);
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
        } else if (!(seed % 89)) {
            name = "root";
        } else if (!(seed % 191)) {
            name = "iron ore";
        } else if (!(seed % 349)) {
            name = "heart";
        } else if (!(seed % 503)) {
            name = "chest";
        } else if (!(seed % 509)) {
            name = "rat";
        } else if (!(seed % 607)) {
            name = "smelter";
        } else if (!(seed % 709)) {
            name = "orc";
        } else if (!(seed % 859)) {
            name = "club";
        } else if (!(seed % 929)) {
            name = "stone axe";
        } else if (!(seed % 937)) {
            name = "nature shop";
        } else if (!(seed % 997)) {
            name = "troll";
        } else if (!(seed % 1301)) {
            name = "sword";
        } else if (!(seed % 2003)) {
            name = "weapon shop";
        } else if (!(seed % 2013)) {
            name = "treasure";
        } else if (!(seed % 3001)) {
            name = "iron";
        } else if (!(seed % 3013)) {
            name = "body shop";
        } else if (!(seed % 103)) {
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
        if (this.name === "body shop") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), -1000),
                new ItemTypeAndQuantity(new ItemType("heart"), 100),
            ];
        }
        if (this.name === "club") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
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
        if (this.name === "iron ore") {
        }
        if (this.name === "nature shop") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), -100),
                new ItemTypeAndQuantity(new ItemType("stick"), 10),
                new ItemTypeAndQuantity(new ItemType("stone"), 10),
                new ItemTypeAndQuantity(new ItemType("root"), 10),
            ];
        }
        if (this.name === "orc") {
            return [
                new ItemTypeAndQuantity(new ItemType("heart"), -1),
                new ItemTypeAndQuantity(new ItemType("stone axe"), -1),
                new ItemTypeAndQuantity(new ItemType("coin"), 100),
            ];
        }
        if (this.name === "smelter") {
            return [
                new ItemTypeAndQuantity(new ItemType("iron ore"), -1),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), 3),
            ];
        }
        if (this.name === "rat") {
            return [
                new ItemTypeAndQuantity(new ItemType("heart"), -1),
                new ItemTypeAndQuantity(new ItemType("club"), -1),
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
        if (this.name === "treasure") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), 50),
            ];
        }
        if (this.name === "troll") {
            return [
                new ItemTypeAndQuantity(new ItemType("heart"), -5),
                new ItemTypeAndQuantity(new ItemType("sword"), -1),
                new ItemTypeAndQuantity(new ItemType("coin"), 1000),
                new ItemTypeAndQuantity(new ItemType("club"), 1),
                new ItemTypeAndQuantity(new ItemType("stone"), 3),
            ];
        }
        if (this.name === "weapon shop") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), -300),
                new ItemTypeAndQuantity(new ItemType("club"), 10),
                new ItemTypeAndQuantity(new ItemType("stone axe"), 10),
            ];
        }

        return [];
    }
}
