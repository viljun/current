import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
import { DUNGEON_AREA, SHOP_AREA, SURFACE_AREA } from "../js/Area.js";
import { ItemType } from "../js/ItemType.js";
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
    assert.ok(worms >= 1_500 && worms <= 2_000, worms);
    assert.ok(worms > fish * 5, { fish, worms });
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
    assert.ok(clubs >= 1_580 && clubs <= 1_650, clubs);
    assert.ok(stoneAxes >= 1_400 && stoneAxes <= 1_470, stoneAxes);
    assert.ok(stoneAxes >= clubs * 0.85, { clubs, stoneAxes });
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
