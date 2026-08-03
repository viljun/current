import assert from "node:assert/strict";
import test from "node:test";

import { DUNGEON_AREA, SHOP_AREA, SURFACE_AREA } from "../js/Area.js";
import { ItemType } from "../js/ItemType.js";

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
        "hide", "chest", "rat", "orc", "troll", "torch", "club",
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

test("early crafting locations are denser without removing old placements", () => {
    assert.equal(
        ItemType.getWithSeed(811, SURFACE_AREA)?.name,
        "torch",
    );
    assert.equal(
        ItemType.getWithSeed(859, SURFACE_AREA)?.name,
        "club",
    );
    let torches = 0;
    let clubs = 0;
    for (let seed = 1; seed <= 200_000; seed++) {
        const name = ItemType.getWithSeed(seed, SURFACE_AREA)?.name;
        if (name === "torch") {
            torches++;
        } else if (name === "club") {
            clubs++;
        }
    }

    assert.ok(torches >= 350, torches);
    assert.ok(clubs >= 350, clubs);
});

test("monster trophy prices increase with combat strength", () => {
    const ratPrice = ItemType.shopPrice("rat", 1, false);
    const orcPrice = ItemType.shopPrice("orc", 1, false);
    const trollPrice = ItemType.shopPrice("troll", 1, false);

    assert.ok(ratPrice < orcPrice);
    assert.ok(orcPrice < trollPrice);
});
