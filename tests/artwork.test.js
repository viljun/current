import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SHOP_AREA } from "../js/Area.js";
import { Image } from "../js/Image.js";
import { ItemType } from "../js/ItemType.js";

const IMAGES_DIRECTORY = fileURLToPath(new URL("../images/", import.meta.url));
const DUNGEON_MONSTERS = [
    "bone rat", "cave bat", "giant spider", "plague beetle", "crypt hound",
    "skeletal guard", "dungeon scavenger", "goblin cutthroat", "tomb robber",
    "cave crawler", "ghoul", "wight", "cultist", "armored skeleton",
    "brood spider", "cave troll", "dungeon orc", "plague bearer",
    "stone sentinel", "crypt knight", "banshee", "necromancer",
    "ogre jailer", "basilisk", "minotaur", "vampire", "lich",
    "bone colossus", "abyssal knight", "dungeon dragon",
];

function imageSignature(source) {
    const path = IMAGES_DIRECTORY + source;
    assert.ok(statSync(path).size > 0, source + " is empty");

    return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function vendorNames() {
    const names = new Set();
    for (let seed = 0; seed < 12_000; seed++) {
        const name = ItemType.getWithSeed(seed, SHOP_AREA)?.name;
        if (name?.startsWith("cat ")) {
            names.add(name);
        }
    }

    return [...names].sort();
}

test("all dungeon monsters use distinct, existing image content", () => {
    const sources = DUNGEON_MONSTERS.map(name =>
        Image.getWithItemTypeName(name, 42, 12345).src
    );
    assert.equal(sources.length, 30);
    assert.equal(new Set(sources).size, sources.length);
    const signatures = sources.map(imageSignature);
    assert.equal(new Set(signatures).size, signatures.length);
});

test("all vendor cats use distinct, existing image content", () => {
    const vendors = vendorNames();
    assert.equal(vendors.length, 42);
    const sources = vendors.map(name =>
        Image.getWithItemTypeName(name, 42, 12345).src
    );
    assert.equal(new Set(sources).size, sources.length);
    const signatures = sources.map(imageSignature);
    assert.equal(new Set(signatures).size, signatures.length);
});

test("vendor cat scale is bounded and increases with trade price", () => {
    const trades = vendorNames().map(name => {
        const coinChange = new ItemType(name).prizes()
            .find(change => change.itemType.name === "coin");
        assert.notEqual(coinChange, undefined);

        return {
            name,
            price: Math.abs(coinChange.quantity),
            scale: ItemType.vendorCatPlayerScale(name),
        };
    }).sort((first, second) => first.price - second.price);

    assert.equal(Math.min(...trades.map(trade => trade.scale)), 0.5);
    assert.equal(Math.max(...trades.map(trade => trade.scale)), 1.8);
    for (let index = 1; index < trades.length; index++) {
        const previous = trades[index - 1];
        const current = trades[index];
        assert.ok(current.scale >= previous.scale);
        if (current.price === previous.price) {
            assert.equal(current.scale, previous.scale);
        }
    }
});
