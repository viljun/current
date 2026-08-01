import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { View } from './View.js';
export class Inventory {
    constructor() {
        this.quantities = {};
        this.totalQuantities = {};
        this.usedCoordinates = {};
    }
    // Returns text that describes inventory contents.
    getText(messageBox) {
        var _a;
        if (Object.keys(this.totalQuantities).length === 0 && this.totalQuantities.constructor === Object) {
            return "Tap something interesting!";
        }
        const items = [];
        for (const key in this.totalQuantities) {
            const total_quantity = (_a = this.totalQuantities[key]) !== null && _a !== void 0 ? _a : 0;
            if (total_quantity === 0) {
                continue;
            }
            const itemType = ItemType.getWithName(key);
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
    // Returns true if item in the given location has been picked up.
    isItemTaken(coordinates) {
        if (this.usedCoordinates.hasOwnProperty(coordinates.latitude + "," + coordinates.longitude)) {
            return true;
        }
        return false;
    }
    // Adds item in the given coordinates to inventory.
    takeItem(coordinates) {
        var _a;
        var _b;
        let seed = coordinates.getSeed();
        let itemType = ItemType.getWithSeed(seed);
        if (itemType === null) {
            console.log("There's no item at " + coordinates.latitude + "," + coordinates.longitude);
            return;
        }
        if (!this.quantities.hasOwnProperty(itemType.name)) {
            this.quantities[itemType.name] = 0;
        }
        if (this.usedCoordinates.hasOwnProperty(coordinates.latitude + "," + coordinates.longitude)) {
            console.log("You have already taken this " + itemType.name + ".");
        }
        else {
            this.usedCoordinates[coordinates.latitude + "," + coordinates.longitude] = true;
            const key = itemType.name;
            (_a = (_b = this.quantities)[key]) !== null && _a !== void 0 ? _a : (_b[key] = 0);
            this.quantities[key] += 1;
        }
        this.updateTotalQuantities();
    }
    // Update inventory total quantities by adding prizes and inventory.
    updateTotalQuantities() {
        var _a, _b, _c, _d;
        var _e, _f;
        this.totalQuantities = {};
        for (const quantitiesKey in this.quantities) {
            // Copy value from general this.
            if (!this.totalQuantities.hasOwnProperty(quantitiesKey)) {
                this.totalQuantities[quantitiesKey] = 0;
            }
            (_a = (_e = this.totalQuantities)[quantitiesKey]) !== null && _a !== void 0 ? _a : (_e[quantitiesKey] = 0);
            this.totalQuantities[quantitiesKey] += (_b = this.quantities[quantitiesKey]) !== null && _b !== void 0 ? _b : 0;
            // Add prizes.
            const itemType = ItemType.getWithName(quantitiesKey);
            for (const prizesKey in itemType.prizes) {
                const prize = itemType.prizes[prizesKey];
                if (prize === undefined) {
                    console.log("Undefined prize for " + itemType.name + ": " + prizesKey);
                    continue;
                }
                const itemTypeName = prize.itemTypeName;
                if (!this.totalQuantities.hasOwnProperty(itemTypeName)) {
                    this.totalQuantities[prize.itemTypeName] = 0;
                }
                (_c = (_f = this.totalQuantities)[itemTypeName]) !== null && _c !== void 0 ? _c : (_f[itemTypeName] = 0);
                this.totalQuantities[itemTypeName] += prize.quantity * ((_d = this.quantities[quantitiesKey]) !== null && _d !== void 0 ? _d : 0);
            }
        }
    }
}
