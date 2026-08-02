import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { SHOP_AREA } from "./Area.js";
export class ShopMap {
    static hasWallAt(coordinates) {
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
    static isOutside(coordinates) {
        const x = this.mod(coordinates.latitude, this.WIDTH);
        const y = this.mod(coordinates.longitude, this.HEIGHT);
        // Two broad, irregular open-air grounds in every shop district.
        return (x >= 35 && y >= 19)
            || (x >= 23 && x < 35 && y >= 34)
            || (x < 9 && y >= 8 && y < 19);
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
    static isVerticalDoor(coordinates, x, y) {
        const [start, end] = this.intervalContaining(y, this.Y_WALLS, this.HEIGHT);
        const blockX = Math.floor((coordinates.latitude - x) / this.WIDTH);
        const blockY = Math.floor((coordinates.longitude - y + start) / this.HEIGHT);
        const center = this.doorCenter(start, end, this.hash(blockX, blockY, x + 17));
        return this.circularDistance(y, center, this.HEIGHT) <= 1;
    }
    static isHorizontalDoor(coordinates, x, y) {
        const [start, end] = this.intervalContaining(x, this.X_WALLS, this.WIDTH);
        const blockX = Math.floor((coordinates.latitude - x + start) / this.WIDTH);
        const blockY = Math.floor((coordinates.longitude - y) / this.HEIGHT);
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
}
ShopMap.WIDTH = 48;
ShopMap.HEIGHT = 44;
ShopMap.X_WALLS = [0, 9, 23, 35];
ShopMap.Y_WALLS = [0, 8, 19, 34];
