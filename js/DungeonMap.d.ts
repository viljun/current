import type { Coordinates } from "./Coordinates";
import { ItemType } from "./ItemType.js";
export type DungeonFeatureKind = "moonwell" | "sand vault" | "gloamcap grove" | "boneyard" | "whispering bazaar" | "ember forge" | "black candle chapel" | "spider nursery" | "rootbound garden" | "crystal hall";
export interface DungeonFeature {
    kind: DungeonFeatureKind;
    centerLatitude: number;
    centerLongitude: number;
    radiusX: number;
    radiusY: number;
    rotated: boolean;
    seed: number;
}
export declare class DungeonMap {
    private static readonly FEATURE_CHUNK_SIZE;
    private static readonly FEATURE_KINDS;
    width: number;
    height: number;
    coordinates: Coordinates;
    map: boolean[][];
    static forViewport(cols: number, rows: number, center: Coordinates, extraSize: number): DungeonMap;
    private constructor();
    static hasWallAt(coordinates: Coordinates): boolean;
    static featureAt(coordinates: Coordinates): DungeonFeature | null;
    static featureTitleAt(coordinates: Coordinates): string | null;
    static terrainAt(coordinates: Coordinates): string;
    static decorationAt(coordinates: Coordinates): string | null;
    static itemAt(coordinates: Coordinates): ItemType | null;
    allowsItemAt(col: number, row: number, itemType: ItemType): boolean;
    private generate;
    private carveFeatureRooms;
    private static featureItemAt;
    private static isFeatureFloorAt;
    private static nearbyFeatures;
    private static featureForChunk;
    private static isInsideRoom;
    private static featureDistance;
    private static localCoordinates;
    private static cellSeed;
    private static hash;
    private isNearStairs;
    private removeLonelyTiles;
    removeCheckerboardPatters(dungeon_map: boolean[][]): boolean[][];
    isWall(x: number, y: number): boolean;
    private coordinatesAt;
    calculateAdjecantWalls(dungeon_map: boolean[][], row: number, col: number): number;
    getCells(): {
        class: string;
        style: {
            gridColumn: number;
            gridRow: number;
        };
    }[];
    draw(): void;
}
//# sourceMappingURL=DungeonMap.d.ts.map