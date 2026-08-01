import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { View } from './View.js';
export class Inventory {
    constructor() {
        this.quantities = {};
        this.totalQuantities = {};
        this.usedCoordinates = {};
    }
    // Returns quantity of the given item type in inventory.
    countItems(itemType) {
        var _a;
        return (_a = this.totalQuantities[itemType.name]) !== null && _a !== void 0 ? _a : 0;
    }
    // Returns text that describes inventory contents.
    getText(messageBox) {
        var _a;
        if (Object.keys(this.totalQuantities).length === 0 && this.totalQuantities.constructor === Object) {
            return "Welcome! Explore nearby items, then find a stick and a root to craft your first club.";
        }
        const items = [];
        for (const key in this.totalQuantities) {
            const total_quantity = (_a = this.totalQuantities[key]) !== null && _a !== void 0 ? _a : 0;
            if (total_quantity === 0) {
                continue;
            }
            const itemType = new ItemType(key);
            items.push(View.getQuantityText(itemType.name, total_quantity));
        }
        const div = document.createElement("div");
        div.setAttribute("class", "message");
        div.innerHTML = "You have ";
        const text = View.arrayToText(items);
        if (text.length > 40) {
            const button = document.createElement("input");
            button.setAttribute("type", "button");
            button.setAttribute("class", "button");
            button.setAttribute("value", View.getQuantityText("item", items.length));
            button.onclick = function () {
                View.setMessage(messageBox, "You have " + text + ".");
            };
            div.append(button);
        }
        else {
            div.append(text + ".");
        }
        return div;
    }
    isItemTypeTaken(itemType) {
        var _a;
        if (this.totalQuantities.hasOwnProperty(itemType.name)) {
            console.log("Taken?");
            if ((_a = this.totalQuantities[itemType.name]) !== null && _a !== void 0 ? _a : 0 > 0) {
                console.log("y");
                return true;
            }
            console.log("n");
        }
        return false;
    }
    coordinatesToString(coordinates) {
        return coordinates.latitude + "," + coordinates.longitude + "," + this.getDepth();
    }
    // Returns true if item in the given location has been picked up.
    isItemTaken(coordinates) {
        if (this.usedCoordinates.hasOwnProperty(this.coordinatesToString(coordinates))) {
            return true;
        }
        return false;
    }
    // Adds item in the given coordinates to inventory.
    takeItem(coordinates) {
        var _a;
        var _b;
        let seed = coordinates.getSeed();
        let itemType = ItemType.getWithSeed(seed, this.getDepth());
        if (itemType === null) {
            console.log("There's no item at " + this.coordinatesToString(coordinates));
            return;
        }
        if (!this.quantities.hasOwnProperty(itemType.name)) {
            this.quantities[itemType.name] = 0;
        }
        if (this.usedCoordinates.hasOwnProperty(this.coordinatesToString(coordinates))) {
            console.log("You have already taken this " + itemType.name + ".");
        }
        else {
            this.usedCoordinates[this.coordinatesToString(coordinates)] = true;
            const key = itemType.name;
            (_a = (_b = this.quantities)[key]) !== null && _a !== void 0 ? _a : (_b[key] = 0);
            this.quantities[key] += 1;
        }
        this.updateTotalQuantities();
    }
    // Update inventory total quantities by adding prizes and inventory.
    updateTotalQuantities() {
        var _a, _b, _c, _d, _e;
        var _f, _g;
        this.totalQuantities = {};
        for (const [quantitiesKey, value] of Object.entries(this.quantities)) {
            // Copy value from general this.
            if (!this.totalQuantities.hasOwnProperty(quantitiesKey)) {
                this.totalQuantities[quantitiesKey] = 0;
            }
            (_a = (_f = this.totalQuantities)[quantitiesKey]) !== null && _a !== void 0 ? _a : (_f[quantitiesKey] = 0);
            this.totalQuantities[quantitiesKey] += (_b = this.quantities[quantitiesKey]) !== null && _b !== void 0 ? _b : 0;
            // Add prizes.
            const itemType = new ItemType(quantitiesKey);
            for (const prize of (_c = itemType.prizes()) !== null && _c !== void 0 ? _c : []) {
                const itemTypeName = prize.itemType.name;
                if (!this.totalQuantities.hasOwnProperty(itemType.name)) {
                    this.totalQuantities[itemTypeName] = 0;
                }
                (_d = (_g = this.totalQuantities)[itemTypeName]) !== null && _d !== void 0 ? _d : (_g[itemTypeName] = 0);
                this.totalQuantities[itemTypeName] += prize.quantity * ((_e = this.quantities[quantitiesKey]) !== null && _e !== void 0 ? _e : 0);
            }
        }
    }
    // Returns current depth based on how many dungeon entrances and stairs up the player has taken.
    getDepth() {
        return this.countItems(new ItemType("dungeon entrance")) - this.countItems(new ItemType("stairs up"));
    }
}
