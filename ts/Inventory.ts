import { Coordinates } from "./Coordinates.js";
import { ItemType }    from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { OriginArtwork } from "./OriginArtwork.js";
import { ShopMap } from "./ShopMap.js";
import { View }        from './View.js';

interface InventorySaveData {
    version: number;
    quantities: Record<string, number>;
    usedCoordinates: Record<string, boolean>;
}

export interface ItemActionResult {
    itemType: ItemType;
    prizes: ItemTypeAndQuantity[];
    expenses: ItemTypeAndQuantity[];
}

export interface ItemOrigin {
    latitude: number;
    longitude: number;
    areaId: number;
}

export class Inventory {
    private static readonly STORAGE_KEY = "gpsgame.inventory";
    private static readonly SAVE_VERSION = 1;
    private static readonly REMOVED_ITEM_NAMES = [
        "body shop",
        "nature shop",
        "smelter",
        "weapon shop",
    ];
    private static readonly TROLL_WEAPONS = [
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
    private static readonly DUNGEON_WEAPONS = [
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
    private static readonly STRONG_WEAPONS = [
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

    quantities:      Record<string, number>  = {};
    totalQuantities: Record<string, number>  = {};
    usedCoordinates: Record<string, boolean> = {};
    private readonly changeListeners: (() => void)[] = [];
    constructor() {
        this.load();
    }

    // Returns quantity of the given item type in inventory.
    countItems(itemType: ItemType): number {
        return this.totalQuantities[itemType.name] ?? 0;
    }

    countItemTypes(): number {
        return this.entries().length;
    }

    onChange(listener: () => void): void {
        this.changeListeners.push(listener);
    }

    // Returns the locations of the remaining item instances, newest first.
    // The history is reconstructed from the ordered coordinate keys so old saves work unchanged.
    getItemOrigins(itemName: string): ItemOrigin[] {
        return (this.reconstructItemOrigins()[itemName] ?? []).map(origin => ({ ...origin }));
    }

    // Returns text that describes inventory contents.
    getText() {
        const entries = this.entries();
        if (entries.length === 0) {
            return this.getProgressHint();
        }

        const items = entries.map(([name, quantity]) =>
            View.getQuantityText(name, quantity),
        );

        const div = document.createElement("div");
        div.className = "message inventory-status";
        div.textContent = this.getProgressHint()
            + " You have " + View.arrayToText(items) + ".";

        return div;
    }

    getProgressHint(): string {
        const hasAnyWeapon = [
            "club",
            "stone axe",
            "sword",
            "poisoned masterwork greatsword",
            ...Inventory.TROLL_WEAPONS,
            ...Inventory.DUNGEON_WEAPONS,
        ].some(itemName => this.has(itemName));
        if (!hasAnyWeapon) {
            return this.craftingHint(
                "club",
                "your first club",
                "You have what you need—find a club and craft it now.",
            );
        }
        if (!this.has("yarrow")) {
            return "Next: find a yarrow plant so you have health for your first fight.";
        }
        const hasImprovedWeapon = this.has("stone axe")
            || this.has("iron-spiked club")
            || this.has("iron hand axe")
            || Inventory.STRONG_WEAPONS.some(itemName => this.has(itemName));
        if (!this.has("rat")) {
            if (!this.has("torch")) {
                return this.craftingHint(
                    "torch",
                    "a torch",
                    "Materials ready—find a torch and craft it.",
                );
            }
            if (!hasImprovedWeapon) {
                return "Next: try fighting a rat. If you lose, gather more yarrow and craft a stone axe.";
            }
            if (this.quantity("yarrow") < 5) {
                return "Next: gather "
                    + View.getQuantityText(
                        "yarrow",
                        5 - this.quantity("yarrow"),
                    )
                    + " before trying the rat again.";
            }

            return "Next: find and fight a rat.";
        }
        if (!hasImprovedWeapon) {
            return this.craftingHint(
                "stone axe",
                "a stone axe",
                "Materials ready—find a stone axe and craft it.",
            );
        }
        if (!this.has("wooden shield") && !this.has("reinforced shield")) {
            return this.craftingHint(
                "wooden shield",
                "a wooden shield",
                "Materials ready—find a wooden shield and craft it.",
            );
        }
        if (!Inventory.STRONG_WEAPONS.some(itemName => this.has(itemName))) {
            return this.craftingHint(
                "sword",
                "a sword; find iron in a shop or dungeon",
                "Materials ready—find a sword and craft it.",
            );
        }
        if (!this.has("orc")) {
            if (this.quantity("yarrow") < 9) {
                return "Next: gather "
                    + View.getQuantityText(
                        "yarrow",
                        9 - this.quantity("yarrow"),
                    )
                    + " before challenging an orc.";
            }
            if (this.quantity("torch") < 3) {
                return "Next: carry 3 torches before challenging an orc.";
            }

            return "Ready for the next challenge—find and fight an orc.";
        }
        if (!this.has("troll")) {
            if (!this.has("reinforced shield")) {
                return this.craftingHint(
                    "reinforced shield",
                    "a reinforced shield",
                    "Materials ready—find a reinforced shield and craft it.",
                );
            }
            const trollWeaponCount = [
                ...Inventory.TROLL_WEAPONS,
                "poisoned masterwork greatsword",
                ...Inventory.DUNGEON_WEAPONS.slice(1),
            ].reduce(
                (total, itemName) =>
                    total + Math.min(3, this.quantity(itemName)),
                0,
            );
            if (trollWeaponCount < 5) {
                return "Next: craft more upgraded weapons for a troll ("
                    + trollWeaponCount + " of 5 ready).";
            }
            if (this.quantity("yarrow") < 13) {
                return "Next: gather "
                    + View.getQuantityText(
                        "yarrow",
                        13 - this.quantity("yarrow"),
                    )
                    + " before challenging a troll.";
            }
            if (this.quantity("torch") < 3) {
                return "Next: carry 3 torches before challenging a troll.";
            }

            return "Ready for a hard battle—find and fight a troll.";
        }
        if (this.getAreaId() !== 1) {
            return "Next: find a dungeon entrance and explore underground.";
        }
        if (!this.has("grave dust")) {
            return "Next: collect grave dust before fighting a dungeon monster.";
        }
        if (!Inventory.DUNGEON_WEAPONS.some(itemName => this.has(itemName))) {
            return "Next: collect dungeon materials and craft your first dungeon weapon.";
        }

        return "Next: fight dungeon monsters from weakest upward and use their rewards for stronger weapons.";
    }

    private craftingHint(
        actionName: string,
        goal: string,
        readyText: string,
    ): string {
        const missing = new ItemType(actionName).prizes()
            .filter(change => change.quantity < 0)
            .map(change => ({
                itemName: change.itemType.name,
                quantity: Math.max(
                    0,
                    -change.quantity - this.quantity(change.itemType.name),
                ),
            }))
            .filter(change => change.quantity > 0);
        if (missing.length === 0) {
            return readyText;
        }
        const missingText = missing.map(change =>
            View.getQuantityText(change.itemName, change.quantity)
        );

        return "Next: find " + View.arrayToText(missingText) + " for " + goal + ".";
    }

    private has(itemName: string): boolean {
        return this.quantity(itemName) > 0;
    }

    private quantity(itemName: string): number {
        return this.totalQuantities[itemName] ?? 0;
    }

    openDialog(): void {
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
            const origin = this.getItemOrigins(name)[0] ?? {
                latitude: 0,
                longitude: 0,
                areaId: this.getAreaId(),
            };
            item.append(OriginArtwork.create(
                name,
                origin,
                "inventory-entry-art",
            ));
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

    isItemTypeTaken(itemType: ItemType): boolean {
        return (this.totalQuantities[itemType.name] ?? 0) > 0;
    }

    coordinatesToString(coordinates: Coordinates): string {
        return coordinates.latitude + "," + coordinates.longitude + "," + this.getAreaId();
    }

    // Returns true if item in the given location has been picked up.
    isItemTaken(coordinates: Coordinates): boolean {
        if (this.usedCoordinates.hasOwnProperty(this.coordinatesToString(coordinates))) {
            return true;
        }

        return false;
    }

    // Adds item in the given coordinates to inventory.
    takeItem(coordinates: Coordinates): ItemActionResult|null {
        let seed = coordinates.getSeed();
        const areaId = this.getAreaId();
        let itemType = areaId === 2 && ShopMap.isOutside(coordinates)
            ? ItemType.getShopOutsideWithSeed(seed)
            : ItemType.getWithSeed(seed, areaId);
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
        const key = itemType.name;
        this.quantities[key] ??= 0;
        this.quantities[key]  += 1;
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

    private load(): void {
        try {
            const serialized = localStorage.getItem(Inventory.STORAGE_KEY);
            if (serialized === null) {
                return;
            }

            const saveData: unknown = JSON.parse(serialized);
            if (!this.isValidSaveData(saveData)) {
                console.warn("Ignoring invalid inventory save data.");

                return;
            }

            this.quantities = { ...saveData.quantities };
            let saveNeedsCleanup = false;
            if (Object.prototype.hasOwnProperty.call(this.quantities, "heart")) {
                const legacyHearts = this.quantities["heart"] ?? 0;
                if (legacyHearts > 0) {
                    this.quantities["yarrow"] =
                        (this.quantities["yarrow"] ?? 0) + legacyHearts;
                }
                delete this.quantities["heart"];
                saveNeedsCleanup = true;
            }
            if (Object.prototype.hasOwnProperty.call(this.quantities, "iron")) {
                const legacySmelts = this.quantities["iron"] ?? 0;
                if (legacySmelts > 0) {
                    this.quantities["furnace"] =
                        (this.quantities["furnace"] ?? 0) + legacySmelts;
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
            this.usedCoordinates = { ...saveData.usedCoordinates };
            this.updateTotalQuantities();
            if (saveNeedsCleanup) {
                this.save();
            }
        } catch (error) {
            console.warn("Unable to load inventory save data.", error);
        }
    }

    private save(): void {
        const saveData: InventorySaveData = {
            version: Inventory.SAVE_VERSION,
            quantities: this.quantities,
            usedCoordinates: this.usedCoordinates,
        };

        try {
            localStorage.setItem(Inventory.STORAGE_KEY, JSON.stringify(saveData));
        } catch (error) {
            console.warn("Unable to save inventory.", error);
        }
    }

    private isValidSaveData(saveData: unknown): saveData is InventorySaveData {
        if (typeof saveData !== "object" || saveData === null) {
            return false;
        }

        const value = saveData as Record<string, unknown>;
        if (value.version !== Inventory.SAVE_VERSION
            || !this.isQuantityRecord(value.quantities)
            || !this.isUsedCoordinatesRecord(value.usedCoordinates)
        ) {
            return false;
        }

        return true;
    }

    private isQuantityRecord(value: unknown): value is Record<string, number> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return false;
        }

        return Object.values(value).every(quantity =>
            typeof quantity === "number"
            && Number.isSafeInteger(quantity)
            && quantity >= 0
        );
    }

    private isUsedCoordinatesRecord(value: unknown): value is Record<string, boolean> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return false;
        }

        return Object.values(value).every(isUsed => isUsed === true);
    }

    private reconstructItemOrigins(): Record<string, ItemOrigin[]> {
        const origins: Record<string, ItemOrigin[]> = {};
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = origin.areaId === 2 && ShopMap.isOutside(coordinates)
                ? ItemType.getShopOutsideWithSeed(coordinates.getSeed())
                : ItemType.getWithSeed(coordinates.getSeed(), origin.areaId);
            if (action === null) {
                continue;
            }

            this.addOrigins(origins, action.name, 1, origin);
            for (const change of action.prizes()) {
                if (change.quantity > 0) {
                    this.addOrigins(origins, change.itemType.name, change.quantity, origin);
                } else {
                    // Spend old instances first, leaving recent pickups available for card art.
                    origins[change.itemType.name]?.splice(change.quantity);
                }
            }
        }

        return origins;
    }

    private addOrigins(
        origins: Record<string, ItemOrigin[]>,
        itemName: string,
        quantity: number,
        origin: ItemOrigin,
    ): void {
        origins[itemName] ??= [];
        for (let index = 0; index < quantity; index++) {
            origins[itemName]!.unshift({ ...origin });
        }
    }

    private parseOrigin(key: string): ItemOrigin|null {
        const parts = key.split(",");
        if (parts.length !== 3) {
            return null;
        }
        const latitude = Number(parts[0]);
        const longitude = Number(parts[1]);
        const areaId = Number(parts[2]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || !Number.isSafeInteger(areaId)
        ) {
            return null;
        }

        return { latitude, longitude, areaId };
    }

    private entries(): [string, number][] {
        return Object.entries(this.totalQuantities).filter(
            (entry): entry is [string, number] => entry[1] !== 0,
        );
    }

    // Update inventory total quantities by adding prizes and inventory.
    updateTotalQuantities(): void {
        this.totalQuantities = {};
        for (const [quantitiesKey, value] of Object.entries(this.quantities)) {
            // Copy value from general this.
            if (!this.totalQuantities.hasOwnProperty(quantitiesKey)) {
                this.totalQuantities[quantitiesKey] = 0;
            }
            this.totalQuantities[quantitiesKey] ??= 0;
            this.totalQuantities[quantitiesKey] += this.quantities[quantitiesKey] ?? 0;

            // Add prizes.
            const itemType = new ItemType(quantitiesKey);
            for (const prize of itemType.prizes()) {
                const itemTypeName = prize.itemType.name;
                this.totalQuantities[itemTypeName] ??= 0;
                this.totalQuantities[itemTypeName] += prize.quantity * (this.quantities[quantitiesKey] ?? 0);
            }
        }
    }

    getAreaId(): number {
        let areaId = 0;
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin?.areaId !== 0) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = ItemType.getWithSeed(coordinates.getSeed(), 0)?.name;
            if (action === "dungeon entrance") {
                areaId = 1;
            } else if (action === "shop entrance") {
                areaId = 2;
            }
        }

        return areaId;
    }

    exitArea(): void {
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = origin.areaId === 2 && ShopMap.isOutside(coordinates)
                ? ItemType.getShopOutsideWithSeed(coordinates.getSeed())
                : ItemType.getWithSeed(coordinates.getSeed(), origin.areaId);
            if (action !== null && [
                "dungeon entrance",
                "shop entrance",
                "stairs up",
            ].includes(action.name)) {
                delete this.usedCoordinates[key];
                if ((this.quantities[action.name] ?? 0) > 0) {
                    this.quantities[action.name]!--;
                }
            }
        }
        this.updateTotalQuantities();
        this.save();
        for (const listener of this.changeListeners) {
            listener();
        }
    }
}
