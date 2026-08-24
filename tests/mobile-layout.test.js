import assert from "node:assert/strict";
import test from "node:test";

import { calculateMapLayout } from "../js/GameController.js";

const TILE_SIZE = 42;
const VISUAL_OVERSCAN_CELLS = 2;

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
