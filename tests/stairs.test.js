import assert from "node:assert/strict";
import test from "node:test";

import {
    DUNGEON_AREA,
    HIGHLAND_AREA,
    SHOP_AREA,
    SURFACE_AREA,
} from "../js/Area.js";
import { Coordinates } from "../js/Coordinates.js";
import { DungeonMap } from "../js/DungeonMap.js";
import { HighlandMap } from "../js/HighlandMap.js";
import { ItemType } from "../js/ItemType.js";
import { ShopMap } from "../js/ShopMap.js";

const DUNGEON_MAP_EXTRA_SIZE = 10;
const DUNGEON_ENTRANCES = [
    new Coordinates(11, 408),
    // With the old uncentered construction, this stair became a wall in the
    // 13x17 viewport below.
    new Coordinates(20, 304),
    new Coordinates(28, 609),
    new Coordinates(41, 764),
];
const SHOP_ENTRANCES = [
    new Coordinates(2, 2498),
    new Coordinates(21, 2470),
    new Coordinates(23, 1300),
    new Coordinates(27, 1600),
];
const VIEWPORTS = [
    { cols: 9, rows: 9 },
    { cols: 13, rows: 17 },
    { cols: 25, rows: 19 },
];

test("dungeon entrances retain visible, walkable stairs across viewport sizes", () => {
    for (const coordinates of DUNGEON_ENTRANCES) {
        const seed = coordinates.getSeed();
        assert.equal(
            ItemType.getWithSeed(seed, SURFACE_AREA)?.name,
            "dungeon entrance",
        );
        assert.equal(
            ItemType.getWithSeed(seed, DUNGEON_AREA)?.name,
            "stairs up",
        );

        for (const { cols, rows } of VIEWPORTS) {
            const dungeonMap = DungeonMap.forViewport(
                cols,
                rows,
                coordinates,
                DUNGEON_MAP_EXTRA_SIZE,
            );
            const mapColumn = (cols + 1) / 2 + DUNGEON_MAP_EXTRA_SIZE;
            const mapRow = (rows + 1) / 2 + DUNGEON_MAP_EXTRA_SIZE;

            assert.equal(
                dungeonMap.map[mapRow]?.[mapColumn] ?? false,
                false,
                "stairs at " + coordinates.latitude + ","
                    + coordinates.longitude + " became a wall in "
                    + cols + "x" + rows + " viewport",
            );
        }
    }
});

test("dungeon items and monsters keep a full tile away from walls", () => {
    const cols = 101;
    const rows = 101;
    const center = new Coordinates(1000, 1000);
    const dungeonMap = DungeonMap.forViewport(
        cols,
        rows,
        center,
        DUNGEON_MAP_EXTRA_SIZE,
    );
    let rejectedBesideWalls = 0;
    let allowedInOpenFloor = 0;

    for (let y = 1; y <= rows; y++) {
        for (let x = 1; x <= cols; x++) {
            const coordinates = new Coordinates(
                center.latitude + (rows + 1) / 2 - y,
                center.longitude + x - (cols + 1) / 2,
            );
            const itemType = DungeonMap.itemAt(coordinates);
            if (itemType === null || itemType.name === "stairs up") {
                continue;
            }

            const col = x + DUNGEON_MAP_EXTRA_SIZE;
            const row = y + DUNGEON_MAP_EXTRA_SIZE;
            if (dungeonMap.map[row]?.[col] ?? false) {
                continue;
            }
            let besideWall = false;
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    if (offsetX === 0 && offsetY === 0) {
                        continue;
                    }
                    if (dungeonMap.map[row + offsetY]?.[col + offsetX] ?? false) {
                        besideWall = true;
                    }
                }
            }

            assert.equal(
                dungeonMap.allowsItemAt(col, row, itemType),
                !besideWall,
                itemType.name + " at " + coordinates.latitude + ","
                    + coordinates.longitude,
            );
            if (besideWall) {
                rejectedBesideWalls++;
            } else {
                allowedInOpenFloor++;
            }
        }
    }

    assert.ok(rejectedBesideWalls > 0);
    assert.ok(allowedInOpenFloor > 0);
});

