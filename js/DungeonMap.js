import { Coordinates as GameCoordinates } from "./Coordinates.js";
import { DUNGEON_AREA } from "./Area.js";
import { ItemType } from "./ItemType.js";
import { SurfaceMap } from "./SurfaceMap.js";
export class DungeonMap {
    static forViewport(cols, rows, center, extraSize) {
        const origin = new GameCoordinates(center.latitude + (rows + 1) / 2 + extraSize, center.longitude - (cols + 1) / 2 - extraSize);
        return new DungeonMap(cols + extraSize * 2, rows + extraSize * 2, origin);
    }
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
        // Carve large landmark rooms after smoothing so their silhouettes and
        // corridor connections stay intact.
        new_map = this.carveFeatureRooms(new_map);
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
        if (DungeonMap.isFeatureFloorAt(coordinates)) {
            return false;
        }
        let x = (220 + coordinates.latitude) / 8;
        let y = (220 + coordinates.longitude) / 8;
        x += Math.cos(x / 9) * Math.sin(y / 7);
        y += Math.sin(y / 5) * Math.cos(y / 3);
        x *= Math.cos(Math.cos(y / 19) * Math.sin(y / 17));
        y *= Math.sin(Math.sin(x / 13) * Math.sin(y / 11));
        return Math.sin(x * .3 * y) + Math.cos(y * .3 * x) > .1;
    }
    static featureAt(coordinates) {
        var _a;
        const features = DungeonMap.nearbyFeatures(coordinates)
            .filter(feature => DungeonMap.isInsideRoom(feature, coordinates))
            .sort((first, second) => {
            const distanceDifference = DungeonMap.featureDistance(first, coordinates)
                - DungeonMap.featureDistance(second, coordinates);
            if (distanceDifference !== 0) {
                return distanceDifference;
            }
            return first.seed - second.seed;
        });
        return (_a = features[0]) !== null && _a !== void 0 ? _a : null;
    }
    static featureTitleAt(coordinates) {
        const feature = DungeonMap.featureAt(coordinates);
        if (feature === null) {
            return null;
        }
        const titles = {
            moonwell: "Moonwell Grotto",
            "sand vault": "Sunken Sand Vault",
            "gloamcap grove": "Gloamcap Grove",
            boneyard: "King's Boneyard",
            "whispering bazaar": "Whispering Bazaar",
            "ember forge": "Ember Forge",
            "black candle chapel": "Black Candle Chapel",
            "spider nursery": "Spider Nursery",
            "rootbound garden": "Rootbound Garden",
            "crystal hall": "Echoing Crystal Hall",
        };
        return titles[feature.kind];
    }
    static terrainAt(coordinates) {
        const feature = DungeonMap.featureAt(coordinates);
        if (feature === null) {
            return "dungeon floor";
        }
        const local = DungeonMap.localCoordinates(feature, coordinates);
        if (feature.kind === "moonwell") {
            const lakeDistance = Math.pow(local.x / Math.max(1, feature.radiusX - 2), 2) + Math.pow(local.y / Math.max(1, feature.radiusY - 2), 2);
            return lakeDistance <= .62
                ? "dungeon moonwell water"
                : "dungeon wet floor";
        }
        const terrain = {
            "sand vault": "dungeon sand floor",
            "gloamcap grove": "dungeon fungal floor",
            boneyard: "dungeon bone floor",
            "whispering bazaar": "dungeon bazaar floor",
            "ember forge": "dungeon forge floor",
            "black candle chapel": "dungeon chapel floor",
            "spider nursery": "dungeon web floor",
            "rootbound garden": "dungeon moss floor",
            "crystal hall": "dungeon crystal floor",
        };
        return terrain[feature.kind];
    }
    static decorationAt(coordinates) {
        const feature = DungeonMap.featureAt(coordinates);
        if (feature === null) {
            return null;
        }
        const local = DungeonMap.localCoordinates(feature, coordinates);
        const seed = DungeonMap.cellSeed(feature, coordinates, 0x51ed270b);
        if (feature.kind === "moonwell") {
            const lakeDistance = Math.pow(local.x / Math.max(1, feature.radiusX - 2), 2) + Math.pow(local.y / Math.max(1, feature.radiusY - 2), 2);
            return lakeDistance > .62 && seed % 257 === 0
                ? "dungeon mineral cluster"
                : null;
        }
        if (feature.kind === "sand vault") {
            return seed % 17 === 0 ? "dungeon boneyard scatter" : null;
        }
        if (feature.kind === "gloamcap grove") {
            return seed % 31 === 0 ? "dungeon mushroom cluster" : null;
        }
        if (feature.kind === "boneyard") {
            return seed % 6 === 0 ? "dungeon boneyard scatter" : null;
        }
        if (feature.kind === "whispering bazaar") {
            if ((local.x === -3 && local.y === -2)
                || (local.x === 3 && local.y === 2)) {
                return "shop table";
            }
            return null;
        }
        if (feature.kind === "ember forge") {
            return seed % 11 === 0 ? "dungeon mineral cluster" : null;
        }
        if (feature.kind === "black candle chapel") {
            return seed % 71 === 0 ? "dungeon candle shrine" : null;
        }
        if (feature.kind === "spider nursery") {
            return seed % 7 === 0 ? "dungeon web tangle" : null;
        }
        if (feature.kind === "rootbound garden") {
            return seed % 4 === 0 ? "dungeon root tangle" : null;
        }
        return seed % 6 === 0 ? "dungeon mineral cluster" : null;
    }
    static itemAt(coordinates) {
        const baseItem = ItemType.getWithSeed(coordinates.getSeed(), DUNGEON_AREA);
        if ((baseItem === null || baseItem === void 0 ? void 0 : baseItem.name) === "stairs up") {
            return baseItem;
        }
        const feature = DungeonMap.featureAt(coordinates);
        if (feature === null) {
            return baseItem;
        }
        const specialItem = DungeonMap.featureItemAt(feature, coordinates);
        if (specialItem !== null) {
            return specialItem;
        }
        if (feature.kind === "moonwell") {
            const terrain = DungeonMap.terrainAt(coordinates);
            if (terrain === "dungeon moonwell water"
                || terrain === "dungeon wet floor") {
                const fish = DungeonMap.moonwellFishAt(feature, coordinates, terrain === "dungeon moonwell water");
                if (fish !== null) {
                    return fish;
                }
                // Lake creatures are fish only. Ordinary materials may still
                // wash into the shallows, but monsters never occupy the water.
                return (baseItem === null || baseItem === void 0 ? void 0 : baseItem.isMonster()) ? null : baseItem;
            }
        }
        return baseItem;
    }
    allowsItemAt(col, row, itemType) {
        var _a, _b, _c, _d;
        if (itemType.name === "stairs up") {
            return true;
        }
        if ((_b = (_a = this.map[row]) === null || _a === void 0 ? void 0 : _a[col]) !== null && _b !== void 0 ? _b : false) {
            return false;
        }
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x === 0 && y === 0) {
                    continue;
                }
                if ((_d = (_c = this.map[row + y]) === null || _c === void 0 ? void 0 : _c[col + x]) !== null && _d !== void 0 ? _d : false) {
                    return false;
                }
            }
        }
        return true;
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
                const coordinates = this.coordinatesAt(col, row);
                if (this.isNearStairs(coordinates)) {
                    const r = row;
                    (_b = dungeon_map[r]) !== null && _b !== void 0 ? _b : (dungeon_map[r] = []);
                    dungeon_map[r][col] = false;
                }
            }
        }
        return dungeon_map;
    }
    carveFeatureRooms(dungeonMap) {
        var _a;
        for (let col = 0; col <= this.width; col++) {
            for (let row = 0; row <= this.height; row++) {
                const coordinates = this.coordinatesAt(col, row);
                if (!DungeonMap.isFeatureFloorAt(coordinates)) {
                    continue;
                }
                const dungeonRow = (_a = dungeonMap[row]) !== null && _a !== void 0 ? _a : [];
                dungeonRow[col] = false;
                dungeonMap[row] = dungeonRow;
            }
        }
        return dungeonMap;
    }
    static featureItemAt(feature, coordinates) {
        const local = DungeonMap.localCoordinates(feature, coordinates);
        const seed = DungeonMap.cellSeed(feature, coordinates, 0x68bc21eb);
        const center = local.x === 0 && local.y === 0;
        if (feature.kind === "moonwell") {
            return local.x === feature.radiusX - 2 && local.y === 0
                ? new ItemType("chest")
                : null;
        }
        if (feature.kind === "sand vault") {
            if (center) {
                return new ItemType("chest");
            }
            if (seed % 13 === 0) {
                return new ItemType("broken tile");
            }
            if (seed % 23 === 0) {
                return new ItemType("ancient nail");
            }
            return null;
        }
        if (feature.kind === "gloamcap grove") {
            if (center) {
                return new ItemType("mushroom mixing");
            }
            const recipeMushroom = (local.x === -2 && local.y === 0) || (local.x === 2 && local.y === 0) || (local.x === 0 && local.y === 2);
            return recipeMushroom || seed % 59 === 0
                ? new ItemType("gloamcap mushroom")
                : null;
        }
        if (feature.kind === "boneyard") {
            if (center || seed % 19 === 0) {
                return new ItemType(seed % 2 === 0 ? "skeletal guard" : "armored skeleton");
            }
            return seed % 9 === 0 ? new ItemType("bones") : null;
        }
        if (feature.kind === "whispering bazaar") {
            if (center) {
                return new ItemType("cat selling yarrow");
            }
            if (local.x === -3 && local.y === 0) {
                return new ItemType("cat buying treasure");
            }
            return null;
        }
        if (feature.kind === "ember forge") {
            if (center) {
                return new ItemType("furnace");
            }
            return seed % 17 === 0 ? new ItemType("iron ore") : null;
        }
        if (feature.kind === "black candle chapel") {
            if (center || seed % 29 === 0) {
                return new ItemType("cultist");
            }
            return seed % 131 === 0 ? new ItemType("black candle") : null;
        }
        if (feature.kind === "spider nursery") {
            if (center || seed % 23 === 0) {
                return new ItemType(seed % 2 === 0 ? "giant spider" : "brood spider");
            }
            return seed % 9 === 0 ? new ItemType("spider silk") : null;
        }
        if (feature.kind === "rootbound garden") {
            if (center) {
                return new ItemType("moss brewing");
            }
            if (seed % 11 === 0) {
                return new ItemType("dungeon moss");
            }
            return seed % 29 === 0 ? new ItemType("yarrow") : null;
        }
        if (center || seed % 31 === 0) {
            return new ItemType("stone sentinel");
        }
        if (seed % 13 === 0) {
            return new ItemType("iron ore");
        }
        return seed % 29 === 0 ? new ItemType("ancient nail") : null;
    }
    static moonwellFishAt(feature, coordinates, deepWater) {
        const deepAreaFraction = .62
            * Math.max(1, feature.radiusX - 2)
            * Math.max(1, feature.radiusY - 2)
            / (feature.radiusX * feature.radiusY);
        const targetDensity = SurfaceMap.fishDensityPerWaterCell() * 5;
        const desiredDeepFishShare = .72;
        const density = deepWater
            ? targetDensity * desiredDeepFishShare / deepAreaFraction
            : targetDensity * (1 - desiredDeepFishShare)
                / (1 - deepAreaFraction);
        const precision = 10000;
        const placementSeed = DungeonMap.cellSeed(feature, coordinates, 0x4b93d2a7);
        if (placementSeed % precision >= Math.round(density * precision)) {
            return null;
        }
        const speciesSeed = DungeonMap.cellSeed(feature, coordinates, 0xa61f7c39);
        const fish = ItemType.RIVER_FISH_NAMES[speciesSeed % ItemType.RIVER_FISH_NAMES.length];
        return fish === undefined ? null : new ItemType(fish);
    }
    static isFeatureFloorAt(coordinates) {
        return DungeonMap.nearbyFeatures(coordinates).some(feature => {
            if (DungeonMap.isInsideRoom(feature, coordinates)) {
                return true;
            }
            const local = DungeonMap.localCoordinates(feature, coordinates);
            const horizontal = Math.abs(local.y) <= 1
                && Math.abs(local.x) <= feature.radiusX + 6;
            const vertical = Math.abs(local.x) <= 1
                && Math.abs(local.y) <= feature.radiusY + 6;
            const connectorMode = feature.seed % 3;
            return connectorMode === 0
                ? horizontal
                : connectorMode === 1
                    ? vertical
                    : horizontal || vertical;
        });
    }
    static nearbyFeatures(coordinates) {
        const chunkLatitude = Math.floor(coordinates.latitude / DungeonMap.FEATURE_CHUNK_SIZE);
        const chunkLongitude = Math.floor(coordinates.longitude / DungeonMap.FEATURE_CHUNK_SIZE);
        const features = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const feature = DungeonMap.featureForChunk(chunkLatitude + x, chunkLongitude + y);
                if (feature !== null) {
                    features.push(feature);
                }
            }
        }
        return features;
    }
    static featureForChunk(chunkLatitude, chunkLongitude) {
        const presenceSeed = DungeonMap.hash(chunkLatitude, chunkLongitude, 0x243f6a88);
        if (presenceSeed % 5 === 0) {
            return null;
        }
        const kindSeed = DungeonMap.hash(chunkLatitude, chunkLongitude, 0x85a308d3);
        const kind = DungeonMap.FEATURE_KINDS[kindSeed % DungeonMap.FEATURE_KINDS.length];
        if (kind === undefined) {
            return null;
        }
        const centerXSeed = DungeonMap.hash(chunkLatitude, chunkLongitude, 0x13198a2e);
        const centerYSeed = DungeonMap.hash(chunkLatitude, chunkLongitude, 0x03707344);
        const sizeSeed = DungeonMap.hash(chunkLatitude, chunkLongitude, 0xa4093822);
        const dimensions = {
            moonwell: [9, 7],
            "sand vault": [10, 6],
            "gloamcap grove": [7, 7],
            boneyard: [10, 5],
            "whispering bazaar": [7, 5],
            "ember forge": [8, 5],
            "black candle chapel": [7, 7],
            "spider nursery": [8, 5],
            "rootbound garden": [9, 7],
            "crystal hall": [7, 6],
        };
        const [baseRadiusX, baseRadiusY] = dimensions[kind];
        return {
            kind,
            centerLatitude: chunkLatitude * DungeonMap.FEATURE_CHUNK_SIZE
                + 5 + centerXSeed % 15,
            centerLongitude: chunkLongitude * DungeonMap.FEATURE_CHUNK_SIZE
                + 5 + centerYSeed % 15,
            radiusX: baseRadiusX + sizeSeed % 3,
            radiusY: baseRadiusY + (sizeSeed >>> 8) % 3,
            rotated: (sizeSeed & 1) === 1,
            seed: DungeonMap.hash(chunkLatitude, chunkLongitude, 0x299f31d0),
        };
    }
    static isInsideRoom(feature, coordinates) {
        const local = DungeonMap.localCoordinates(feature, coordinates);
        const absoluteX = Math.abs(local.x);
        const absoluteY = Math.abs(local.y);
        const normalizedX = absoluteX / feature.radiusX;
        const normalizedY = absoluteY / feature.radiusY;
        if (feature.kind === "sand vault"
            || feature.kind === "crystal hall") {
            return normalizedX + normalizedY <= 1.08;
        }
        if (feature.kind === "boneyard") {
            const capRadius = feature.radiusY;
            const straightLength = Math.max(0, feature.radiusX - capRadius);
            const capDistance = Math.hypot(Math.max(0, absoluteX - straightLength), absoluteY);
            return capDistance <= capRadius;
        }
        if (feature.kind === "whispering bazaar") {
            return Math.max(normalizedX, normalizedY)
                + Math.min(normalizedX, normalizedY) * .35 <= 1.15;
        }
        if (feature.kind === "ember forge") {
            return absoluteX <= feature.radiusX
                && absoluteY <= feature.radiusY;
        }
        if (feature.kind === "black candle chapel") {
            return (absoluteX <= 2 && absoluteY <= feature.radiusY) || (absoluteY <= 2 && absoluteX <= feature.radiusX);
        }
        const irregularity = feature.kind === "gloamcap grove"
            || feature.kind === "rootbound garden"
            || feature.kind === "spider nursery"
            ? Math.sin((coordinates.latitude + feature.seed % 17) * .83) * Math.cos((coordinates.longitude - feature.seed % 23) * .71) * .12
            : 0;
        return normalizedX * normalizedX
            + normalizedY * normalizedY <= 1 + irregularity;
    }
    static featureDistance(feature, coordinates) {
        const local = DungeonMap.localCoordinates(feature, coordinates);
        return Math.pow(local.x / feature.radiusX, 2)
            + Math.pow(local.y / feature.radiusY, 2);
    }
    static localCoordinates(feature, coordinates) {
        const x = coordinates.latitude - feature.centerLatitude;
        const y = coordinates.longitude - feature.centerLongitude;
        return feature.rotated ? { x: y, y: -x } : { x, y };
    }
    static cellSeed(feature, coordinates, salt) {
        return DungeonMap.hash(coordinates.latitude ^ feature.seed, coordinates.longitude + feature.seed, salt);
    }
    static hash(x, y, salt) {
        let value = Math.imul(x | 0, 0x1f123bb5)
            ^ Math.imul(y | 0, 0x5f356495)
            ^ salt;
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d);
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b);
        value ^= value >>> 16;
        return value >>> 0;
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
        const coordinates = this.coordinatesAt(x, y);
        x = 220 + coordinates.latitude;
        y = 220 + coordinates.longitude;
        x /= 8;
        y /= 8;
        x += Math.cos(x / 9) * Math.sin(y / 7);
        y += Math.sin(y / 5) * Math.cos(y / 3);
        x *= Math.cos(Math.cos(y / 19) * Math.sin(y / 17));
        y *= Math.sin(Math.sin(x / 13) * Math.sin(y / 11));
        return Math.sin(x * 0.3 * y) + Math.cos(y * 0.3 * x) > 0.1;
    }
    coordinatesAt(col, row) {
        return new GameCoordinates(this.coordinates.latitude - row, this.coordinates.longitude + col);
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
DungeonMap.FEATURE_CHUNK_SIZE = 24;
DungeonMap.FEATURE_KINDS = [
    "moonwell",
    "sand vault",
    "gloamcap grove",
    "boneyard",
    "whispering bazaar",
    "ember forge",
    "black candle chapel",
    "spider nursery",
    "rootbound garden",
    "crystal hall",
];
