import assert from "node:assert/strict";
import test from "node:test";

import { calculateMapLayout } from "../js/GameController.js";
import { Map as GameMap } from "../js/Map.js";

const TILE_SIZE = 42;
const VISUAL_OVERSCAN_CELLS = 2;

function near(actual, expected, tolerance = 0.0001) {
    assert.ok(Math.abs(actual - expected) <= tolerance);
}

test("screen drag offsets are converted into rotated map coordinates", () => {
    let offset = GameMap.mapLocalOffsetForScreenOffset(12, -8, 0);
    near(offset.x, 12);
    near(offset.y, -8);

    offset = GameMap.mapLocalOffsetForScreenOffset(-84, 0, -90);
    near(offset.x, 0);
    near(offset.y, -84);

    offset = GameMap.mapLocalOffsetForScreenOffset(20, 0, 45);
    near(offset.x, Math.sqrt(200));
    near(offset.y, -Math.sqrt(200));
});

test("map-local slide offsets are converted into screen coordinates", () => {
    let offset = GameMap.screenOffsetForMapLocalOffset(12, -8, 0);
    near(offset.x, 12);
    near(offset.y, -8);

    offset = GameMap.screenOffsetForMapLocalOffset(-84, 0, -90);
    near(offset.x, 0);
    near(offset.y, 84);

    offset = GameMap.screenOffsetForMapLocalOffset(
        Math.sqrt(200),
        -Math.sqrt(200),
        45,
    );
    near(offset.x, 20);
    near(offset.y, 0);
});

test("mobile map uses an odd centered circle covering every screen corner", () => {
    const viewports = [
        { width: 320, height: 568 },
        { width: 375, height: 667 },
        { width: 390, height: 844 },
        { width: 412, height: 915 },
        { width: 430, height: 932 },
    ];

    for (const { width, height } of viewports) {
        const layout = calculateMapLayout(
            width,
            height,
            TILE_SIZE,
            VISUAL_OVERSCAN_CELLS,
        );
        assert.equal(layout.cols % 2, 1);
        assert.equal(layout.rows % 2, 1);
        assert.equal(layout.cols, layout.rows);
        assert.equal(layout.mapWidth, layout.mapHeight);
        assert.ok(layout.mapWidth >= width);
        assert.ok(layout.mapHeight >= height);
        assert.ok(layout.marginLeft <= 0);
        assert.ok(layout.marginTop <= 0);

        const centerCellLeft = layout.marginLeft
            + ((layout.cols - 1) / 2) * TILE_SIZE;
        const centerCellTop = layout.marginTop
            + ((layout.rows - 1) / 2) * TILE_SIZE;
        assert.equal(centerCellLeft + TILE_SIZE / 2, width / 2);
        assert.equal(centerCellTop + TILE_SIZE / 2, height / 2);
        assert.ok(
            layout.mapWidth / 2
                >= Math.hypot(width, height) / 2
                    + VISUAL_OVERSCAN_CELLS * TILE_SIZE,
        );
    }
});

test("desktop map uses the same centered circular-coverage invariant", () => {
    for (const { width, height } of [
        { width: 1024, height: 768 },
        { width: 1366, height: 768 },
        { width: 1920, height: 1080 },
    ]) {
        const layout = calculateMapLayout(
            width,
            height,
            TILE_SIZE,
            VISUAL_OVERSCAN_CELLS,
        );
        assert.equal(layout.cols, layout.rows);
        assert.equal(layout.mapWidth, layout.mapHeight);
        assert.ok(layout.mapWidth >= width);
        assert.ok(layout.mapHeight >= height);
        assert.ok(
            layout.mapWidth / 2
                >= Math.hypot(width, height) / 2
                    + VISUAL_OVERSCAN_CELLS * TILE_SIZE,
        );
        assert.equal(
            layout.marginLeft + layout.mapWidth / 2,
            width / 2,
        );
        assert.equal(
            layout.marginTop + layout.mapHeight / 2,
            height / 2,
        );
    }
});
