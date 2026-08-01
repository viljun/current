import { Coordinates } from "./Coordinates.js";
import { ItemType }    from "./ItemType.js";
import { View }        from './View.js';

interface InventorySaveData {
    version: number;
    quantities: Record<string, number>;
    usedCoordinates: Record<string, boolean>;
}

export class Inventory {
    private static readonly STORAGE_KEY = "gpsgame.inventory";
    private static readonly SAVE_VERSION = 1;

    quantities:      Record<string, number>  = {};
    totalQuantities: Record<string, number>  = {};
    usedCoordinates: Record<string, boolean> = {};
    constructor() {
        this.load();
    }

    // Returns quantity of the given item type in inventory.
    countItems(itemType: ItemType): number {
        return this.totalQuantities[itemType.name] ?? 0;
    }

    // Returns text that describes inventory contents.
    getText(messageBox: HTMLDivElement) {
        if (Object.keys(this.totalQuantities).length === 0 && this.totalQuantities.constructor === Object) {
            return "Welcome! Explore nearby items, then find a stick and a root to craft your first club.";
        }

        const items = [];
        for (const key in this.totalQuantities) {
            const total_quantity = this.totalQuantities[key] ?? 0;
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
            }
            div.append(button);
        } else {
            div.append(text + ".");
        }

        return div;
    }

    isItemTypeTaken(itemType: ItemType): boolean {
        if (this.totalQuantities.hasOwnProperty(itemType.name)) {
            console.log("Taken?");
            if (this.totalQuantities[itemType.name] ?? 0 > 0) {
                console.log("y");
                return true;
            }
            console.log("n");
        }

        return false;
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
    takeItem(coordinates: Coordinates): void {
        let seed = coordinates.getSeed();
        let itemType = ItemType.getWithSeed(seed, this.getDepth());
        if (itemType === null) {
            console.log("There's no item at " + this.coordinatesToString(coordinates));

            return;
        }
        const coordinatesKey = this.coordinatesToString(coordinates);
        if (this.usedCoordinates.hasOwnProperty(coordinatesKey)) {
            console.log("You have already taken this " + itemType.name + ".");

            return;
        }

        this.usedCoordinates[coordinatesKey] = true;
        const key = itemType.name;
        this.quantities[key] ??= 0;
        this.quantities[key]  += 1;
        this.updateTotalQuantities();
        this.save();
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
            this.usedCoordinates = { ...saveData.usedCoordinates };
            this.updateTotalQuantities();
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
            for (const prize of itemType.prizes() ?? []) {
                const itemTypeName = prize.itemType.name;
                if (!this.totalQuantities.hasOwnProperty(itemType.name)) {
                    this.totalQuantities[itemTypeName] = 0;
                }
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
