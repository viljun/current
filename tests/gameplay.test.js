import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
import { Inventory } from "../js/Inventory.js";
import { ItemTaking } from "../js/ItemTaking.js";
import { ItemType } from "../js/ItemType.js";
import { MonsterDefinition } from "../js/MonsterDefinition.js";

class MemoryStorage {
    values = new Map();

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }

    clear() {
        this.values.clear();
    }
}

globalThis.localStorage = new MemoryStorage();

function changesFor(itemName) {
    return new ItemType(itemName).prizes().map(change => ({
        item: change.itemType.name,
        quantity: change.quantity,
    }));
}

test("dungeon and shop entrances always return through the same coordinate", () => {
    const entrances = [
        {
            coordinates: new Coordinates(20, 304),
            entrance: "dungeon entrance",
            area: 1,
        },
        {
            coordinates: new Coordinates(21, 2470),
            entrance: "shop entrance",
            area: 2,
        },
    ];

    for (const { coordinates, entrance, area } of entrances) {
        localStorage.clear();
        const inventory = new Inventory();
        assert.equal(inventory.takeItem(coordinates)?.itemType.name, entrance);
        assert.equal(inventory.getAreaId(), area);

        const reloaded = new Inventory();
        assert.equal(reloaded.getAreaId(), area);
        assert.equal(reloaded.takeItem(coordinates)?.itemType.name, "stairs up");
        assert.equal(reloaded.getAreaId(), 0);
        assert.equal(new Inventory().getAreaId(), 0);
    }
});

test("taken coordinates cannot be collected twice and survive reload", () => {
    localStorage.clear();
    const coordinates = new Coordinates(1, 111);
    const inventory = new Inventory();
    assert.equal(inventory.takeItem(coordinates)?.itemType.name, "stick");
    assert.equal(inventory.countItems(new ItemType("stick")), 1);
    assert.equal(inventory.takeItem(coordinates), null);
    assert.equal(inventory.countItems(new ItemType("stick")), 1);

    const reloaded = new Inventory();
    assert.equal(reloaded.isItemTaken(coordinates), true);
    assert.equal(reloaded.countItems(new ItemType("stick")), 1);
});

test("healing and poison crafting preserve the intended progression", () => {
    assert.deepEqual(changesFor("healing potion"), [
        { item: "calendula", quantity: -1 },
        { item: "chamomile", quantity: -1 },
        { item: "lavender", quantity: -1 },
        { item: "red poppy", quantity: -1 },
        { item: "cornflower", quantity: -1 },
    ]);
    assert.deepEqual(changesFor("poison potion"), [
        { item: "healing potion", quantity: -1 },
        { item: "grave dust", quantity: -1 },
    ]);
    assert.deepEqual(changesFor("poisoned masterwork greatsword"), [
        { item: "masterwork greatsword", quantity: -1 },
        { item: "poison potion", quantity: -1 },
    ]);

    const missingDust = new ItemTaking(
        new ItemType("poison potion"),
        { totalQuantities: { "healing potion": 1 } },
    ).summary();
    assert.deepEqual(
        missingDust.missing.map(change => ({
            item: change.itemType.name,
            quantity: change.quantity,
        })),
        [{ item: "grave dust", quantity: -1 }],
    );

    const craftable = new ItemTaking(
        new ItemType("poison potion"),
        { totalQuantities: { "healing potion": 1, "grave dust": 1 } },
    ).summary();
    assert.deepEqual(craftable.missing, []);
});

const DUNGEON_MONSTERS = [
    "bone rat", "cave bat", "giant spider", "plague beetle", "crypt hound",
    "skeletal guard", "dungeon scavenger", "goblin cutthroat", "tomb robber",
    "cave crawler", "ghoul", "wight", "cultist", "armored skeleton",
    "brood spider", "cave troll", "dungeon orc", "plague bearer",
    "stone sentinel", "crypt knight", "banshee", "necromancer",
    "ogre jailer", "basilisk", "minotaur", "vampire", "lich",
    "bone colossus", "abyssal knight", "dungeon dragon",
];

test("dungeon monsters increase in strength and give varied tiered rewards", () => {
    let previousHealth = 0;
    DUNGEON_MONSTERS.forEach((name, index) => {
        const definition = MonsterDefinition.get(name);
        assert.notEqual(definition, null);
        assert.ok(definition.health > previousHealth);
        previousHealth = definition.health;
        assert.equal(new ItemType(name).isMonster(), true);
        const changes = changesFor(name);
        assert.deepEqual(changes[0],
            { item: "grave dust", quantity: -(1 + Math.floor(index / 10)) },
        );
        const rewards = changes.slice(1);
        const coinRewards = rewards.filter(change => change.item === "coin");
        const itemRewards = rewards.filter(change => change.item !== "coin");
        assert.ok(rewards.every(change => change.quantity > 0));
        if (index % 3 === 0) {
            assert.equal(coinRewards.length, 1, name);
            assert.equal(itemRewards.length, 0, name);
        } else if (index % 3 === 1) {
            assert.equal(coinRewards.length, 0, name);
            assert.ok(itemRewards.length >= 1, name);
        } else {
            assert.equal(coinRewards.length, 1, name);
            assert.ok(itemRewards.length >= 1, name);
        }
    });
});

test("surface monster rewards progress from money to mixed and item rewards", () => {
    assert.deepEqual(changesFor("rat"), [
        { item: "torch", quantity: -1 },
        { item: "coin", quantity: 10 },
    ]);
    assert.deepEqual(changesFor("orc"), [
        { item: "torch", quantity: -2 },
        { item: "coin", quantity: 50 },
        { item: "hide", quantity: 1 },
    ]);
    assert.deepEqual(changesFor("troll"), [
        { item: "torch", quantity: -3 },
        { item: "club", quantity: 1 },
        { item: "iron", quantity: 2 },
        { item: "hide", quantity: 2 },
    ]);
});

const DUNGEON_MATERIALS = new Set([
    "bones", "cracked skull", "rusted chain", "grave dust", "bat wing",
    "spider silk", "black candle", "ancient nail", "broken tile",
    "dungeon moss",
]);
const DUNGEON_WEAPONS = [
    "bone knife", "spiked cudgel", "iron dagger", "falchion", "morning star",
    "war pick", "heavy crossbow", "zweihander", "halberd",
    "executioner's axe", "estoc", "bec de corbin", "gothic mace",
    "runed longsword", "blacksteel glaive", "relic warhammer",
    "dragonbone axe", "royal claymore", "obsidian polearm",
    "dungeon-forged greatblade",
];

test("every dungeon weapon recipe requires a dungeon material", () => {
    for (const weapon of DUNGEON_WEAPONS) {
        const expenses = changesFor(weapon).filter(change => change.quantity < 0);
        assert.ok(expenses.length > 0, weapon + " has no crafting recipe");
        assert.ok(
            expenses.some(change => DUNGEON_MATERIALS.has(change.item)),
            weapon + " does not require a dungeon material",
        );
    }
});
