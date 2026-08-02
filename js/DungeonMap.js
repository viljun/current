import { Coordinates as GameCoordinates } from "./Coordinates.js";
import { DUNGEON_AREA } from "./Area.js";
import { ItemType } from "./ItemType.js";
export class DungeonMap {
    constructor(width, height, coordinates) {
        this.width = width;
        this.height = height;
        this.coordinates = coordinates;
        // Generate map.
        let new_map = this.generate();
        // Remove lonely walls and floors.
        for (let i = 0; i < 4; i++) {
            new_map = this.removeLonelyTiles(new_map);
        }
        // Removes checkerboard patterns.
        new_map = this.removeCheckerboardPatters(new_map);
        this.map = new_map;
    }
    static hasWallAt(coordinates) {
        var _a;
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (Math.hypot(x, y) <= 3) {
                    const nearby = new GameCoordinates(coordinates.latitude + x, coordinates.longitude + y);
                    if (((_a = ItemType.getWithSeed(nearby.getSeed(), DUNGEON_AREA)) === null || _a === void 0 ? void 0 : _a.name) === "stairs up") {
                        return false;
                    }
                }
            }
        }
        let x = (220 + coordinates.latitude) / 8;
        let y = (220 + coordinates.longitude) / 8;
        x += Math.cos(x / 9) * Math.sin(y / 7);
        y += Math.sin(y / 5) * Math.cos(y / 3);
        x *= Math.cos(Math.cos(y / 19) * Math.sin(y / 17));
        y *= Math.sin(Math.sin(x / 13) * Math.sin(y / 11));
        return Math.sin(x * .3 * y) + Math.cos(y * .3 * x) > .1;
    }
    generate() {
        var _a, _b;
        const dungeon_map = [];
        for (let col = 0; col <= this.width; col++) {
            for (let row = 0; row <= this.height; row++) {
                if (this.isWall(col, row)) {
                    const r = row;
                    (_a = dungeon_map[r]) !== null && _a !== void 0 ? _a : (dungeon_map[r] = []);
                    dungeon_map[r][col] = true;
                }
                const coordinates = new GameCoordinates(this.coordinates.latitude + col, this.coordinates.longitude + row);
                if (this.isNearStairs(coordinates)) {
                    const r = row;
                    (_b = dungeon_map[r]) !== null && _b !== void 0 ? _b : (dungeon_map[r] = []);
                    dungeon_map[r][col] = false;
                }
            }
        }
        return dungeon_map;
    }
    isNearStairs(coordinates) {
        var _a;
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (Math.hypot(x, y) > 3) {
                    continue;
                }
                const nearby = new GameCoordinates(coordinates.latitude + x, coordinates.longitude + y);
                if (((_a = ItemType.getWithSeed(nearby.getSeed(), DUNGEON_AREA)) === null || _a === void 0 ? void 0 : _a.name) === "stairs up") {
                    return true;
                }
            }
        }
        return false;
    }
    // Remove lonely walls and floors.
    removeLonelyTiles(dungeon_map) {
        var _a, _b, _c, _d, _e, _f;
        for (let col = 0; col <= this.width; col++) {
            for (let row = 0; row <= this.height; row++) {
                let adjecant_count = this.calculateAdjecantWalls(dungeon_map, row, col);
                // Add wall if there are more than 2 adjecant walls.
                if (!((_b = (_a = dungeon_map[row]) === null || _a === void 0 ? void 0 : _a[col]) !== null && _b !== void 0 ? _b : false)
                    && adjecant_count > 2) {
                    const r = row;
                    (_c = dungeon_map[r]) !== null && _c !== void 0 ? _c : (dungeon_map[r] = []);
                    dungeon_map[r][col] = true;
                    continue;
                }
                // Remove wall if there are less than 2 adjecant walls.
                if (((_e = (_d = dungeon_map[row]) === null || _d === void 0 ? void 0 : _d[col]) !== null && _e !== void 0 ? _e : false)
                    && adjecant_count < 2) {
                    const r = row;
                    (_f = dungeon_map[r]) !== null && _f !== void 0 ? _f : (dungeon_map[r] = []);
                    dungeon_map[r][col] = false;
                }
            }
        }
        return dungeon_map;
    }
    // Removes checkerboard patterns.
    removeCheckerboardPatters(dungeon_map) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        for (let col = 1; col < this.width; col++) {
            for (let row = 1; row < this.height; row++) {
                let count = Number((_b = (_a = dungeon_map[row]) === null || _a === void 0 ? void 0 : _a[col]) !== null && _b !== void 0 ? _b : false)
                    + Number((_d = (_c = dungeon_map[row + 1]) === null || _c === void 0 ? void 0 : _c[col + 1]) !== null && _d !== void 0 ? _d : false)
                    + Number(!((_f = (_e = dungeon_map[row]) === null || _e === void 0 ? void 0 : _e[col + 1]) !== null && _f !== void 0 ? _f : false))
                    + Number(!((_h = (_g = dungeon_map[row + 1]) === null || _g === void 0 ? void 0 : _g[col]) !== null && _h !== void 0 ? _h : false));
                if (count === 0 || count === 4) {
                    const r = row;
                    const n = row + 1;
                    (_j = dungeon_map[r]) !== null && _j !== void 0 ? _j : (dungeon_map[r] = []);
                    (_k = dungeon_map[n]) !== null && _k !== void 0 ? _k : (dungeon_map[n] = []);
                    dungeon_map[r][col] = false;
                    dungeon_map[r][col + 1] = false;
                    dungeon_map[n][col] = false;
                    dungeon_map[n][col + 1] = false;
                }
            }
        }
        return dungeon_map;
    }
    // Returns true if the cell is a wall.
    isWall(x, y) {
        x += 220 + this.coordinates.latitude;
        y += 220 + this.coordinates.longitude;
        x /= 8;
        y /= 8;
        x += Math.cos(x / 9) * Math.sin(y / 7);
        y += Math.sin(y / 5) * Math.cos(y / 3);
        x *= Math.cos(Math.cos(y / 19) * Math.sin(y / 17));
        y *= Math.sin(Math.sin(x / 13) * Math.sin(y / 11));
        return Math.sin(x * 0.3 * y) + Math.cos(y * 0.3 * x) > 0.1;
    }
    // Returns the number of adjecant walls.
    calculateAdjecantWalls(dungeon_map, row, col) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return Number((_b = (_a = dungeon_map[row]) === null || _a === void 0 ? void 0 : _a[col - 1]) !== null && _b !== void 0 ? _b : false)
            + Number((_d = (_c = dungeon_map[row]) === null || _c === void 0 ? void 0 : _c[col + 1]) !== null && _d !== void 0 ? _d : false)
            + Number((_f = (_e = dungeon_map[row - 1]) === null || _e === void 0 ? void 0 : _e[col]) !== null && _f !== void 0 ? _f : false)
            + Number((_h = (_g = dungeon_map[row + 1]) === null || _g === void 0 ? void 0 : _g[col]) !== null && _h !== void 0 ? _h : false);
    }
    // Returns cells.
    getCells() {
        var _a, _b;
        const cells = [];
        for (let col = 1; col < this.width; col++) {
            for (let row = 1; row < this.height; row++) {
                if ((_b = (_a = this.map[row]) === null || _a === void 0 ? void 0 : _a[col]) !== null && _b !== void 0 ? _b : false) {
                    cells.push({
                        class: 'floor',
                        style: {
                            gridColumn: col,
                            gridRow: row,
                        },
                    });
                }
                else {
                    cells.push({
                        class: 'wall',
                        style: {
                            gridColumn: col,
                            gridRow: row,
                        },
                    });
                }
            }
        }
        return cells;
    }
    // Draws the map.
    draw() {
        const cells = this.getCells();
        const map_element = document.createElement('div');
        map_element.classList.add('map');
        cells.forEach(cell => {
            const cell_element = document.createElement('div');
            cell_element.classList.add(cell.class);
            Object.entries(cell.style).forEach(([key, value]) => {
                if (typeof value === "string") {
                    // cell_element.style[key] = value;
                    cell_element.style.setProperty(key, value);
                }
            });
            map_element.appendChild(cell_element);
        });
        document.body.appendChild(map_element);
        console.log('drawn');
    }
}
