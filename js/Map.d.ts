export declare const ACCURACY_MULTIPLIER = 10000;
import { Coordinates } from "./Coordinates.js";
import { Inventory } from "./Inventory.js";
export declare class Map {
    slidingAnimationInProgress: boolean;
    map: HTMLDivElement;
    messageBox: HTMLDivElement;
    cols: number;
    rows: number;
    inventory: Inventory;
    coordinates: Coordinates;
    selected_coordinates: Coordinates | null;
    tile_size: number;
    isExploreMode: () => boolean;
    constructor(map: HTMLDivElement, messageBox: HTMLDivElement, cols: number, rows: number, inventory: Inventory, coordinates: Coordinates, tile_size: number, isExploreMode: () => boolean);
    show({ new_coordinates, }: {
        new_coordinates?: Coordinates | null;
    }): void;
    slide({ previous_coordinates, tile_size, }: {
        previous_coordinates: Coordinates;
        tile_size: number;
    }): void;
    slideAnimation({ stepNumber, signedStepSizeX, signedStepSizeY, originalMargins, }: {
        stepNumber: number;
        signedStepSizeX: number;
        signedStepSizeY: number;
        originalMargins: {
            mapLeft: number;
            mapTop: number;
            catLeft: number;
            catTop: number;
        };
    }): void;
    getCellElement(x: number, y: number, cell_coordinates: Coordinates): HTMLDivElement;
}
//# sourceMappingURL=Map.d.ts.map