import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { SHOP_AREA } from "./Area.js";
export class ShopMap {
    static hasWallAt(coordinates) {
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
    static hasPrimaryWallShapeAt(coordinates) {
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
    static isDesignedDoorAt(coordinates) {
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
    static isDiagonalWallBridgeAt(coordinates) {
        var _a, _b;
        const directions = [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
        ];
        for (const [dx, dy] of directions) {
            const horizontal = new Coordinates(coordinates.latitude + dx, coordinates.longitude);
            const vertical = new Coordinates(coordinates.latitude, coordinates.longitude + dy);
            if (!this.hasUsablePrimaryWallAt(horizontal)
                || !this.hasUsablePrimaryWallAt(vertical)) {
                continue;
            }
            const alternateBridge = new Coordinates(coordinates.latitude + dx, coordinates.longitude + dy);
            if (this.hasUsablePrimaryWallAt(alternateBridge)) {
                continue;
            }
            if (!this.canAddBridgeAt(alternateBridge)) {
                return true;
            }
            const candidates = [coordinates, alternateBridge].sort((first, second) => first.latitude - second.latitude
                || first.longitude - second.longitude);
            const first = (_a = candidates[0]) !== null && _a !== void 0 ? _a : coordinates;
            const second = (_b = candidates[1]) !== null && _b !== void 0 ? _b : alternateBridge;
            const chooseFirst = this.hash(first.latitude + second.latitude, first.longitude + second.longitude, 0x57414c4c) % 2 === 0;
            const chosen = chooseFirst ? first : second;
            if (coordinates.equals(chosen)) {
                return true;
            }
        }
        return false;
    }
    static hasUsablePrimaryWallAt(coordinates) {
        return this.hasPrimaryWallShapeAt(coordinates)
            && !this.isNearStairs(coordinates);
    }
    static canAddBridgeAt(coordinates) {
        return !this.isOutside(coordinates)
            && !this.isNearStairs(coordinates)
            && !this.isDesignedDoorAt(coordinates);
    }
    static decorationAt(coordinates) {
        if (this.isOutside(coordinates)
            || this.isNearStairs(coordinates)
            || this.hasWallAt(coordinates)) {
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
    static isBesideWall(coordinates) {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (this.hasWallAt(new Coordinates(coordinates.latitude + x, coordinates.longitude + y))) {
                    return true;
                }
            }
        }
        return false;
    }
    static isOutside(coordinates) {
        const { x, y } = this.layoutPosition(coordinates);
        // Small warped merchant compounds sit in a much larger open landscape.
        const firstCompound = x >= 10 && x < 42 && y >= 6 && y < 36;
        const secondCompound = x >= 40 && x < 76 && y >= 34 && y < 78;
        return !firstCompound && !secondCompound;
    }
    static isNearStairs(coordinates) {
        var _a;
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (Math.hypot(x, y) > 3) {
                    continue;
                }
                const nearby = new Coordinates(coordinates.latitude + x, coordinates.longitude + y);
                if (((_a = ItemType.getWithSeed(nearby.getSeed(), SHOP_AREA)) === null || _a === void 0 ? void 0 : _a.name) === "stairs up") {
                    return true;
                }
            }
        }
        return false;
    }
    static mod(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }
    static hash(x, y, salt) {
        return Math.abs((x * 73856093) ^ (y * 19349663) ^ salt);
    }
    static isVerticalDoor(layout, x, y) {
        const [start, end] = this.intervalContaining(y, this.Y_WALLS, this.HEIGHT);
        const blockX = Math.floor((layout.latitude - x) / this.WIDTH);
        const blockY = Math.floor((layout.longitude - y + start) / this.HEIGHT);
        const center = this.doorCenter(start, end, this.hash(blockX, blockY, x + 17));
        return this.circularDistance(y, center, this.HEIGHT) <= 1;
    }
    static isHorizontalDoor(layout, x, y) {
        const [start, end] = this.intervalContaining(x, this.X_WALLS, this.WIDTH);
        const blockX = Math.floor((layout.latitude - x + start) / this.WIDTH);
        const blockY = Math.floor((layout.longitude - y) / this.HEIGHT);
        const center = this.doorCenter(start, end, this.hash(blockX, blockY, y + 29));
        return this.circularDistance(x, center, this.WIDTH) <= 1;
    }
    static intervalContaining(value, walls, period) {
        var _a, _b, _c;
        let start = (_a = walls[0]) !== null && _a !== void 0 ? _a : 0;
        let end = period;
        for (let index = 0; index < walls.length; index++) {
            const wall = (_b = walls[index]) !== null && _b !== void 0 ? _b : 0;
            const next = (_c = walls[index + 1]) !== null && _c !== void 0 ? _c : period;
            if (value >= wall && value < next) {
                start = wall;
                end = next;
                break;
            }
        }
        return [start, end];
    }
    static doorCenter(start, end, seed) {
        const first = start + 2;
        const last = end - 2;
        return first + seed % Math.max(1, last - first + 1);
    }
    static circularDistance(first, second, period) {
        const distance = Math.abs(first - second);
        return Math.min(distance, period - distance);
    }
    static layoutPosition(coordinates) {
        // Independent long waves bend both wall axes without any random state.
        const latitude = coordinates.latitude + Math.round(Math.sin((coordinates.longitude + 37) / 9) * 2
            + Math.sin((coordinates.longitude - 113) / 23));
        const longitude = coordinates.longitude + Math.round(Math.sin((coordinates.latitude - 71) / 11) * 2
            + Math.cos((coordinates.latitude + 149) / 29));
        return {
            latitude,
            longitude,
            x: this.mod(latitude, this.WIDTH),
            y: this.mod(longitude, this.HEIGHT),
        };
    }
}
ShopMap.WIDTH = 96;
ShopMap.HEIGHT = 88;
ShopMap.X_WALLS = [0, 9, 23, 35, 48, 57, 71, 83];
ShopMap.Y_WALLS = [0, 8, 19, 34, 44, 52, 63, 78];
