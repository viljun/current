import type { Coordinates } from "./Coordinates";
export declare class DungeonMap {
    width: number;
    height: number;
    coordinates: Coordinates;
    map: boolean[][];
    static forViewport(cols: number, rows: number, center: Coordinates, extraSize: number): DungeonMap;
    private constructor();
    static hasWallAt(coordinates: Coordinates): boolean;
    private generate;
    private isNearStairs;
    private removeLonelyTiles;
    removeCheckerboardPatters(dungeon_map: boolean[][]): boolean[][];
    isWall(x: number, y: number): boolean;
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