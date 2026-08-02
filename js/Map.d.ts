export declare const ACCURACY_MULTIPLIER = 10000;
export declare const ITEM_TAKING_RANGE = 1;
import { Coordinates } from "./Coordinates.js";
import { Inventory } from "./Inventory.js";
export interface MapState {
    coordinates: Coordinates;
    selectedCoordinates: Coordinates | null;
    exploreMode: boolean;
}
export declare class Map {
    slidingAnimationInProgress: boolean;
    interactionLocked: boolean;
    private catFacingX;
    private catVisualState;
    map: HTMLDivElement;
    messageBox: HTMLDivElement;
    cols: number;
    rows: number;
    inventory: Inventory;
    private readonly state;
    tile_size: number;
    private readonly onCellSelected;
    private readonly onInteractionUnlocked;
    constructor(map: HTMLDivElement, messageBox: HTMLDivElement, cols: number, rows: number, inventory: Inventory, state: MapState, tile_size: number, onCellSelected: (coordinates: Coordinates) => void, onInteractionUnlocked: () => void);
    show({ previousCoordinates, }: {
        previousCoordinates?: Coordinates | null;
    }): void;
    private animateCatVisual;
    isWithinTakingRange(coordinates: Coordinates): boolean;
    isWallAt(coordinates: Coordinates, areaId?: number): boolean;
    private static shopOutsideDecoration;
    private static decorationSeed;
    setInteractionLocked(locked: boolean): void;
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