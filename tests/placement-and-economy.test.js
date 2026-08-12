import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
import { DungeonMap } from "../js/DungeonMap.js";
import { DUNGEON_AREA, SHOP_AREA, SURFACE_AREA } from "../js/Area.js";
import { ItemType } from "../js/ItemType.js";
import { Image } from "../js/Image.js";
import { Map as GameMap } from "../js/Map.js";
import { SurfaceMap } from "../js/SurfaceMap.js";

test("progress instructions identify specific item names for detail buttons", () => {
    const text = "Find 5 stones and a hay to craft a stone axe with iron ore.";
    const references = GameMap.progressItemReferences(text);

    assert.deepEqual(
        references.map(reference => ({
            text: text.slice(
                reference.start,
                reference.start + reference.length,
            ),
            itemName: reference.itemName,
        })),
        [
            { text: "stones", itemName: "stone" },
            { text: "hay", itemName: "hay" },
            { text: "stone axe", itemName: "stone axe" },
            { text: "iron ore", itemName: "iron ore" },
        ],
    );
});

test("status links cover advanced, plural, and irregular item names", () => {
    const text = "Spend ancient nails and cracked skulls on a frostbind "
        + "grimoire, then pack yarrows, bone knives, and a river feast.";
    const references = GameMap.progressItemReferences(text);

    assert.deepEqual(
        references.map(reference => ({
            text: text.slice(
                reference.start,
                reference.start + reference.length,
            ),
            itemName: reference.itemName,
        })),
        [
            { text: "ancient nails", itemName: "ancient nail" },
            { text: "cracked skulls", itemName: "cracked skull" },
            {
                text: "frostbind grimoire",
                itemName: "frostbind grimoire",
            },
            { text: "yarrows", itemName: "yarrow" },
            { text: "bone knives", itemName: "bone knife" },
            { text: "river feast", itemName: "river feast" },
        ],
    );
});

test("the status-link catalog includes every defined recipe and reward", () => {
    const names = new Set(ItemType.allNames());
    for (const actionName of ItemType.CRAFTING_ACTIONS) {
        assert.equal(names.has(actionName), true, actionName);
        for (const change of new ItemType(actionName).prizes()) {
            assert.equal(
                names.has(change.itemType.name),
                true,
                actionName + " references missing " + change.itemType.name,
            );
        }
    }
});

test("entrance seed families map to matching return stairs", () => {
    for (const base of [0, 4120, 8240, 12360]) {
        for (const offset of [0, 1]) {
            const seed = base + offset;
            assert.equal(
                ItemType.getWithSeed(seed, SURFACE_AREA)?.name,
                "dungeon entrance",
            );
            assert.equal(
                ItemType.getWithSeed(seed, DUNGEON_AREA)?.name,
                "stairs up",
            );
        }

        const shopSeed = base + 2;
        assert.equal(
            ItemType.getWithSeed(shopSeed, SURFACE_AREA)?.name,
            "shop entrance",
        );
        assert.equal(
            ItemType.getWithSeed(shopSeed, SHOP_AREA)?.name,
            "stairs up",
        );
        assert.equal(
            ItemType.getShopOutsideWithSeed(shopSeed)?.name,
            "stairs up",
        );
    }
});

test("all five healing-potion flowers occur in the shop outside pool", () => {
    const expected = new Set([
        "calendula",
        "chamomile",
        "lavender",
        "red poppy",
        "cornflower",
    ]);
    const found = new Set();
    for (let seed = 1; seed <= 10_000; seed++) {
        const name = ItemType.getShopOutsideWithSeed(seed)?.name;
        if (name !== undefined && expected.has(name)) {
            found.add(name);
        }
    }

    assert.deepEqual(found, expected);
});

