import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
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
export declare class Inventory {
    private static readonly STORAGE_KEY;
    private static readonly SAVE_VERSION;
    quantities: Record<string, number>;
    totalQuantities: Record<string, number>;
    usedCoordinates: Record<string, boolean>;
    private readonly changeListeners;
    constructor();
    countItems(itemType: ItemType): number;
    countItemTypes(): number;
    onChange(listener: () => void): void;
    getItemOrigins(itemName: string): ItemOrigin[];
    getText(): HTMLDivElement | "Find a stick and a root to craft your first club.";
    openDialog(): void;
    isItemTypeTaken(itemType: ItemType): boolean;
    coordinatesToString(coordinates: Coordinates): string;
    isItemTaken(coordinates: Coordinates): boolean;
    takeItem(coordinates: Coordinates): ItemActionResult | null;
    private load;
    private save;
    private isValidSaveData;
    private isQuantityRecord;
    private isUsedCoordinatesRecord;
    private reconstructItemOrigins;
    private addOrigins;
    private parseOrigin;
    private entries;
    updateTotalQuantities(): void;
    getDepth(): number;
}
//# sourceMappingURL=Inventory.d.ts.map