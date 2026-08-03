import assert from "node:assert/strict";
import test from "node:test";

import { DUNGEON_AREA, SHOP_AREA, SURFACE_AREA } from "../js/Area.js";
import { Coordinates } from "../js/Coordinates.js";
import { DungeonMap } from "../js/DungeonMap.js";
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
