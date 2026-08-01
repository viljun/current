import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { View } from './View.js';
export class Inventory {
    constructor() {
        this.quantities = {};
        this.totalQuantities = {};
        this.usedCoordinates = {};
        this.load();
    }
    // Returns quantity of the given item type in inventory.
    countItems(itemType) {
        var _a;
        return (_a = this.totalQuantities[itemType.name]) !== null && _a !== void 0 ? _a : 0;
    }
    // Returns the locations of the remaining item instances, newest first.
    // The history is reconstructed from the ordered coordinate keys so old saves work unchanged.
    getItemOrigins(itemName) {
        var _a;
        return ((_a = this.reconstructItemOrigins()[itemName]) !== null && _a !== void 0 ? _a : []).map(origin => (Object.assign({}, origin)));
    }
    // Returns text that describes inventory contents.
    getText(messageBox) {
        var _a;
        if (Object.keys(this.totalQuantities).length === 0 && this.totalQuantities.constructor === Object) {
            return "Find a stick and a root to craft your first club.";
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
            return null;
        }
        const coordinatesKey = this.coordinatesToString(coordinates);
        if (this.usedCoordinates.hasOwnProperty(coordinatesKey)) {
            console.log("You have already taken this " + itemType.name + ".");
            return null;
        }
        this.usedCoordinates[coordinatesKey] = true;
        const key = itemType.name;
        (_a = (_b = this.quantities)[key]) !== null && _a !== void 0 ? _a : (_b[key] = 0);
        this.quantities[key] += 1;
        this.updateTotalQuantities();
        this.save();
        const changes = itemType.prizes();
        return {
            itemType: itemType,
            prizes: changes.filter(change => change.quantity > 0),
            expenses: changes.filter(change => change.quantity < 0),
        };
    }
    load() {
        try {
            const serialized = localStorage.getItem(Inventory.STORAGE_KEY);
            if (serialized === null) {
                return;
            }
            const saveData = JSON.parse(serialized);
            if (!this.isValidSaveData(saveData)) {
                console.warn("Ignoring invalid inventory save data.");
                return;
            }
            this.quantities = Object.assign({}, saveData.quantities);
            this.usedCoordinates = Object.assign({}, saveData.usedCoordinates);
            this.updateTotalQuantities();
        }
        catch (error) {
            console.warn("Unable to load inventory save data.", error);
        }
    }
    save() {
        const saveData = {
            version: Inventory.SAVE_VERSION,
            quantities: this.quantities,
            usedCoordinates: this.usedCoordinates,
        };
        try {
            localStorage.setItem(Inventory.STORAGE_KEY, JSON.stringify(saveData));
        }
        catch (error) {
            console.warn("Unable to save inventory.", error);
        }
    }
    isValidSaveData(saveData) {
        if (typeof saveData !== "object" || saveData === null) {
            return false;
        }
        const value = saveData;
        if (value.version !== Inventory.SAVE_VERSION
            || !this.isQuantityRecord(value.quantities)
            || !this.isUsedCoordinatesRecord(value.usedCoordinates)) {
            return false;
        }
        return true;
    }
    isQuantityRecord(value) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return false;
        }
        return Object.values(value).every(quantity => typeof quantity === "number"
            && Number.isSafeInteger(quantity)
            && quantity >= 0);
    }
    isUsedCoordinatesRecord(value) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return false;
        }
        return Object.values(value).every(isUsed => isUsed === true);
    }
    reconstructItemOrigins() {
        var _a;
        const origins = {};
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = ItemType.getWithSeed(coordinates.getSeed(), origin.depth);
            if (action === null) {
                continue;
            }
            this.addOrigins(origins, action.name, 1, origin);
            for (const change of action.prizes()) {
                if (change.quantity > 0) {
                    this.addOrigins(origins, change.itemType.name, change.quantity, origin);
                }
                else {
                    // Spend old instances first, leaving recent pickups available for card art.
                    (_a = origins[change.itemType.name]) === null || _a === void 0 ? void 0 : _a.splice(change.quantity);
                }
            }
        }
        return origins;
    }
    addOrigins(origins, itemName, quantity, origin) {
        var _a;
        (_a = origins[itemName]) !== null && _a !== void 0 ? _a : (origins[itemName] = []);
        for (let index = 0; index < quantity; index++) {
            origins[itemName].unshift(Object.assign({}, origin));
        }
    }
    parseOrigin(key) {
        const parts = key.split(",");
        if (parts.length !== 3) {
            return null;
        }
        const latitude = Number(parts[0]);
        const longitude = Number(parts[1]);
        const depth = Number(parts[2]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || !Number.isSafeInteger(depth)) {
            return null;
        }
        return { latitude, longitude, depth };
    }
    // Update inventory total quantities by adding prizes and inventory.
    updateTotalQuantities() {
        var _a, _b, _c, _d;
        var _e, _f;
        this.totalQuantities = {};
        for (const [quantitiesKey, value] of Object.entries(this.quantities)) {
            // Copy value from general this.
            if (!this.totalQuantities.hasOwnProperty(quantitiesKey)) {
                this.totalQuantities[quantitiesKey] = 0;
            }
            (_a = (_e = this.totalQuantities)[quantitiesKey]) !== null && _a !== void 0 ? _a : (_e[quantitiesKey] = 0);
            this.totalQuantities[quantitiesKey] += (_b = this.quantities[quantitiesKey]) !== null && _b !== void 0 ? _b : 0;
            // Add prizes.
            const itemType = new ItemType(quantitiesKey);
            for (const prize of itemType.prizes()) {
                const itemTypeName = prize.itemType.name;
                (_c = (_f = this.totalQuantities)[itemTypeName]) !== null && _c !== void 0 ? _c : (_f[itemTypeName] = 0);
                this.totalQuantities[itemTypeName] += prize.quantity * ((_d = this.quantities[quantitiesKey]) !== null && _d !== void 0 ? _d : 0);
            }
        }
    }
    // Returns current depth based on how many dungeon entrances and stairs up the player has taken.
    getDepth() {
        return this.countItems(new ItemType("dungeon entrance")) - this.countItems(new ItemType("stairs up"));
    }
}
Inventory.STORAGE_KEY = "gpsgame.inventory";
Inventory.SAVE_VERSION = 1;
