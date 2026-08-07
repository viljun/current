import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
    DUNGEON_AREA,
    HIGHLAND_AREA,
    SHOP_AREA,
    SURFACE_AREA,
} from "../js/Area.js";
import { Coordinates } from "../js/Coordinates.js";
import { DungeonMap } from "../js/DungeonMap.js";
import { Effects } from "../js/Effects.js";
import { HighlandMap } from "../js/HighlandMap.js";
import { Image } from "../js/Image.js";
import { ItemType } from "../js/ItemType.js";
import { ShopMap } from "../js/ShopMap.js";
import { SurfaceMap } from "../js/SurfaceMap.js";

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

test("large reward flights use varied deterministic starting points", () => {
    const offsets = () => Array.from({ length: 20 }, (_, itemIndex) =>
        Effects.itemFlightStartOffset(
            987654,
            "coin",
            itemIndex,
            2,
            24,
            18,
        )
    );
    const firstRun = offsets();
    const replay = offsets();

    assert.deepEqual(firstRun, replay);
    assert.ok(
        new Set(firstRun.map(offset =>
            offset.x.toFixed(4) + "," + offset.y.toFixed(4)
        )).size >= 18,
    );
    assert.equal(
        firstRun.every(offset =>
            Math.abs(offset.x) <= 24 && Math.abs(offset.y) <= 18
        ),
        true,
    );
});

