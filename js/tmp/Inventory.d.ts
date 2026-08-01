import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
export declare class Inventory {
    quantities: {
        [key: string]: number;
    };
    totalQuantities: {
        [key: string]: number;
    };
    usedCoordinates: {
        [key: string]: boolean;
    };
    constructor();
    getText(messageBox: HTMLDivElement): HTMLDivElement | "Tap something interesting!";
    isItemTypeTaken(itemType: ItemType): boolean;
    isItemTaken(coordinates: Coordinates): boolean;
    takeItem(coordinates: Coordinates): void;
    updateTotalQuantities(): void;
}
//# sourceMappingURL=Inventory.d.ts.map