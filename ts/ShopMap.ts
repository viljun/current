import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { SHOP_AREA } from "./Area.js";

export class ShopMap {
    private static readonly WIDTH = 96;
    private static readonly HEIGHT = 88;
    private static readonly X_WALLS = [0, 9, 23, 35, 48, 57, 71, 83];
    private static readonly Y_WALLS = [0, 8, 19, 34, 44, 52, 63, 78];

    static hasWallAt(coordinates: Coordinates): boolean {
        if (this.isNearStairs(coordinates) || this.isOutside(coordinates)) {
            return false;
        }
        if (this.hasPrimaryWallShapeAt(coordinates)) {
            return true;
        }
        if (this.isDesignedDoorAt(coordinates)) {
            return false;
        }

        return this.isDiagonalWallBridgeAt(coordinates);
    }

    private static hasPrimaryWallShapeAt(coordinates: Coordinates): boolean {
        if (this.isOutside(coordinates)) {
            return false;
        }
        const layout = this.layoutPosition(coordinates);
        const { x, y } = layout;
        const xWall = this.X_WALLS.includes(x);
        const yWall = this.Y_WALLS.includes(y);
        if (!xWall && !yWall) {
            return false;
        }
        if (xWall && this.isVerticalDoor(layout, x, y)) {
            return false;
        }
        if (yWall && this.isHorizontalDoor(layout, x, y)) {
            return false;
        }

        return true;
    }

    private static isDesignedDoorAt(coordinates: Coordinates): boolean {
        if (this.isOutside(coordinates)) {
            return false;
        }
        const layout = this.layoutPosition(coordinates);
        const { x, y } = layout;

        return this.X_WALLS.includes(x)
                && this.isVerticalDoor(layout, x, y)
            || this.Y_WALLS.includes(y)
                && this.isHorizontalDoor(layout, x, y);
    }

    private static isDiagonalWallBridgeAt(
        coordinates: Coordinates,
    ): boolean {
        const directions = [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
        ] as const;
        for (const [dx, dy] of directions) {
            const horizontal = new Coordinates(
                coordinates.latitude + dx,
                coordinates.longitude,
            );
            const vertical = new Coordinates(
                coordinates.latitude,
                coordinates.longitude + dy,
            );
            if (!this.hasUsablePrimaryWallAt(horizontal)
                || !this.hasUsablePrimaryWallAt(vertical)
            ) {
                continue;
            }
            const alternateBridge = new Coordinates(
                coordinates.latitude + dx,
                coordinates.longitude + dy,
            );
            if (this.hasUsablePrimaryWallAt(alternateBridge)) {
                continue;
            }
            if (!this.canAddBridgeAt(alternateBridge)) {
                return true;
            }
            const candidates = [coordinates, alternateBridge].sort(
                (first, second) => first.latitude - second.latitude
                    || first.longitude - second.longitude,
            );
            const first = candidates[0] ?? coordinates;
            const second = candidates[1] ?? alternateBridge;
            const chooseFirst = this.hash(
                first.latitude + second.latitude,
                first.longitude + second.longitude,
                0x57414c4c,
            ) % 2 === 0;
            const chosen = chooseFirst ? first : second;
            if (coordinates.equals(chosen)) {
                return true;
            }
        }

        return false;
    }

    private static hasUsablePrimaryWallAt(
        coordinates: Coordinates,
    ): boolean {
        return this.hasPrimaryWallShapeAt(coordinates)
            && !this.isNearStairs(coordinates);
    }

    private static canAddBridgeAt(coordinates: Coordinates): boolean {
        return !this.isOutside(coordinates)
            && !this.isNearStairs(coordinates)
            && !this.isDesignedDoorAt(coordinates);
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
        const { x, y } = this.layoutPosition(coordinates);

        // Small warped merchant compounds sit in a much larger open landscape.
        const firstCompound = x >= 10 && x < 42 && y >= 6 && y < 36;
        const secondCompound = x >= 40 && x < 76 && y >= 34 && y < 78;

        return !firstCompound && !secondCompound;
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
        layout: { latitude: number; longitude: number },
        x: number,
        y: number,
    ): boolean {
        const [start, end] = this.intervalContaining(y, this.Y_WALLS, this.HEIGHT);
        const blockX = Math.floor((layout.latitude - x) / this.WIDTH);
        const blockY = Math.floor((layout.longitude - y + start) / this.HEIGHT);
        const center = this.doorCenter(start, end, this.hash(blockX, blockY, x + 17));

        return this.circularDistance(y, center, this.HEIGHT) <= 1;
    }

    private static isHorizontalDoor(
        layout: { latitude: number; longitude: number },
        x: number,
        y: number,
    ): boolean {
        const [start, end] = this.intervalContaining(x, this.X_WALLS, this.WIDTH);
        const blockX = Math.floor((layout.latitude - x + start) / this.WIDTH);
        const blockY = Math.floor((layout.longitude - y) / this.HEIGHT);
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

    private static layoutPosition(coordinates: Coordinates): {
        latitude: number;
        longitude: number;
        x: number;
        y: number;
    } {
        // Independent long waves bend both wall axes without any random state.
        const latitude = coordinates.latitude + Math.round(
            Math.sin((coordinates.longitude + 37) / 9) * 2
            + Math.sin((coordinates.longitude - 113) / 23),
        );
        const longitude = coordinates.longitude + Math.round(
            Math.sin((coordinates.latitude - 71) / 11) * 2
            + Math.cos((coordinates.latitude + 149) / 29),
        );

        return {
            latitude,
            longitude,
            x: this.mod(latitude, this.WIDTH),
            y: this.mod(longitude, this.HEIGHT),
        };
    }
}