test("fish live in rivers, worms on land, and campfires stay rare on banks", () => {
    const fishCounts = new Map(
        ItemType.RIVER_FISH_NAMES.map(name => [name, 0]),
    );
    let campfires = 0;
    let fish = 0;
    let worms = 0;
    for (let latitude = -300; latitude <= 300; latitude++) {
        for (let longitude = -300; longitude <= 300; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const itemName = SurfaceMap.itemAt(coordinates)?.name;
            if (itemName !== undefined && ItemType.isRiverFish(itemName)) {
                assert.equal(SurfaceMap.isRiverAt(coordinates), true);
                fishCounts.set(itemName, (fishCounts.get(itemName) ?? 0) + 1);
                fish++;
            }
            if (itemName === "campfire") {
                assert.equal(SurfaceMap.isRiverAt(coordinates), false);
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
                assert.ok(neighbours.some(neighbour =>
                    SurfaceMap.isRiverAt(neighbour)
                ));
                campfires++;
            }
            if (itemName === "worm") {
                assert.equal(SurfaceMap.isRiverAt(coordinates), false);
                worms++;
            }
        }
    }

    assert.deepEqual(
        [...fishCounts.keys()],
        [...ItemType.RIVER_FISH_NAMES],
    );
    assert.ok([...fishCounts.values()].every(count => count > 35));
    assert.ok(fish >= 250 && fish <= 320, fish);
    assert.ok(campfires > 10 && campfires < 100, campfires);
    assert.ok(campfires * 3 < fish);
    assert.ok(worms >= 1_900 && worms <= 2_000, worms);
});

test("dungeon lakes hold five times more fish, mostly in deep water", () => {
    let surfaceWaterCells = 0;
    let surfaceFish = 0;
    let dungeonWaterCells = 0;
    let dungeonFish = 0;
    let deepFish = 0;
    let shallowFish = 0;
    const dungeonSpecies = new Set();

    for (let latitude = -300; latitude <= 300; latitude++) {
        for (let longitude = -300; longitude <= 300; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            if (SurfaceMap.isRiverAt(coordinates)) {
                surfaceWaterCells++;
                if (ItemType.isRiverFish(
                    SurfaceMap.itemAt(coordinates)?.name ?? "",
                )) {
                    surfaceFish++;
                }
            }

            if (DungeonMap.featureAt(coordinates)?.kind !== "moonwell") {
                continue;
            }
            const terrain = DungeonMap.terrainAt(coordinates);
            if (terrain !== "dungeon moonwell water"
                && terrain !== "dungeon wet floor"
            ) {
                continue;
            }
            dungeonWaterCells++;
            const item = DungeonMap.itemAt(coordinates);
            assert.equal(item?.isMonster() ?? false, false);
            if (!ItemType.isRiverFish(item?.name ?? "")) {
                continue;
            }
            dungeonFish++;
            dungeonSpecies.add(item?.name);
            if (terrain === "dungeon moonwell water") {
                deepFish++;
            } else {
                shallowFish++;
            }
        }
    }

    const densityRatio = (dungeonFish / dungeonWaterCells)
        / (surfaceFish / surfaceWaterCells);
    const expectedDungeonDensity =
        SurfaceMap.fishDensityPerWaterCell() * 5;
    assert.ok(
        Math.abs(
            dungeonFish / dungeonWaterCells - expectedDungeonDensity,
        ) < .01,
        {
            expectedDungeonDensity,
            dungeonFish,
            dungeonWaterCells,
        },
    );
    assert.ok(densityRatio >= 4.4 && densityRatio <= 5.8, {
        densityRatio,
        dungeonFish,
        dungeonWaterCells,
        surfaceFish,
        surfaceWaterCells,
    });
    assert.ok(deepFish > shallowFish, { deepFish, shallowFish });
    assert.deepEqual(
        dungeonSpecies,
        new Set(ItemType.RIVER_FISH_NAMES),
    );
});