test("map items, walls, and visual properties repeat from stable inputs", () => {
    const coordinates = [
        new Coordinates(11, 408),
        new Coordinates(20, 304),
        new Coordinates(12345, 67890),
        new Coordinates(-4321, 8765),
    ];
    const areas = [
        SURFACE_AREA,
        DUNGEON_AREA,
        SHOP_AREA,
        HIGHLAND_AREA,
    ];
    const snapshot = () => coordinates.flatMap(location => areas.map(area => {
        const seed = location.getSeed();
        const item = area === SHOP_AREA && ShopMap.isOutside(location)
            ? ItemType.getShopOutsideWithSeed(seed)
            : area === DUNGEON_AREA
                ? DungeonMap.itemAt(location)
                : area === HIGHLAND_AREA
                    ? HighlandMap.itemAt(location)
                : ItemType.getWithSeed(seed, area);

        return {
            seed,
            area,
            item: item?.name ?? null,
            shopWall: ShopMap.hasWallAt(location),
            dungeonWall: DungeonMap.hasWallAt(location),
            dungeonFeature: DungeonMap.featureAt(location)?.kind ?? null,
            dungeonTerrain: DungeonMap.terrainAt(location),
            dungeonDecoration: DungeonMap.decorationAt(location),
            surfaceRiver: SurfaceMap.riverAt(location),
            surfaceItem: SurfaceMap.itemAt(location)?.name ?? null,
            surfaceRoad: SurfaceMap.roadAt(location),
            surfaceCrossing: SurfaceMap.crossingAt(location),
            surfaceMilestone: SurfaceMap.milestoneAt(location),
            highlandWall: HighlandMap.hasWallAt(location),
            highlandTerrain: HighlandMap.terrainAt(location),
            highlandCastle: HighlandMap.castleTitleAt(location),
            highlandDecoration: HighlandMap.decorationAt(location),
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

    for (const name of [
        "cat", "cactus", "palm", "yarrow", "worm", "dungeon dragon",
    ]) {
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

test("worms stay tiny, muted, and broadly rotated", () => {
    const rotations = new Set();
    for (let seed = 0; seed < 500; seed++) {
        const first = Image.getWithItemTypeName("worm", 42, seed);
        const replay = Image.getWithItemTypeName("worm", 42, seed);
        assert.equal(first.dimension, replay.dimension);
        assert.equal(first.rotate, replay.rotate);
        assert.equal(first.style, replay.style);
        assert.ok(first.dimension >= .34 && first.dimension <= .57);
        assert.ok(first.rotate >= 0 && first.rotate < 360);
        assert.match(first.style, /brightness\(\.5\).*saturate\(\.3\)/);
        rotations.add(first.rotate);
    }
    assert.ok(rotations.size >= 250);
});

test("surface rivers and tributaries are connected and deterministic", () => {
    const snapshot = [];
    const rotations = new Set();
    let rivers = 0;
    let tributaries = 0;
    for (let latitude = -150; latitude <= 150; latitude++) {
        for (let longitude = -120; longitude <= 120; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const river = SurfaceMap.riverAt(coordinates);
            if (river === null) {
                continue;
            }
            rivers++;
            if (river.channel === "tributary") {
                tributaries++;
            }
            const visual = SurfaceMap.riverVisualAt(coordinates, river);
            rotations.add(visual.rotationDegrees);
            snapshot.push([
                latitude,
                longitude,
                river.channel,
                river.systemId,
                river.depth,
                visual,
            ]);

            const neighbours = [
                new Coordinates(latitude - 1, longitude),
                new Coordinates(latitude + 1, longitude),
                new Coordinates(latitude, longitude - 1),
                new Coordinates(latitude, longitude + 1),
                new Coordinates(latitude - 1, longitude - 1),
                new Coordinates(latitude - 1, longitude + 1),
                new Coordinates(latitude + 1, longitude - 1),
                new Coordinates(latitude + 1, longitude + 1),
            ];
            assert.ok(
                neighbours.some(neighbour => SurfaceMap.isRiverAt(neighbour)),
                "river cell is isolated at " + latitude + "," + longitude,
            );
        }
    }

    assert.ok(rivers > 1_000, "expected substantial connected river coverage");
    assert.ok(tributaries > 100, "expected visible tributaries");
    assert.ok(
        rotations.size > 1_000,
        "river patches need broad full-circle rotation variation",
    );
    assert.deepEqual(
        snapshot,
        snapshot.map(entry => [...entry]),
        "surface river snapshot must repeat exactly",
    );
});

test("surface roads form sparse crossroads with paths, fords, and bridges", () => {
    const neighbours = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
    ];
    const materials = new Map();
    const routeWidths = new Map();
    const pathPatchSignatures = new Set();
    let roads = 0;
    let paths = 0;
    let crossroads = 0;
    let pathRoadContacts = 0;
    let pathEndpoints = 0;
    let isolatedRoads = 0;
    let isolatedPaths = 0;
    let grass = 0;
    let fords = 0;
    let bridges = 0;
    let milestones = 0;

    for (let latitude = -150; latitude <= 150; latitude++) {
        for (let longitude = -150; longitude <= 150; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const road = SurfaceMap.roadAt(coordinates);
            const nearbyRoads = road === null
                ? []
                : neighbours.map(([x, y]) => SurfaceMap.roadAt(
                    new Coordinates(latitude + x, longitude + y),
                ));
            if (road !== null) {
                const visual = SurfaceMap.roadVisualAt(coordinates, road);
                const routeKey = road.kind + ":" + road.routeId;
                assert.equal(visual.rotationDegrees, road.headingDegrees);
                assert.equal(
                    visual.textureOffsetXInTiles,
                    -coordinates.latitude,
                );
                assert.equal(
                    visual.textureOffsetYInTiles,
                    -coordinates.longitude,
                );
                if (routeWidths.has(routeKey)) {
                    assert.equal(
                        visual.diameterInTiles,
                        routeWidths.get(routeKey),
                    );
                } else {
                    routeWidths.set(routeKey, visual.diameterInTiles);
                }
                materials.set(
                    road.surface,
                    (materials.get(road.surface) ?? 0) + 1,
                );
                if (road.kind === "road") {
                    roads++;
                    const crossingRoutes = new Set(
                        nearbyRoads.slice(0, 4)
                            .filter(value => value?.kind === "road")
                            .map(value => value?.routeId),
                    );
                    if (crossingRoutes.size >= 2) {
                        crossroads++;
                    }
                } else {
                    paths++;
                    const patches = SurfaceMap.pathPatchVisualsAt(
                        coordinates,
                        road,
                    );
                    assert.deepEqual(
                        patches,
                        SurfaceMap.pathPatchVisualsAt(coordinates, road),
                    );
                    assert.equal(patches.length, 7);
                    for (const patch of patches) {
                        assert.ok(
                            patch.diameterInTiles >= .72
                                && patch.diameterInTiles <= 1.83,
                        );
                        assert.ok(
                            patch.opacity >= .26 && patch.opacity <= .5,
                        );
                    }
                    pathPatchSignatures.add(JSON.stringify(patches));
                    if (nearbyRoads.some(value => value?.kind === "road")) {
                        pathRoadContacts++;
                    }
                    if (
                        nearbyRoads.filter(value =>
                            value?.kind === "path"
                            && value.routeId === road.routeId
                        ).length <= 1
                    ) {
                        pathEndpoints++;
                    }
                }
                if (!nearbyRoads.some(value => value !== null)) {
                    if (road.kind === "road") {
                        isolatedRoads++;
                    } else {
                        isolatedPaths++;
                    }
                }
                if (visual.grassOpacity > 0) {
                    grass++;
                }
            }
            const crossing = SurfaceMap.crossingAt(coordinates);
            if (crossing?.kind === "ford") {
                fords++;
            }
            if (crossing?.bridgeAnchor) {
                bridges++;
            }
            if (SurfaceMap.milestoneAt(coordinates)) {
                milestones++;
            }
        }
    }

    assert.ok(roads > 2_500);
    assert.ok(paths > 500 && paths < roads / 3);
    assert.ok(crossroads > 30);
    assert.ok(pathRoadContacts > 20);
    assert.ok(pathEndpoints > 30);
    assert.equal(isolatedRoads, 0);
    assert.ok(isolatedPaths < paths / 50);
    assert.ok(fords > 150);
    assert.ok(bridges >= 2 && bridges < fords / 5);
    assert.ok(milestones > 30 && milestones < roads / 40);
    assert.ok(grass > 0 && grass < (roads + paths) / 5);
    assert.ok(pathPatchSignatures.size > 500);
    for (const material of [
        "sand",
        "gravel",
        "cobble",
        "stone",
        "dust",
        "mud",
    ]) {
        assert.ok((materials.get(material) ?? 0) > 50, material);
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

test("dungeon floor clutter has broad deterministic visual variation", () => {
    const clutterNames = [
        "dungeon root tangle",
        "dungeon boneyard scatter",
        "dungeon mineral cluster",
    ];

    for (const name of clutterNames) {
        const dimensions = new Set();
        const opacities = new Set();
        const rotations = new Set();
        for (let seed = 0; seed < 4096; seed++) {
            const image = Image.getWithItemTypeName(name, 42, seed);
            dimensions.add(image.dimension);
            rotations.add(image.rotate);
            const opacity = Number(image.style.match(/opacity:([\d.]+)/)?.[1]);
            opacities.add(opacity);
            assert.ok(image.dimension >= .5);
            assert.ok(image.dimension <= 3);
            assert.ok(opacity >= .5);
            assert.ok(opacity <= .8);
        }

        assert.ok(Math.min(...dimensions) <= .55);
        assert.ok(Math.max(...dimensions) >= 2.95);
        assert.ok(dimensions.size >= 200);
        assert.ok(opacities.size >= 25);
        assert.ok(rotations.size >= 300);
    }
});

test("dungeon floor tiles overlap while varying size and angle", () => {
    const floorNames = [
        "dungeon floor",
        "dungeon sand floor",
        "dungeon bone floor",
        "dungeon moss floor",
    ];

    for (const name of floorNames) {
        const dimensions = new Set();
        const rotations = new Set();
        for (let seed = 0; seed < 2048; seed++) {
            const image = Image.getWithItemTypeName(name, 42, seed);
            dimensions.add(image.dimension);
            rotations.add(image.rotate);
            assert.ok(image.dimension >= 1.15);
            assert.ok(image.dimension <= 3);
        }

        assert.ok(dimensions.size >= 150);
        assert.ok(rotations.size > 20);
    }
});

test("dungeon water patches overlap with deterministic circular variation", () => {
    for (const name of ["dungeon moonwell water", "dungeon wet floor"]) {
        const dimensions = new Set();
        const rotations = new Set();
        for (let seed = 0; seed < 2048; seed++) {
            const image = Image.getWithItemTypeName(name, 42, seed);
            dimensions.add(image.dimension);
            rotations.add(image.rotate);
            assert.ok(image.dimension >= 2);
            assert.ok(image.dimension <= 2.2);
            assert.match(image.src, /water-round.*transparent/);
        }
        assert.ok(dimensions.size >= 20);
        assert.ok(rotations.size >= 300);
    }
});

test("cracked skulls vary modestly in size and rotation", () => {
    const dimensions = new Set();
    const rotations = new Set();
    for (let seed = 0; seed < 2048; seed++) {
        const image = Image.getWithItemTypeName("cracked skull", 42, seed);
        dimensions.add(image.dimension);
        rotations.add(image.rotate);
        assert.ok(image.dimension >= 1.05);
        assert.ok(image.dimension <= 1.26);
        assert.ok(image.rotate >= -8);
        assert.ok(image.rotate <= 8);
    }
    assert.equal(dimensions.size, 22);
    assert.equal(rotations.size, 17);
});
