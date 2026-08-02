import { Coordinates } from "./Coordinates.js";
export declare class ShopMap {
    private static readonly WIDTH;
    private static readonly HEIGHT;
    private static readonly X_WALLS;
    private static readonly Y_WALLS;
    static hasWallAt(coordinates: Coordinates): boolean;
    static decorationAt(coordinates: Coordinates): "shop table" | "shop shelf" | null;
    static isBesideWall(coordinates: Coordinates): boolean;
    static isOutside(coordinates: Coordinates): boolean;
    private static isNearStairs;
    private static mod;
    private static hash;
    private static isVerticalDoor;
    private static isHorizontalDoor;
    private static intervalContaining;
    private static doorCenter;
    private static circularDistance;
}
//# sourceMappingURL=ShopMap.d.ts.map