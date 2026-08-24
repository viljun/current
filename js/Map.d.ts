export declare const ACCURACY_MULTIPLIER = 10000;
export declare const ITEM_TAKING_RANGE = 3;
import { Coordinates } from "./Coordinates.js";
import { Inventory } from "./Inventory.js";
import { ItemType } from "./ItemType.js";
export interface MapState {
    coordinates: Coordinates;
    selectedCoordinates: Coordinates | null;
    exploreMode: boolean;
    takingRangeMeters: number | null;
}
export interface MapItemLabelVisual {
    angleDegrees: number;
    distanceInTiles: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
}
export interface ShopWallVisual {
    rotationDegrees: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
    scale: number;
}
export declare const DUNGEON_SOFT_TERRAINS: readonly ["dungeon moonwell water", "dungeon wet floor", "dungeon sand floor", "dungeon fungal floor", "dungeon bone floor", "dungeon bazaar floor", "dungeon forge floor", "dungeon chapel floor", "dungeon web floor", "dungeon moss floor", "dungeon crystal floor"];
export type DungeonSoftTerrain = typeof DUNGEON_SOFT_TERRAINS[number];
export interface DungeonSoftTerrainVisual {
    diameterInTiles: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
    rotationDegrees: number;
    opacity: number;
}
export declare class Map {
    slidingAnimationInProgress: boolean;
    interactionLocked: boolean;
    private catFacingX;
    private focusedLabelItemName;
    private catVisualState;
    private visibleDungeonWalls;
    map: HTMLDivElement;
    messageBox: HTMLDivElement;
    cols: number;
    rows: number;
    inventory: Inventory;
    private readonly state;
    tile_size: number;
    private readonly onCellSelected;
    private readonly onExploreMoveRequested;
    private readonly onInteractionUnlocked;
    private dragState;
    private dragDestination;
    private dragDestinationRemovalTimer;
    private suppressNextCellClick;
    private static readonly PLAYER_DRAG_THRESHOLD_PIXELS;
    static coordinatesAtCell(center: Coordinates, column: number, row: number, columns: number, rows: number): Coordinates;
    static cellIsInsideCircularFootprint(column: number, row: number, columns: number, rows: number): boolean;
    static offsetForMovement(previousCoordinates: Coordinates, currentCoordinates: Coordinates): {
        x: number;
        y: number;
    };
    static interactionCoordinates(state: MapState): Coordinates | null;
    constructor(map: HTMLDivElement, messageBox: HTMLDivElement, cols: number, rows: number, inventory: Inventory, state: MapState, tile_size: number, onCellSelected: (coordinates: Coordinates) => void, onExploreMoveRequested: (coordinates: Coordinates) => void, onInteractionUnlocked: () => void);
    show({ previousCoordinates, }: {
        previousCoordinates?: Coordinates | null;
    }): void;
    static progressItemReferences(text: string): {
        start: number;
        length: number;
        itemName: string;
    }[];
    static itemLabelVisualAt(itemName: string, coordinates: Coordinates): MapItemLabelVisual;
    static shopWallVisualAt(coordinates: Coordinates): ShopWallVisual;
    static dungeonSoftTerrainVisualAt(terrain: DungeonSoftTerrain, coordinates: Coordinates): DungeonSoftTerrainVisual;
    private static dungeonSoftTerrainSeed;
    private static shopWallSeed;
    private static itemLabelSeed;
    private decorateItemLabel;
    private progressStatusElement;
    setStatusMessage(message: string | HTMLDivElement): void;
    private linkItemNamesInElement;
    private appendLinkedItemText;
    focusItemLabels(itemName: string | null): void;
    private animateCatVisual;
    isWithinTakingRange(coordinates: Coordinates, itemType: ItemType): boolean;
    isWallAt(coordinates: Coordinates, areaId?: number): boolean;
    private static coordinatesKey;
    private decorateDungeonSoftTerrainCell;
    private static isDungeonSoftTerrain;
    private decorateRiverCell;
    private decorateShopWallCell;
    private decorateRoadCell;
    private decoratePathPatches;
    private decorateRoadGrass;
    private decorateForestMoss;
    private static positiveModulo;
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
    private bindPlayerDragging;
    private movePlayerDragPreview;
    private preservePlayerDragDestination;
    private attachPlayerDragDestination;
    private fadePlayerDragDestination;
    private cellAtPoint;
    private setPlayerDragTarget;
    private finishPlayerDrag;
    private static coordinatesFromCell;
}
//# sourceMappingURL=Map.d.ts.map