test("chests are absent from surface and shop pools but present in dungeon", () => {
    let dungeonChests = 0;
    for (let seed = 1; seed <= 20_000; seed++) {
        assert.notEqual(
            ItemType.getWithSeed(seed, SURFACE_AREA)?.name,
            "chest",
        );
        assert.notEqual(
            ItemType.getWithSeed(seed, SHOP_AREA)?.name,
            "chest",
        );
        assert.notEqual(
            ItemType.getShopOutsideWithSeed(seed)?.name,
            "chest",
        );
        if (ItemType.getWithSeed(seed, DUNGEON_AREA)?.name === "chest") {
            dungeonChests++;
        }
    }

    assert.ok(dungeonChests > 0);
});

function vendorTrades() {
    const trades = new Map();
    for (let seed = 0; seed < 12_000; seed++) {
        const name = ItemType.getWithSeed(seed, SHOP_AREA)?.name;
        if (!name?.startsWith("cat ")) {
            continue;
        }
        const buying = name.startsWith("cat buying ");
        const itemName = name.slice(
            buying ? "cat buying ".length : "cat selling ".length,
        );
        const changes = new ItemType(name).prizes();
        const coin = changes.find(change => change.itemType.name === "coin");
        const item = changes.find(change => change.itemType.name === itemName);
        assert.notEqual(coin, undefined);
        assert.notEqual(item, undefined);
        const pair = trades.get(itemName) ?? {};
        pair[buying ? "buying" : "selling"] = {
            coin: coin.quantity,
            quantity: item.quantity,
        };
        trades.set(itemName, pair);
    }

    return trades;
}

test("every shop item has balanced buy and sell offers", () => {
    const trades = vendorTrades();
    assert.equal(trades.size, 21);
    for (const [itemName, pair] of trades) {
        assert.notEqual(pair.buying, undefined, itemName + " has no buyer");
        assert.notEqual(pair.selling, undefined, itemName + " has no seller");
        assert.ok(pair.buying.coin > 0);
        assert.ok(pair.selling.coin < 0);
        assert.equal(-pair.buying.quantity, pair.selling.quantity);
        assert.ok(
            -pair.selling.coin > pair.buying.coin,
            itemName + " can be traded for free profit",
        );
    }
});

test("intrinsic values and shop prices remain finite and positive", () => {
    const itemNames = [
        "stick", "stone", "hay", "root", "iron ore", "iron", "yarrow",
        "hide", "chest", "rat", "orc", "troll", "torch", "binding rope", "club",
        "stone axe", "sword", "padded hide", "wooden shield",
        "reinforced shield", "crucible", "treasure",
        "masterwork greatsword", "poison potion",
        "dungeon-forged greatblade",
    ];

    for (const itemName of itemNames) {
        const value = ItemType.intrinsicValue(itemName);
        assert.ok(Number.isFinite(value));
        assert.ok(value > 0);
        const buyingPrice = ItemType.shopPrice(itemName, 1, true);
        const sellingPrice = ItemType.shopPrice(itemName, 1, false);
        assert.ok(Number.isSafeInteger(buyingPrice) && buyingPrice > 0);
        assert.ok(Number.isSafeInteger(sellingPrice) && sellingPrice > 0);
        assert.ok(sellingPrice >= buyingPrice);
    }
});