test("all ten deterministic dungeon landmarks carve walkable themed rooms", () => {
    const expectedKinds = new Set([
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
    ]);
    const features = new Map();
    const decorations = new Set();
    for (let latitude = -140; latitude <= 240; latitude += 2) {
        for (let longitude = -140; longitude <= 240; longitude += 2) {
            const coordinates = new Coordinates(latitude, longitude);
            const feature = DungeonMap.featureAt(coordinates);
            if (feature !== null && !features.has(feature.kind)) {
                features.set(feature.kind, feature);
            }
            const decoration = DungeonMap.decorationAt(coordinates);
            if (decoration !== null) {
                decorations.add(decoration);
            }
        }
    }

    assert.deepEqual(new Set(features.keys()), expectedKinds);
    assert.ok(decorations.has("dungeon mushroom cluster"));
    assert.ok(decorations.has("dungeon boneyard scatter"));
    assert.ok(decorations.has("dungeon mineral cluster"));
    assert.ok(decorations.has("dungeon candle shrine"));

    const centerItems = {
        "sand vault": "chest",
        "gloamcap grove": "mushroom mixing",
        boneyard: new Set(["skeletal guard", "armored skeleton"]),
        "whispering bazaar": "cat selling yarrow",
        "ember forge": "furnace",
        "black candle chapel": "cultist",
        "spider nursery": new Set(["giant spider", "brood spider"]),
        "rootbound garden": "moss brewing",
        "crystal hall": "stone sentinel",
    };
    const centerTerrains = new Set();
    const titles = new Set();
    for (const [kind, feature] of features) {
        const center = new Coordinates(
            feature.centerLatitude,
            feature.centerLongitude,
        );
        assert.equal(DungeonMap.featureAt(center)?.kind, kind);
        assert.equal(DungeonMap.hasWallAt(center), false);
        centerTerrains.add(DungeonMap.terrainAt(center));
        titles.add(DungeonMap.featureTitleAt(center));
        const expectedItem = centerItems[kind];
        if (typeof expectedItem === "string") {
            assert.equal(DungeonMap.itemAt(center)?.name, expectedItem);
        } else if (expectedItem instanceof Set) {
            assert.ok(expectedItem.has(DungeonMap.itemAt(center)?.name));
        }

        for (const { cols, rows } of VIEWPORTS) {
            const dungeonMap = DungeonMap.forViewport(
                cols,
                rows,
                center,
                DUNGEON_MAP_EXTRA_SIZE,
            );
            const mapColumn = (cols + 1) / 2 + DUNGEON_MAP_EXTRA_SIZE;
            const mapRow = (rows + 1) / 2 + DUNGEON_MAP_EXTRA_SIZE;
            assert.equal(
                dungeonMap.map[mapRow]?.[mapColumn] ?? false,
                false,
                kind + " center became a wall",
            );
        }
    }

    assert.equal(centerTerrains.size, 10);
    assert.equal(titles.size, 10);
});

test("gloamcap groves stay sparse but provide enough mushrooms to mix", () => {
    const groves = new Map();
    for (let latitude = -240; latitude <= 240; latitude += 4) {
        for (let longitude = -240; longitude <= 240; longitude += 4) {
            const feature = DungeonMap.featureAt(
                new Coordinates(latitude, longitude),
            );
            if (feature?.kind === "gloamcap grove") {
                groves.set(
                    feature.centerLatitude + "," + feature.centerLongitude,
                    feature,
                );
            }
        }
    }
    assert.ok(groves.size >= 12);

    for (const feature of [...groves.values()].slice(0, 12)) {
        let floorCells = 0;
        let collectibleMushrooms = 0;
        let decorativeClusters = 0;
        for (
            let latitude = feature.centerLatitude - feature.radiusX - 2;
            latitude <= feature.centerLatitude + feature.radiusX + 2;
            latitude++
        ) {
            for (
                let longitude = feature.centerLongitude - feature.radiusY - 2;
                longitude <= feature.centerLongitude + feature.radiusY + 2;
                longitude++
            ) {
                const coordinates = new Coordinates(latitude, longitude);
                const current = DungeonMap.featureAt(coordinates);
                if (current?.kind !== "gloamcap grove"
                    || current.centerLatitude !== feature.centerLatitude
                    || current.centerLongitude !== feature.centerLongitude
                ) {
                    continue;
                }
                floorCells++;
                if (DungeonMap.itemAt(coordinates)?.name
                    === "gloamcap mushroom"
                ) {
                    collectibleMushrooms++;
                }
                if (DungeonMap.decorationAt(coordinates)
                    === "dungeon mushroom cluster"
                ) {
                    decorativeClusters++;
                }
            }
        }
        assert.ok(collectibleMushrooms >= 3);
        assert.ok(
            (collectibleMushrooms + decorativeClusters) / floorCells < .1,
            "mushrooms cover too much of the grove at "
                + feature.centerLatitude + "," + feature.centerLongitude,
        );
    }
});

test("dense dungeon clutter is deterministically thinned", () => {
    const counts = {
        candleShrines: 0,
        moonwellPlants: 0,
        blackCandles: 0,
        graveDust: 0,
    };

    for (let latitude = -300; latitude <= 300; latitude++) {
        for (let longitude = -300; longitude <= 300; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const decoration = DungeonMap.decorationAt(coordinates);
            if (decoration === "dungeon candle shrine") {
                counts.candleShrines++;
            }
            if (
                decoration === "dungeon mineral cluster"
                && DungeonMap.featureAt(coordinates)?.kind === "moonwell"
            ) {
                counts.moonwellPlants++;
            }

            const itemName = DungeonMap.itemAt(coordinates)?.name;
            if (itemName === "black candle") {
                counts.blackCandles++;
            } else if (itemName === "grave dust") {
                counts.graveDust++;
            }
        }
    }

    assert.ok(counts.candleShrines >= 70 && counts.candleShrines <= 120);
    assert.ok(counts.moonwellPlants >= 20 && counts.moonwellPlants <= 50);
    assert.ok(counts.blackCandles >= 35 && counts.blackCandles <= 70);
    assert.ok(counts.graveDust >= 2_500 && counts.graveDust <= 3_500);
});

