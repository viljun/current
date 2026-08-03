import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { DUNGEON_AREA, SHOP_AREA, SURFACE_AREA } from "../js/Area.js";
import { Coordinates } from "../js/Coordinates.js";
import { DungeonMap } from "../js/DungeonMap.js";
import { Image } from "../js/Image.js";
import { ItemType } from "../js/ItemType.js";
import { ShopMap } from "../js/ShopMap.js";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));

function filesBelow(directory) {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...filesBelow(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

test("gameplay source contains no nondeterministic random APIs", () => {
    const forbidden = [
        { pattern: /\bMath\.random\s*\(/, name: "Math.random" },
        {
            pattern: /\bcrypto(?:\?\.)?\.getRandomValues\s*\(/,
            name: "crypto.getRandomValues",
        },
        { pattern: /\brandomUUID\s*\(/, name: "randomUUID" },
    ];
    const sourceFiles = filesBelow(path.join(PROJECT_ROOT, "ts"))
        .filter(file => file.endsWith(".ts"));

    for (const sourceFile of sourceFiles) {
        const source = readFileSync(sourceFile, "utf8");
        for (const { pattern, name } of forbidden) {
            assert.doesNotMatch(
                source,
                pattern,
                path.relative(PROJECT_ROOT, sourceFile) + " uses " + name,
            );
        }
    }
});

test("map items, walls, and visual properties repeat from stable inputs", () => {
    const coordinates = [
        new Coordinates(11, 408),
        new Coordinates(20, 304),
        new Coordinates(12345, 67890),
        new Coordinates(-4321, 8765),
    ];
    const areas = [SURFACE_AREA, DUNGEON_AREA, SHOP_AREA];
    const snapshot = () => coordinates.flatMap(location => areas.map(area => {
        const seed = location.getSeed();
        const item = area === SHOP_AREA && ShopMap.isOutside(location)
            ? ItemType.getShopOutsideWithSeed(seed)
            : ItemType.getWithSeed(seed, area);

        return {
            seed,
            area,
            item: item?.name ?? null,
            shopWall: ShopMap.hasWallAt(location),
            dungeonWall: DungeonMap.hasWallAt(location),
        };
    }));

    assert.deepEqual(snapshot(), snapshot());

    const firstMap = DungeonMap.forViewport(
        13,
        17,
        new Coordinates(20, 304),
        10,
    );
    const secondMap = DungeonMap.forViewport(
        13,
        17,
        new Coordinates(20, 304),
        10,
    );
    assert.deepEqual(firstMap.map, secondMap.map);

    for (const name of ["cat", "cactus", "palm", "yarrow", "dungeon dragon"]) {
        const first = Image.getWithItemTypeName(name, 42, 987654);
        const second = Image.getWithItemTypeName(name, 42, 987654);
        assert.deepEqual(
            {
                dimension: first.dimension,
                src: first.src,
                style: first.style,
                rotate: first.rotate,
                zIndex: first.zIndex,
            },
            {
                dimension: second.dimension,
                src: second.src,
                style: second.style,
                rotate: second.rotate,
                zIndex: second.zIndex,
            },
        );
    }
});

test("palms and cactuses stay between their base size and double size", () => {
    const ranges = {
        cactus: { minimum: 1.4, maximum: 2.8 },
        palm: { minimum: 2.2, maximum: 4.4 },
    };

    for (const [name, range] of Object.entries(ranges)) {
        const dimensions = new Set();
        for (let seed = 0; seed < 2048; seed++) {
            const dimension = Image.getWithItemTypeName(name, 42, seed).dimension;
            dimensions.add(dimension);
            assert.ok(dimension >= range.minimum);
            assert.ok(dimension <= range.maximum);
        }
        assert.ok(dimensions.size >= 80, name + " has too little size variation");
    }
});