test("surface resource tuning keeps hay and stone sparse", () => {
    assert.equal(
        ItemType.getWithSeed(811, SURFACE_AREA)?.name,
        "binding rope",
    );
    assert.equal(
        ItemType.getWithSeed(859, SURFACE_AREA)?.name,
        "club",
    );
    let bindingRopes = 0;
    let clubs = 0;
    let woodenShields = 0;
    let stoneAxes = 0;
    let surfaceHay = 0;
    let shopOutsideHay = 0;
    let surfaceStone = 0;
    let shopOutsideStone = 0;
    for (let seed = 1; seed <= 1_000_000; seed++) {
        const name = ItemType.getWithSeed(seed, SURFACE_AREA)?.name;
        if (name === "hay") {
            surfaceHay++;
        } else if (name === "stone") {
            surfaceStone++;
        }
        if (name === "binding rope") {
            bindingRopes++;
        } else if (name === "club") {
            clubs++;
        } else if (name === "wooden shield") {
            woodenShields++;
        } else if (name === "stone axe") {
            stoneAxes++;
        }
        const shopOutsideName = ItemType.getShopOutsideWithSeed(seed)?.name;
        if (shopOutsideName === "hay") {
            shopOutsideHay++;
        } else if (shopOutsideName === "stone") {
            shopOutsideStone++;
        }
    }

    assert.ok(surfaceHay >= 6_600 && surfaceHay <= 6_800, surfaceHay);
    assert.ok(
        shopOutsideHay >= 800 && shopOutsideHay <= 880,
        shopOutsideHay,
    );
    assert.ok(surfaceStone >= 9_000 && surfaceStone <= 9_300, surfaceStone);
    assert.ok(
        shopOutsideStone >= 1_150 && shopOutsideStone <= 1_250,
        shopOutsideStone,
    );
    assert.ok(bindingRopes >= 2_000, bindingRopes);
    assert.ok(clubs >= 790 && clubs <= 840, clubs);
    assert.ok(
        woodenShields >= 990 && woodenShields <= 1_040,
        woodenShields,
    );
    assert.ok(stoneAxes >= 1_400 && stoneAxes <= 1_470, stoneAxes);
    assert.ok(stoneAxes >= clubs * 0.85, { clubs, stoneAxes });
});

test("rare surface forests are dense but keep every trunk out of water", () => {
    let forestCells = 0;
    let forestTrees = 0;
    let riverTrees = 0;
    let bankTrees = 0;
    let mossCells = 0;
    const treeSizes = new Set();
    const treeOffsetsX = new Set();
    const treeOffsetsY = new Set();
    const treeMirrors = new Set();
    const treeSources = new Set();
    const mossSizes = new Set();
    const mossRotations = new Set();
    const mossOpacities = new Set();
    const totalCells = 321 * 321;

    for (let latitude = -160; latitude <= 160; latitude++) {
        for (let longitude = -160; longitude <= 160; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const forest = SurfaceMap.forestAt(coordinates);
            if (forest !== null) {
                forestCells++;
            }
            const isRiver = SurfaceMap.isRiverAt(coordinates);
            if (isRiver) {
                assert.equal(
                    SurfaceMap.hasScatteredTreeAt(coordinates),
                    false,
                );
                assert.equal(
                    SurfaceMap.hasForestMossAt(coordinates, forest),
                    false,
                );
            }
            if (SurfaceMap.hasForestMossAt(coordinates, forest)) {
                mossCells++;
                const moss = SurfaceMap.forestMossVisualAt(
                    coordinates,
                    forest,
                );
                assert.deepEqual(
                    moss,
                    SurfaceMap.forestMossVisualAt(coordinates, forest),
                );
                mossSizes.add(moss.diameterInTiles);
                mossRotations.add(moss.rotationDegrees);
                mossOpacities.add(moss.opacity);
                assert.ok(moss.opacity >= .36 && moss.opacity <= .76, moss);
            }
            if (!SurfaceMap.hasForestTreeAt(coordinates, forest)) {
                continue;
            }
            forestTrees++;
            const visual = SurfaceMap.forestTreeVisualAt(
                coordinates,
                forest,
            );
            assert.deepEqual(
                visual,
                SurfaceMap.forestTreeVisualAt(coordinates, forest),
            );
            treeSizes.add(visual.sizeMultiplier);
            treeOffsetsX.add(visual.offsetXInTiles);
            treeOffsetsY.add(visual.offsetYInTiles);
            treeMirrors.add(visual.mirrorX);
            treeSources.add(
                Image.getWithItemTypeName(
                    "forest",
                    42,
                    visual.imageSeed,
                ).src,
            );
            if (isRiver) {
                riverTrees++;
            }
            const neighbours = [
                new Coordinates(latitude - 1, longitude),
                new Coordinates(latitude + 1, longitude),
                new Coordinates(latitude, longitude - 1),
                new Coordinates(latitude, longitude + 1),
            ];
            if (neighbours.some(neighbour => SurfaceMap.isRiverAt(neighbour))) {
                bankTrees++;
            }
        }
    }

    assert.ok(forestCells / totalCells > .008, forestCells);
    assert.ok(forestCells / totalCells < .04, forestCells);
    assert.ok(forestTrees / forestCells > .45, {
        forestCells,
        forestTrees,
    });
    assert.equal(riverTrees, 0);
    assert.ok(bankTrees > 0, bankTrees);
    assert.ok(treeSizes.size > 40, treeSizes.size);
    assert.ok(treeOffsetsX.size > 50, treeOffsetsX.size);
    assert.ok(treeOffsetsY.size > 40, treeOffsetsY.size);
    assert.deepEqual([...treeMirrors].sort(), [-1, 1]);
    assert.ok(treeSources.size >= 4, [...treeSources]);
    assert.ok(mossCells > forestTrees, { mossCells, forestTrees });
    assert.ok(mossSizes.size > 40, mossSizes.size);
    assert.ok(mossRotations.size > 100, mossRotations.size);
    assert.ok(mossOpacities.size > 30, mossOpacities.size);
});

