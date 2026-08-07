import { Coordinates } from "./Coordinates.js";
import { DungeonMap } from "./DungeonMap.js";
import { HighlandMap } from "./HighlandMap.js";
import { ItemExplanation } from "./ItemExplanation.js";
import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { OriginArtwork } from "./OriginArtwork.js";
import { ShopMap } from "./ShopMap.js";
import { SurfaceMap } from "./SurfaceMap.js";
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
        return this.getProgressHint();
    }
    getProgressHint() {
        var _a, _b, _c, _d;
        const hasAnyWeapon = [
            "club",
            "stone axe",
            "sword",
            "poisoned masterwork greatsword",
            ...Inventory.TROLL_WEAPONS,
            ...Inventory.DUNGEON_WEAPONS,
        ].some(itemName => this.has(itemName));
        if (!hasAnyWeapon) {
            return this.craftingHint("club", "Craft a club now.");
        }
        if (!this.has("yarrow")) {
            return "Find yarrow to increase your starting health in fights.";
        }
        if (this.quantity("yarrow") < 2 && !this.has("yarrow poultice")) {
            return "Find one more yarrow to improve your starting health even further.";
        }
        if (!this.has("yarrow poultice") && !this.has("hay")) {
            return "Gather one more yarrow and a hay to make a yarrow poultice.";
        }
        if (!this.has("yarrow poultice")) {
            return "Find and craft a yarrow poultice to heal yourself during fights.";
        }
        const hasImprovedWeapon = this.has("stone axe")
            || this.has("iron-spiked club")
            || this.has("iron hand axe")
            || Inventory.STRONG_WEAPONS.some(itemName => this.has(itemName));
        if (!this.has("rat")) {
            if (!this.has("binding rope")) {
                return (_a = this.bindingRopeHayHint()) !== null && _a !== void 0 ? _a : "Find and craft a binding rope to capture a rat.";
            }
            if (!hasImprovedWeapon) {
                return "Find and capture a rat to gain 10 coins and another attack.";
            }
            if (this.quantity("yarrow") < 5) {
                return "Find "
                    + (5 - this.quantity("yarrow"))
                    + " more yarrow to raise your health before capturing a rat.";
            }
            return "Find and capture a rat to gain 10 coins and another attack.";
        }
        if (!hasImprovedWeapon) {
            return this.craftingHint("stone axe", "Find and craft a stone axe to deal more damage.");
        }
        if (!this.has("wooden shield") && !this.has("reinforced shield")) {
            return this.craftingHint("wooden shield", "Find and craft a wooden shield to block incoming damage.");
        }
        if (!Inventory.STRONG_WEAPONS.some(itemName => this.has(itemName))) {
            if (!this.has("crucible")) {
                const missingCrucibleMaterials = [
                    {
                        itemName: "stone",
                        quantity: Math.max(0, 5 - this.quantity("stone")),
                    },
                    {
                        itemName: "hay",
                        quantity: Math.max(0, 1 - this.quantity("hay")),
                    },
                ].filter(change => change.quantity > 0);
                if (missingCrucibleMaterials.length > 0) {
                    return "Find " + View.arrayToText(missingCrucibleMaterials.map(change => View.getQuantityText(change.itemName, change.quantity))) + " to craft a crucible for smelting iron.";
                }
                return "Find and craft a crucible to smelt iron.";
            }
            if (!this.has("furnace")) {
                const missingFurnaceMaterials = [
                    {
                        itemName: "iron ore",
                        current: this.quantity("iron ore"),
                    },
                    {
                        itemName: "hay",
                        current: this.quantity("hay"),
                    },
                ].map(material => (Object.assign(Object.assign({}, material), { missing: Math.max(0, 3 - material.current) }))).filter(material => material.missing > 0);
                if (missingFurnaceMaterials.length > 0) {
                    return "Find " + View.arrayToText(missingFurnaceMaterials.map(material => material.missing
                        + (material.current > 0 ? " more " : " ")
                        + material.itemName)) + " to smelt iron.";
                }
                if (this.getAreaId() !== 1) {
                    return "Find a dungeon entrance and descend to find a furnace for smelting iron.";
                }
                return "Find a furnace and smelt your iron ore into iron.";
            }
            if (this.getAreaId() === 1) {
                return "Return to the surface, then find and craft a sword to deal more damage.";
            }
            return this.craftingHint("sword", "Find and craft a sword to deal more damage.");
        }
        if (!this.has("orc")) {
            if (this.quantity("yarrow") < 9) {
                return "Find "
                    + (9 - this.quantity("yarrow"))
                    + " more yarrow to raise your health before capturing an orc.";
            }
            if (this.quantity("binding rope") < 2) {
                return (_b = this.bindingRopeHayHint()) !== null && _b !== void 0 ? _b : "Find 2 binding ropes to capture an orc.";
            }
            return "Find and capture an orc to gain 50 coins and a hide.";
        }
        if (!this.has("troll")) {
            if (!this.has("reinforced shield")) {
                return this.craftingHint("reinforced shield", "Find and craft a reinforced shield.");
            }
            const trollWeaponCount = [
                ...Inventory.TROLL_WEAPONS,
                "poisoned masterwork greatsword",
                ...Inventory.DUNGEON_WEAPONS.slice(1),
            ].reduce((total, itemName) => total + Math.min(3, this.quantity(itemName)), 0);
            if (trollWeaponCount < 5) {
                return this.trollWeaponHint(trollWeaponCount);
            }
            if (this.quantity("yarrow") < 13) {
                return "Find "
                    + (13 - this.quantity("yarrow"))
                    + " more yarrow to raise your health before capturing a troll.";
            }
            if (this.quantity("binding rope") < 3) {
                return (_c = this.bindingRopeHayHint()) !== null && _c !== void 0 ? _c : "Carry 3 binding ropes before capturing a troll.";
            }
            return "Find and capture a troll to gain a club, iron, and hides.";
        }
        const hasDungeonMonster = Inventory.DUNGEON_MONSTERS.some(itemName => this.has(itemName));
        if (!hasDungeonMonster && this.getAreaId() !== 1) {
            return "Find a dungeon entrance and descend to hunt dungeon monsters.";
        }
        if (!hasDungeonMonster && !this.has("binding rope")) {
            return (_d = this.bindingRopeHayHint()) !== null && _d !== void 0 ? _d : "Find and craft a binding rope before capturing dungeon monsters.";
        }
        if (!hasDungeonMonster
            && !Inventory.DUNGEON_WEAPONS.some(itemName => this.has(itemName))) {
            return "Collect dungeon materials and craft your first dungeon weapon.";
        }
        if (!hasDungeonMonster) {
            return "Find and capture the weakest dungeon monster to gain dungeon materials.";
        }
        if (this.getAreaId() === 1) {
            return "Return to the surface, then find a highland gate to enter the rugged realm.";
        }
        if (this.getAreaId() !== 3) {
            return "Find a highland gate and enter the rugged realm.";
        }
        const spellCount = [
            "spell of force",
            "spell of mending",
            "spell of warding",
        ].filter(itemName => this.has(itemName)).length;
        if (spellCount === 0) {
            return "Find an enormous castle and search its passages for a magician who sells permanent spells.";
        }
        if (spellCount < 3) {
            return "Search another castle for a different permanent spell.";
        }
        return "Explore the highlands and strengthen your permanent spells.";
    }
    bindingRopeHayHint() {
        const missingHay = Math.max(0, 2 - this.quantity("hay"));
        if (missingHay === 0) {
            return null;
        }
        return "Get "
            + (missingHay === 1 ? "a hay" : missingHay + " hay")
            + " for a binding rope.";
    }
    trollWeaponHint(currentWeaponCount) {
        let remaining = 5 - currentWeaponCount;
        const targets = [];
        for (const itemName of Inventory.TROLL_CRAFT_WEAPONS) {
            const quantity = Math.min(remaining, Math.max(0, 3 - this.quantity(itemName)));
            if (quantity > 0) {
                targets.push({ itemName, quantity });
                remaining -= quantity;
            }
            if (remaining === 0) {
                break;
            }
        }
        const available = Object.assign({}, this.totalQuantities);
        const missing = {};
        const rawMaterials = new Set(Inventory.TROLL_WEAPON_RAW_MATERIALS);
        const requireItem = (itemName, quantity) => {
            var _a, _b, _c;
            const used = Math.min((_a = available[itemName]) !== null && _a !== void 0 ? _a : 0, quantity);
            available[itemName] = ((_b = available[itemName]) !== null && _b !== void 0 ? _b : 0) - used;
            const required = quantity - used;
            if (required === 0) {
                return;
            }
            const ingredients = new ItemType(itemName).prizes()
                .filter(change => change.quantity < 0);
            if (rawMaterials.has(itemName) || ingredients.length === 0) {
                missing[itemName] = ((_c = missing[itemName]) !== null && _c !== void 0 ? _c : 0) + required;
                return;
            }
            for (const ingredient of ingredients) {
                requireItem(ingredient.itemType.name, -ingredient.quantity * required);
            }
        };
        for (const target of targets) {
            for (const ingredient of new ItemType(target.itemName).prizes()
                .filter(change => change.quantity < 0)) {
                requireItem(ingredient.itemType.name, -ingredient.quantity * target.quantity);
            }
        }
        const targetText = View.arrayToText(targets.map(target => View.getQuantityText(target.itemName, target.quantity)));
        const missingText = Inventory.TROLL_WEAPON_RAW_MATERIALS
            .filter(itemName => { var _a; return ((_a = missing[itemName]) !== null && _a !== void 0 ? _a : 0) > 0; })
            .map(itemName => {
            var _a;
            const quantity = (_a = missing[itemName]) !== null && _a !== void 0 ? _a : 0;
            return itemName === "iron" && quantity === 1
                ? "1 iron"
                : View.getQuantityText(itemName, quantity);
        });
        const reason = " Five upgraded weapons will prepare you to capture a troll.";
        if (missingText.length > 0) {
            return "Find " + View.arrayToText(missingText)
                + " for " + targetText + "." + reason;
        }
        return "Find and craft " + targetText + "." + reason;
    }
    craftingHint(actionName, readyText) {
        const missing = new ItemType(actionName).prizes()
            .filter(change => change.quantity < 0)
            .map(change => ({
            itemName: change.itemType.name,
            quantity: Math.max(0, -change.quantity - this.quantity(change.itemType.name)),
        }))
            .filter(change => change.quantity > 0);
        if (missing.length === 0) {
            return readyText;
        }
        const missingText = missing.map(change => View.getQuantityText(change.itemName, change.quantity));
        return "Find " + View.arrayToText(missingText)
            + " to craft " + View.getQuantityText(actionName, 1) + ".";
    }
    has(itemName) {
        return this.quantity(itemName) > 0;
    }
    quantity(itemName) {
        var _a;
        return (_a = this.totalQuantities[itemName]) !== null && _a !== void 0 ? _a : 0;
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
        const header = document.createElement("header");
        header.className = "dialog-header";
        header.append(title, closeButton);
        const list = document.createElement("div");
        list.className = "inventory-list";
        for (const [name, quantity] of entries) {
            const item = document.createElement("article");
            item.className = "inventory-entry";
            const origin = (_a = this.getItemOrigins(name)[0]) !== null && _a !== void 0 ? _a : {
                latitude: 0,
                longitude: 0,
                areaId: this.getAreaId(),
            };
            const header = document.createElement("header");
            header.className = "inventory-entry-header";
            const artwork = OriginArtwork.create(name, origin, "inventory-entry-art");
            OriginArtwork.containSubject(artwork, "inventory-entry-art-subject-frame");
            const identity = document.createElement("div");
            identity.className = "inventory-entry-identity";
            const label = document.createElement("h2");
            label.className = "inventory-entry-name";
            label.textContent = ItemExplanation.displayName(name);
            const category = document.createElement("span");
            category.className = "inventory-entry-category";
            category.textContent = ItemExplanation.categoryFor(name);
            identity.append(label, category);
            const quantityBadge = document.createElement("span");
            quantityBadge.className = "inventory-entry-quantity";
            quantityBadge.textContent = "×" + quantity;
            quantityBadge.setAttribute("aria-label", "Quantity " + quantity);
            header.append(artwork, identity, quantityBadge);
            const explanation = ItemExplanation.element(name, origin.latitude, origin.longitude, origin.areaId);
            explanation.classList.add("inventory-entry-description");
            item.append(header, explanation);
            list.append(item);
        }
        const content = document.createElement("div");
        content.className = "dialog-content";
        content.append(list);
        dialog.append(header, content);
        dialog.addEventListener("close", () => dialog.remove(), { once: true });
        document.body.append(dialog);
        dialog.showModal();
    }
    isItemTypeTaken(itemType) {
        var _a;
        return ((_a = this.totalQuantities[itemType.name]) !== null && _a !== void 0 ? _a : 0) > 0;
    }
    coordinatesToString(coordinates) {
        return coordinates.latitude + "," + coordinates.longitude + "," + this.getAreaId();
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
        const areaId = this.getAreaId();
        let itemType = this.itemAtCoordinates(coordinates, areaId);
        if (itemType === null) {
            console.log("There's no item at " + this.coordinatesToString(coordinates));
            return null;
        }
        const coordinatesKey = this.coordinatesToString(coordinates);
        if (this.usedCoordinates.hasOwnProperty(coordinatesKey)) {
            console.log("You have already taken this " + itemType.name + ".");
            return null;
        }
        if (itemType.name === "stairs up") {
            this.exitArea();
            return { itemType, prizes: [], expenses: [] };
        }
        this.usedCoordinates[coordinatesKey] = true;
        this.reconstructQuantities();
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
            this.usedCoordinates = Object.assign({}, saveData.usedCoordinates);
            this.reconstructQuantities();
            if (saveData.version !== Inventory.SAVE_VERSION) {
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
        if (!this.isUsedCoordinatesRecord(value.usedCoordinates)) {
            return false;
        }
        if (value.version === Inventory.SAVE_VERSION) {
            return true;
        }
        return value.version === 1
            && this.isQuantityRecord(value.quantities);
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
            const action = this.itemAtCoordinates(coordinates, origin.areaId);
            if (action === null) {
                continue;
            }
            if (!ItemType.isTransientAction(action.name)) {
                this.addOrigins(origins, action.name, 1, origin);
            }
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
        const areaId = Number(parts[2]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || !Number.isSafeInteger(areaId)) {
            return null;
        }
        return { latitude, longitude, areaId };
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
            if (!ItemType.isTransientAction(quantitiesKey)) {
                if (!this.totalQuantities.hasOwnProperty(quantitiesKey)) {
                    this.totalQuantities[quantitiesKey] = 0;
                }
                (_a = (_e = this.totalQuantities)[quantitiesKey]) !== null && _a !== void 0 ? _a : (_e[quantitiesKey] = 0);
                this.totalQuantities[quantitiesKey] +=
                    (_b = this.quantities[quantitiesKey]) !== null && _b !== void 0 ? _b : 0;
            }
            // Add prizes.
            const itemType = new ItemType(quantitiesKey);
            for (const prize of itemType.prizes()) {
                const itemTypeName = prize.itemType.name;
                (_c = (_f = this.totalQuantities)[itemTypeName]) !== null && _c !== void 0 ? _c : (_f[itemTypeName] = 0);
                this.totalQuantities[itemTypeName] += prize.quantity * ((_d = this.quantities[quantitiesKey]) !== null && _d !== void 0 ? _d : 0);
            }
        }
    }
    reconstructQuantities() {
        var _a;
        var _b, _c;
        this.quantities = {};
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = this.itemAtCoordinates(coordinates, origin.areaId);
            if (action === null
                || Inventory.REMOVED_ITEM_NAMES.includes(action.name)) {
                continue;
            }
            (_a = (_b = this.quantities)[_c = action.name]) !== null && _a !== void 0 ? _a : (_b[_c] = 0);
            this.quantities[action.name]++;
        }
        this.updateTotalQuantities();
    }
    getAreaId() {
        var _a;
        let areaId = 0;
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if ((origin === null || origin === void 0 ? void 0 : origin.areaId) !== 0) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = (_a = ItemType.getWithSeed(coordinates.getSeed(), 0)) === null || _a === void 0 ? void 0 : _a.name;
            if (action === "dungeon entrance") {
                areaId = 1;
            }
            else if (action === "shop entrance") {
                areaId = 2;
            }
            else if (action === "highland gate") {
                areaId = 3;
            }
        }
        return areaId;
    }
    exitArea() {
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = this.itemAtCoordinates(coordinates, origin.areaId);
            if (action !== null && [
                "dungeon entrance",
                "highland gate",
                "shop entrance",
                "stairs up",
            ].includes(action.name)) {
                delete this.usedCoordinates[key];
            }
        }
        this.reconstructQuantities();
        this.save();
        for (const listener of this.changeListeners) {
            listener();
        }
    }
    itemAtCoordinates(coordinates, areaId) {
        if (areaId === 1) {
            return DungeonMap.itemAt(coordinates);
        }
        if (areaId === 2 && ShopMap.isOutside(coordinates)) {
            return ItemType.getShopOutsideWithSeed(coordinates.getSeed());
        }
        if (areaId === 3) {
            return HighlandMap.itemAt(coordinates);
        }
        if (areaId === 0) {
            return SurfaceMap.itemAt(coordinates);
        }
        return ItemType.getWithSeed(coordinates.getSeed(), areaId);
    }
}
Inventory.STORAGE_KEY = "gpsgame.inventory";
Inventory.SAVE_VERSION = 2;
Inventory.REMOVED_ITEM_NAMES = [
    "body shop",
    "nature shop",
    "smelter",
    "weapon shop",
];
Inventory.TROLL_WEAPONS = [
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
];
Inventory.TROLL_CRAFT_WEAPONS = [
    "iron-spiked club",
    "iron hand axe",
    "arming sword",
];
Inventory.TROLL_WEAPON_RAW_MATERIALS = [
    "stick",
    "stone",
    "root",
    "iron",
    "hide",
];
Inventory.DUNGEON_WEAPONS = [
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
];
Inventory.DUNGEON_MONSTERS = [
    "bone rat", "cave bat", "giant spider", "plague beetle",
    "crypt hound", "skeletal guard", "dungeon scavenger",
    "goblin cutthroat", "tomb robber", "cave crawler", "ghoul",
    "wight", "cultist", "armored skeleton", "brood spider",
    "cave troll", "dungeon orc", "plague bearer", "stone sentinel",
    "crypt knight", "banshee", "necromancer", "ogre jailer",
    "basilisk", "minotaur", "vampire", "lich", "bone colossus",
    "abyssal knight", "dungeon dragon",
];
Inventory.STRONG_WEAPONS = [
    "sword",
    "flanged mace",
    "bearded battle axe",
    "arming sword",
    "war hammer",
    "longsword",
    "two-handed battle axe",
    "poleaxe",
    "masterwork greatsword",
    "poisoned masterwork greatsword",
    ...Inventory.DUNGEON_WEAPONS.slice(3),
];