test("shop entrances retain visible, walkable stairs inside and outside", () => {
    const outsideStates = new Set();
    for (const coordinates of SHOP_ENTRANCES) {
        const seed = coordinates.getSeed();
        assert.equal(
            ItemType.getWithSeed(seed, SURFACE_AREA)?.name,
            "shop entrance",
        );
        assert.equal(
            ItemType.getWithSeed(seed, SHOP_AREA)?.name,
            "stairs up",
        );

        const outside = ShopMap.isOutside(coordinates);
        outsideStates.add(outside);
        const visibleItem = outside
            ? ItemType.getShopOutsideWithSeed(seed)
            : ItemType.getWithSeed(seed, SHOP_AREA);
        assert.equal(visibleItem?.name, "stairs up");
        assert.equal(ShopMap.hasWallAt(coordinates), false);
        assert.equal(ShopMap.decorationAt(coordinates), null);
    }

    assert.deepEqual(outsideStates, new Set([false, true]));
});

test("highland gates retain walkable exits in the rugged realm", () => {
    const entrances = [];
    for (let latitude = 1; latitude <= 800 && entrances.length < 4; latitude++) {
        for (
            let longitude = 1;
            longitude <= 800 && entrances.length < 4;
            longitude++
        ) {
            const coordinates = new Coordinates(latitude, longitude);
            if (ItemType.getWithSeed(
                coordinates.getSeed(),
                SURFACE_AREA,
            )?.name === "highland gate") {
                entrances.push(coordinates);
            }
        }
    }
    assert.equal(entrances.length, 4);
    for (const coordinates of entrances) {
        assert.equal(HighlandMap.itemAt(coordinates)?.name, "stairs up");
        assert.equal(HighlandMap.hasWallAt(coordinates), false);
        assert.equal(HIGHLAND_AREA, 3);
    }
});

test("rare highland castles have large mazes and reachable magicians", () => {
    const castles = new Map();
    for (let latitude = -500; latitude <= 500; latitude += 7) {
        for (let longitude = -500; longitude <= 500; longitude += 7) {
            const castle = HighlandMap.castleAt(
                new Coordinates(latitude, longitude),
            );
            if (castle !== null) {
                castles.set(castle.centerX + "," + castle.centerY, castle);
            }
        }
    }
    assert.ok(castles.size >= 5);
    const spellMerchants = new Set();
    for (const castle of [...castles.values()].slice(0, 8)) {
        assert.ok(castle.radiusX >= 18);
        assert.ok(castle.radiusY >= 21);
        const title = HighlandMap.castleTitleAt(new Coordinates(
            castle.centerX,
            castle.centerY,
        ));
        assert.match(title, / Castle$/);
        const start = new Coordinates(
            castle.centerX,
            castle.centerY - castle.radiusY,
        );
        assert.equal(HighlandMap.hasWallAt(start), false);

        let magician = null;
        let wallCount = 0;
        let floorCount = 0;
        for (
            let y = castle.centerY - castle.radiusY;
            y <= castle.centerY + castle.radiusY;
            y++
        ) {
            for (
                let x = castle.centerX - castle.radiusX;
                x <= castle.centerX + castle.radiusX;
                x++
            ) {
                const coordinates = new Coordinates(x, y);
                if (HighlandMap.castleAt(coordinates) === null) {
                    continue;
                }
                if (HighlandMap.hasWallAt(coordinates)) {
                    wallCount++;
                } else {
                    floorCount++;
                }
                const item = HighlandMap.itemAt(coordinates);
                if (item?.name.startsWith("magician selling ")) {
                    magician = coordinates;
                    spellMerchants.add(item.name);
                }
            }
        }
        assert.ok(wallCount > 250);
        assert.ok(floorCount > 600);
        assert.notEqual(magician, null);

        const queue = [start];
        const visited = new Set([
            start.latitude + "," + start.longitude,
        ]);
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.equals(magician)) {
                break;
            }
            for (const [x, y] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const neighbour = new Coordinates(
                    current.latitude + x,
                    current.longitude + y,
                );
                const key = neighbour.latitude + "," + neighbour.longitude;
                if (visited.has(key)
                    || HighlandMap.castleAt(neighbour) === null
                    || HighlandMap.hasWallAt(neighbour)
                ) {
                    continue;
                }
                visited.add(key);
                queue.push(neighbour);
            }
        }
        assert.ok(
            visited.has(magician.latitude + "," + magician.longitude),
            title + " magician is unreachable",
        );
    }
    assert.ok(spellMerchants.size >= 2);
});