test("surface groves add tenfold bonus chances for highland gates", () => {
    let baseResidues = 0;
    let bonusResidues = 0;
    for (let seed = 0; seed < 7_817; seed++) {
        if (ItemType.isHighlandEntranceSeed(seed)) {
            baseResidues++;
        }
        if (ItemType.isBonusHighlandEntranceSeed(seed, 10)) {
            bonusResidues++;
        }
    }
    assert.equal(baseResidues, 1);
    assert.equal(bonusResidues, baseResidues * 10);

    let bonusGates = 0;

    for (let latitude = -300; latitude <= 300; latitude++) {
        for (let longitude = -300; longitude <= 300; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const forest = SurfaceMap.forestAt(coordinates);
            if (!SurfaceMap.hasForestMossAt(coordinates, forest)) {
                assert.equal(
                    SurfaceMap.hasBonusGroveHighlandGateAt(
                        coordinates,
                        forest,
                    ),
                    false,
                );
                continue;
            }
            if (!SurfaceMap.hasBonusGroveHighlandGateAt(
                coordinates,
                forest,
            )) {
                continue;
            }
            bonusGates++;
            assert.equal(SurfaceMap.isRiverAt(coordinates), false);
            assert.equal(SurfaceMap.roadAt(coordinates), null);
            const ordinaryItem = ItemType.getWithSeed(
                coordinates.getSeed(),
                SURFACE_AREA,
            );
            const existingEntrance = ordinaryItem !== null && [
                "highland gate",
                "dungeon entrance",
                "shop entrance",
            ].includes(ordinaryItem.name);
            assert.equal(SurfaceMap.itemAt(coordinates)?.name, existingEntrance
                ? ordinaryItem.name
                : "highland gate");
        }
    }

    assert.ok(bonusGates >= 4, bonusGates);
});

test("dungeon furnaces are common enough to support early smelting", () => {
    let furnaces = 0;
    for (let seed = 1; seed <= 200_000; seed++) {
        if (ItemType.getWithSeed(seed, DUNGEON_AREA)?.name === "furnace") {
            furnaces++;
        }
    }

    assert.ok(furnaces >= 500, furnaces);
});

test("captured monster prices increase with combat strength", () => {
    const ratPrice = ItemType.shopPrice("rat", 1, false);
    const orcPrice = ItemType.shopPrice("orc", 1, false);
    const trollPrice = ItemType.shopPrice("troll", 1, false);

    assert.ok(ratPrice < orcPrice);
    assert.ok(orcPrice < trollPrice);
});
