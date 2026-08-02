import { Coordinates } from "./Coordinates.js";
import { ItemType }    from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { OriginArtwork } from "./OriginArtwork.js";
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
    depth: number;
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
            return "Find a stick and a root to craft your first club.";
        }

        const items = entries.map(([name, quantity]) =>
            View.getQuantityText(name, quantity),
        );

        const div = document.createElement("div");
        div.className = "message inventory-status";
        div.textContent = "You have " + View.arrayToText(items) + ".";

        return div;
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
                depth: this.getDepth(),
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
        return coordinates.latitude + "," + coordinates.longitude + "," + this.getDepth();
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
            const action = ItemType.getWithSeed(coordinates.getSeed(), origin.depth);
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
        const depth = Number(parts[2]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || !Number.isSafeInteger(depth)
        ) {
            return null;
        }

        return { latitude, longitude, depth };
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

    // Returns current depth based on how many dungeon entrances and stairs up the player has taken.
    getDepth(): number {
        return this.countItems(new ItemType("dungeon entrance")) - this.countItems(new ItemType("stairs up"));
    }
}
