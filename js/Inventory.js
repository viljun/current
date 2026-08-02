import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { OriginArtwork } from "./OriginArtwork.js";
import { View } from './View.js';
export class Inventory {
    constructor() {
        this.quantities = {};
        this.totalQuantities = {};
        this.usedCoordinates = {};
        this.changeListeners = [];
        this.load();
    }
    // Returns quantity of the given item type in inventory.
    countItems(itemType) {
        var _a;
        return (_a = this.totalQuantities[itemType.name]) !== null && _a !== void 0 ? _a : 0;
    }
    countItemTypes() {
        return this.entries().length;
    }
    onChange(listener) {
        this.changeListeners.push(listener);
    }
    // Returns the locations of the remaining item instances, newest first.
    // The history is reconstructed from the ordered coordinate keys so old saves work unchanged.
    getItemOrigins(itemName) {
        var _a;
        return ((_a = this.reconstructItemOrigins()[itemName]) !== null && _a !== void 0 ? _a : []).map(origin => (Object.assign({}, origin)));
    }
    // Returns text that describes inventory contents.
    getText() {
        const entries = this.entries();
        if (entries.length === 0) {
            return "Find a stick and a root to craft your first club.";
        }
        const items = entries.map(([name, quantity]) => View.getQuantityText(name, quantity));
        const div = document.createElement("div");
        div.className = "message inventory-status";
        div.textContent = "You have " + View.arrayToText(items) + ".";
        return div;
    }
    openDialog() {
        var _a;
        const entries = this.entries();
        const dialog = document.createElement("dialog");
        dialog.className = "inventory-dialog";
        dialog.setAttribute("aria-labelledby", "inventory-title");
        const title = document.createElement("h1");
        title.id = "inventory-title";
        title.textContent = "Inventory";
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", "Close inventory");
        closeButton.onclick = () => dialog.close();
        const list = document.createElement("div");
        list.className = "inventory-list";
        for (const [name, quantity] of entries) {
            const item = document.createElement("article");
            item.className = "inventory-entry";
            const origin = (_a = this.getItemOrigins(name)[0]) !== null && _a !== void 0 ? _a : {
                latitude: 0,
                longitude: 0,
                depth: this.getDepth(),
            };
            item.append(OriginArtwork.create(name, origin, "inventory-entry-art"));
            const label = document.createElement("strong");
            label.textContent = View.getQuantityText(name, quantity);
            item.append(label);
            list.append(item);
        }
        dialog.append(closeButton, title, list);
        dialog.addEventListener("close", () => dialog.remove(), { once: true });
        document.body.append(dialog);
        dialog.showModal();
    }
    isItemTypeTaken(itemType) {
        var _a;
        return ((_a = this.totalQuantities[itemType.name]) !== null && _a !== void 0 ? _a : 0) > 0;
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
        for (const listener of this.changeListeners) {
            listener();
        }
        const changes = itemType.prizes();
        return {
            itemType: itemType,
            prizes: changes.filter(change => change.quantity > 0),
            expenses: changes.filter(change => change.quantity < 0),
        };
    }
    load() {
        var _a, _b, _c, _d;
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
            let saveNeedsCleanup = false;
            if (Object.prototype.hasOwnProperty.call(this.quantities, "heart")) {
                const legacyHearts = (_a = this.quantities["heart"]) !== null && _a !== void 0 ? _a : 0;
                if (legacyHearts > 0) {
                    this.quantities["yarrow"] =
                        ((_b = this.quantities["yarrow"]) !== null && _b !== void 0 ? _b : 0) + legacyHearts;
                }
                delete this.quantities["heart"];
                saveNeedsCleanup = true;
            }
            if (Object.prototype.hasOwnProperty.call(this.quantities, "iron")) {
                const legacySmelts = (_c = this.quantities["iron"]) !== null && _c !== void 0 ? _c : 0;
                if (legacySmelts > 0) {
                    this.quantities["furnace"] =
                        ((_d = this.quantities["furnace"]) !== null && _d !== void 0 ? _d : 0) + legacySmelts;
                }
                delete this.quantities["iron"];
                saveNeedsCleanup = true;
            }
            for (const name of Inventory.REMOVED_ITEM_NAMES) {
                if (Object.prototype.hasOwnProperty.call(this.quantities, name)) {
                    delete this.quantities[name];
                    saveNeedsCleanup = true;
                }
            }
            this.usedCoordinates = Object.assign({}, saveData.usedCoordinates);
            this.updateTotalQuantities();
            if (saveNeedsCleanup) {
                this.save();
            }
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
    entries() {
        return Object.entries(this.totalQuantities).filter((entry) => entry[1] !== 0);
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
Inventory.REMOVED_ITEM_NAMES = [
    "body shop",
    "nature shop",
    "smelter",
    "weapon shop",
];
