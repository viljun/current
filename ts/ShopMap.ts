import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { SHOP_AREA } from "./Area.js";

export class ShopMap {
    private static readonly WIDTH = 48;
    private static readonly HEIGHT = 44;
    private static readonly X_WALLS = [0, 9, 23, 35];
    private static readonly Y_WALLS = [0, 8, 19, 34];

    static hasWallAt(coordinates: Coordinates): boolean {
        if (this.isNearStairs(coordinates) || this.isOutside(coordinates)) {
            return false;
        }
        const x = this.mod(coordinates.latitude, this.WIDTH);
        const y = this.mod(coordinates.longitude, this.HEIGHT);
        const xWall = this.X_WALLS.includes(x);
        const yWall = this.Y_WALLS.includes(y);
        if (!xWall && !yWall) {
            return false;
        }
        if (xWall && this.isVerticalDoor(coordinates, x, y)) {
            return false;
        }
        if (yWall && this.isHorizontalDoor(coordinates, x, y)) {
            return false;
        }

        return true;
    }

    static decorationAt(coordinates: Coordinates): "shop table"|"shop shelf"|null {
        if (this.isOutside(coordinates)
            || this.isNearStairs(coordinates)
            || this.hasWallAt(coordinates)
        ) {
            return null;
        }
        const seed = coordinates.getSeed();
        if (!(seed % 83)) {
            return "shop table";
        }
        if (!(seed % 97)) {
            return "shop shelf";
        }

        return null;
    }

    static isBesideWall(coordinates: Coordinates): boolean {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (this.hasWallAt(new Coordinates(
                    coordinates.latitude + x,
                    coordinates.longitude + y,
                ))) {
                    return true;
                }
            }
        }

        return false;
    }

    static isOutside(coordinates: Coordinates): boolean {
        const x = this.mod(coordinates.latitude, this.WIDTH);
        const y = this.mod(coordinates.longitude, this.HEIGHT);

        // Two broad, irregular open-air grounds in every shop district.
        return (x >= 35 && y >= 19)
            || (x >= 23 && x < 35 && y >= 34)
            || (x < 9 && y >= 8 && y < 19);
    }

    private static isNearStairs(coordinates: Coordinates): boolean {
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (Math.hypot(x, y) > 3) {
                    continue;
                }
                const nearby = new Coordinates(
                    coordinates.latitude + x,
                    coordinates.longitude + y,
                );
                if (ItemType.getWithSeed(nearby.getSeed(), SHOP_AREA)?.name === "stairs up") {
                    return true;
                }
            }
        }

        return false;
    }

    private static mod(value: number, divisor: number): number {
        return ((value % divisor) + divisor) % divisor;
    }

    private static hash(x: number, y: number, salt: number): number {
        return Math.abs((x * 73856093) ^ (y * 19349663) ^ salt);
    }

    private static isVerticalDoor(
        coordinates: Coordinates,
        x: number,
        y: number,
    ): boolean {
        const [start, end] = this.intervalContaining(y, this.Y_WALLS, this.HEIGHT);
        const blockX = Math.floor((coordinates.latitude - x) / this.WIDTH);
        const blockY = Math.floor((coordinates.longitude - y + start) / this.HEIGHT);
        const center = this.doorCenter(start, end, this.hash(blockX, blockY, x + 17));

        return this.circularDistance(y, center, this.HEIGHT) <= 1;
    }

    private static isHorizontalDoor(
        coordinates: Coordinates,
        x: number,
        y: number,
    ): boolean {
        const [start, end] = this.intervalContaining(x, this.X_WALLS, this.WIDTH);
        const blockX = Math.floor((coordinates.latitude - x + start) / this.WIDTH);
        const blockY = Math.floor((coordinates.longitude - y) / this.HEIGHT);
        const center = this.doorCenter(start, end, this.hash(blockX, blockY, y + 29));

        return this.circularDistance(x, center, this.WIDTH) <= 1;
    }

    private static intervalContaining(
        value: number,
        walls: readonly number[],
        period: number,
    ): [number, number] {
        let start = walls[0] ?? 0;
        let end = period;
        for (let index = 0; index < walls.length; index++) {
            const wall = walls[index] ?? 0;
            const next = walls[index + 1] ?? period;
            if (value >= wall && value < next) {
                start = wall;
                end = next;
                break;
            }
        }

        return [start, end];
    }

    private static doorCenter(start: number, end: number, seed: number): number {
        const first = start + 2;
        const last = end - 2;

        return first + seed % Math.max(1, last - first + 1);
    }

    private static circularDistance(first: number, second: number, period: number): number {
        const distance = Math.abs(first - second);

        return Math.min(distance, period - distance);
    }
}
