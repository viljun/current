import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity";
export class ItemType {
    constructor(name, canBeTakenOnlyOnce, prizes) {
        this.name = name;
        this.canBeTakenOnlyOnce = canBeTakenOnlyOnce;
        this.prizes = prizes;
    }
    // Returns item type by seed or null if there is no item in the location with the given seed.
    static getWithSeed(seed) {
        let name = null;
        if (!(seed % 101)) {
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
        else if (!(seed % 89)) {
            name = "root";
        }
        else if (!(seed % 191)) {
            name = "iron ore";
        }
        else if (!(seed % 349)) {
            name = "heart";
        }
        else if (!(seed % 503)) {
            name = "chest";
        }
        else if (!(seed % 509)) {
            name = "rat";
        }
        else if (!(seed % 607)) {
            name = "smelter";
        }
        else if (!(seed % 709)) {
            name = "orc";
        }
        else if (!(seed % 859)) {
            name = "club";
        }
        else if (!(seed % 929)) {
            name = "stone axe";
        }
        else if (!(seed % 937)) {
            name = "nature shop";
        }
        else if (!(seed % 997)) {
            name = "troll";
        }
        else if (!(seed % 1301)) {
            name = "sword";
        }
        else if (!(seed % 2003)) {
            name = "weapon shop";
        }
        else if (!(seed % 2013)) {
            name = "treasure";
        }
        else if (!(seed % 3001)) {
            name = "iron";
        }
        else if (!(seed % 3013)) {
            name = "body shop";
        }
        else {
            return null;
        }
        return ItemType.getWithName(name);
    }
    // Returns item type by name.
    static getWithName(name) {
        let prizes = [];
        if (name === "chest") {
            prizes = [
                new ItemTypeAndQuantity("coin", 5),
            ];
        }
        else if (name === "body shop") {
            prizes = [
                new ItemTypeAndQuantity("coin", -1000),
                new ItemTypeAndQuantity("heart", 100),
            ];
        }
        else if (name === "club") {
            prizes = [
                new ItemTypeAndQuantity("stick", -1),
                new ItemTypeAndQuantity("root", -1),
            ];
        }
        else if (name === "iron ore") {
        }
        else if (name === "nature shop") {
            prizes = [
                new ItemTypeAndQuantity("coin", -100),
                new ItemTypeAndQuantity("stick", 10),
                new ItemTypeAndQuantity("stone", 10),
                new ItemTypeAndQuantity("root", 10),
            ];
        }
        else if (name === "orc") {
            prizes = [
                new ItemTypeAndQuantity("heart", -1),
                new ItemTypeAndQuantity("stone axe", -1),
                new ItemTypeAndQuantity("coin", 100),
            ];
        }
        else if (name === "smelter") {
            prizes = [
                new ItemTypeAndQuantity("iron ore", -1),
                new ItemTypeAndQuantity("hay", -1),
                new ItemTypeAndQuantity("iron", 3),
            ];
        }
        else if (name === "rat") {
            prizes = [
                new ItemTypeAndQuantity("heart", -1),
                new ItemTypeAndQuantity("club", -1),
                new ItemTypeAndQuantity("coin", 100),
            ];
        }
        else if (name === "stone axe") {
            prizes = [
                new ItemTypeAndQuantity("stick", -1),
                new ItemTypeAndQuantity("stone", -1),
                new ItemTypeAndQuantity("root", -3),
            ];
        }
        else if (name === "sword") {
            prizes = [
                new ItemTypeAndQuantity("stick", -1),
                new ItemTypeAndQuantity("root", -2),
                new ItemTypeAndQuantity("iron", -5),
            ];
        }
        else if (name === "treasure") {
            prizes = [
                new ItemTypeAndQuantity("coin", 50),
            ];
        }
        else if (name === "troll") {
            prizes = [
                new ItemTypeAndQuantity("heart", -5),
                new ItemTypeAndQuantity("sword", -1),
                new ItemTypeAndQuantity("coin", 1000),
                new ItemTypeAndQuantity("club", 1),
                new ItemTypeAndQuantity("stone", 3),
            ];
        }
        else if (name === "weapon shop") {
            prizes = [
                new ItemTypeAndQuantity("coin", -300),
                new ItemTypeAndQuantity("club", 10),
                new ItemTypeAndQuantity("stone axe", 10),
            ];
        }
        else if (name === "dungeon wall") {
            prizes = [
                new ItemTypeAndQuantity("dungeon wall", 1),
            ];
        }
        else if (name === "dungeon floor") {
            prizes = [
                new ItemTypeAndQuantity("dungeon floor", -300),
            ];
        }
        return new ItemType(name, false, prizes);
    }
}
