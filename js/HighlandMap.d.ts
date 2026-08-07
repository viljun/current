import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
export interface HighlandCastle {
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    seed: number;
}
export type HighlandTerrain = "highland rugged ground" | "highland jungle ground" | "highland mountain ground" | "highland castle floor";
/**
 * Deterministic highland terrain with continuous ridges and rare fortresses.
 */
export declare class HighlandMap {
    private static readonly CASTLE_CHUNK_SIZE;
    static castleAt(coordinates: Coordinates): HighlandCastle | null;
    static castleTitleAt(coordinates: Coordinates): string | null;
    static hasWallAt(coordinates: Coordinates): boolean;
    static terrainAt(coordinates: Coordinates): HighlandTerrain;
    static decorationAt(coordinates: Coordinates): string | null;
    static itemAt(coordinates: Coordinates): ItemType | null;
    static allowsItemAt(coordinates: Coordinates, itemType: ItemType): boolean;
    private static castleForChunk;
    private static isInsideCastle;
    private static isCastleWall;
    private static castleWallDecoration;
    private static magicianChamber;
    private static elevationAt;
    private static noise2d;
    private static noiseCorner;
    private static interpolate;
    private static smooth;
    private static cellSeed;
    private static distanceSquared;
    private static between;
    private static positiveModulo;
    private static signedRange;
    private static hash;
}
//# sourceMappingURL=HighlandMap.d.ts.map