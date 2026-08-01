import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
export declare class Inventory {
    quantities: Record<string, number>;
    totalQuantities: Record<string, number>;
    usedCoordinates: Record<string, boolean>;
    constructor();
    countItems(itemType: ItemType): number;
    getText(messageBox: HTMLDivElement): HTMLDivElement | "Tap something interesting!";
    isItemTypeTaken(itemType: ItemType): boolean;
    coordinatesToString(coordinates: Coordinates): string;
    isItemTaken(coordinates: Coordinates): boolean;
    takeItem(coordinates: Coordinates): void;
    updateTotalQuantities(): void;
    getDepth(): number;
}
//# sourceMappingURL=Inventory.d.ts.map