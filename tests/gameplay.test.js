import assert from "node:assert/strict";
import test from "node:test";

import { CardGame } from "../js/CardGame.js";
import { Coordinates } from "../js/Coordinates.js";
import { Inventory } from "../js/Inventory.js";
import { ItemTaking } from "../js/ItemTaking.js";
import { ItemType } from "../js/ItemType.js";
import { MonsterDefinition } from "../js/MonsterDefinition.js";
import { SurfaceMap } from "../js/SurfaceMap.js";

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
    assert.deepEqual(changesFor("binding rope"), [
        { item: "hay", quantity: -2 },
    ]);
    assert.equal(
        ItemType.getWithSeed(937, 0)?.name,
        "yarrow poultice",
    );
    assert.deepEqual(changesFor("yarrow poultice"), [
        { item: "yarrow", quantity: -1 },
        { item: "hay", quantity: -1 },
    ]);
    const missingHay = new ItemTaking(
        new ItemType("yarrow poultice"),
        { totalQuantities: { yarrow: 1 } },
    ).summary();
    assert.deepEqual(
        missingHay.missing.map(change => ({
            item: change.itemType.name,
            quantity: change.quantity,
        })),
        [{ item: "hay", quantity: -1 }],
    );
    const craftablePoultice = new ItemTaking(
        new ItemType("yarrow poultice"),
        { totalQuantities: { yarrow: 1, hay: 1 } },
    ).summary();
    assert.deepEqual(craftablePoultice.missing, []);

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

test("all five river fish and a hay cook into a persistent healing feast", () => {
    assert.deepEqual(changesFor("campfire"), [
        { item: "river trout", quantity: -1 },
        { item: "silver perch", quantity: -1 },
        { item: "northern pike", quantity: -1 },
        { item: "common carp", quantity: -1 },
        { item: "river eel", quantity: -1 },
        { item: "hay", quantity: -1 },
        { item: "river feast", quantity: 1 },
    ]);
    assert.deepEqual(CardGame.itemCardEffects("river feast"), {
        damage: 0,
        block: 0,
        healing: 7,
    });
    for (const fish of ItemType.RIVER_FISH_NAMES) {
        assert.deepEqual(changesFor(fish), [
            { item: "worm", quantity: -1 },
        ]);
        assert.equal(CardGame.itemCardEffects(fish), null);
    }
    assert.equal(CardGame.itemCardEffects("worm"), null);

    const missingBait = new ItemTaking(
        new ItemType("river trout"),
        { totalQuantities: {} },
    ).summary();
    assert.deepEqual(
        missingBait.missing.map(change => ({
            item: change.itemType.name,
            quantity: change.quantity,
        })),
        [{ item: "worm", quantity: -1 }],
    );
    assert.deepEqual(missingBait.getTakeButtonText(), {
        buttonText: "Catch river trout",
        additionalText: " A worm is required as bait.",
    });
    const readyToCatch = new ItemTaking(
        new ItemType("river trout"),
        { totalQuantities: { worm: 1 } },
    ).summary();
    assert.deepEqual(readyToCatch.getTakeButtonText(), {
        buttonText: "Catch river trout",
        additionalText: " with a worm.",
    });

    const found = new Map();
    const wormCoordinates = [];
    for (let latitude = -300; latitude <= 300; latitude++) {
        for (let longitude = -300; longitude <= 300; longitude++) {
            const coordinates = new Coordinates(latitude, longitude);
            const itemName = SurfaceMap.itemAt(coordinates)?.name;
            if (
                itemName === "worm"
                && wormCoordinates.length < ItemType.RIVER_FISH_NAMES.length
            ) {
                wormCoordinates.push(coordinates);
            }
            if (
                itemName !== undefined
                && (
                    ItemType.isRiverFish(itemName)
                    || itemName === "hay"
                    || itemName === "campfire"
                )
                && !found.has(itemName)
            ) {
                found.set(itemName, coordinates);
            }
        }
    }
    for (const itemName of [
        ...ItemType.RIVER_FISH_NAMES,
        "hay",
        "campfire",
    ]) {
        assert.ok(found.has(itemName), "missing " + itemName + " coordinate");
    }
    assert.equal(wormCoordinates.length, ItemType.RIVER_FISH_NAMES.length);

    localStorage.clear();
    const inventory = new Inventory();
    for (const coordinates of wormCoordinates) {
        assert.equal(
            inventory.takeItem(coordinates)?.itemType.name,
            "worm",
        );
    }
    assert.equal(
        inventory.totalQuantities.worm,
        ItemType.RIVER_FISH_NAMES.length,
    );
    for (const itemName of [...ItemType.RIVER_FISH_NAMES, "hay"]) {
        assert.equal(
            inventory.takeItem(found.get(itemName))?.itemType.name,
            itemName,
        );
    }
    const result = inventory.takeItem(found.get("campfire"));
    assert.equal(result?.itemType.name, "campfire");
    assert.deepEqual(
        result?.prizes.map(change => ({
            item: change.itemType.name,
            quantity: change.quantity,
        })),
        [{ item: "river feast", quantity: 1 }],
    );
    assert.equal(inventory.totalQuantities["river feast"], 1);
    assert.equal(inventory.totalQuantities["campfire"] ?? 0, 0);
    assert.equal(inventory.totalQuantities.hay ?? 0, 0);
    assert.equal(inventory.totalQuantities.worm ?? 0, 0);
    assert.ok(ItemType.RIVER_FISH_NAMES.every(
        fish => (inventory.totalQuantities[fish] ?? 0) === 0
    ));

    const reloaded = new Inventory();
    assert.equal(reloaded.totalQuantities["river feast"], 1);
    assert.equal(reloaded.totalQuantities["campfire"] ?? 0, 0);
    assert.equal(reloaded.totalQuantities.worm ?? 0, 0);
});

test("fight status text states its cost and reward", () => {
    const rat = new ItemTaking(
        new ItemType("rat"),
        { totalQuantities: { "binding rope": 1 } },
    ).summary();
    assert.deepEqual(rat.getFightStatusText(), {
        beforeAction: "",
        afterAction:
            "a rat. If you succeed, one binding rope is used. "
                + "You keep the rat and take its 10 coins.",
    });

    const orc = new ItemTaking(
        new ItemType("orc"),
        { totalQuantities: { "binding rope": 2 } },
    ).summary();
    assert.deepEqual(orc.getFightStatusText(), {
        beforeAction: "",
        afterAction:
            "an orc. If you succeed, 2 binding ropes are used. "
                + "You keep the orc and take its 50 coins and a hide.",
    });

    const unpreparedOrc = new ItemTaking(
        new ItemType("orc"),
        { totalQuantities: {} },
    ).summary();
    assert.deepEqual(unpreparedOrc.getFightStatusText(), {
        beforeAction: "You still need 2 binding ropes to",
        afterAction: "an orc.",
    });
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
            { item: "binding rope", quantity: -(1 + Math.floor(index / 10)) },
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
        { item: "binding rope", quantity: -1 },
        { item: "coin", quantity: 10 },
    ]);
    assert.deepEqual(changesFor("orc"), [
        { item: "binding rope", quantity: -2 },
        { item: "coin", quantity: 50 },
        { item: "hide", quantity: 1 },
    ]);
    assert.deepEqual(changesFor("troll"), [
        { item: "binding rope", quantity: -3 },
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

test("gloamcap mixing makes poison and captured skeletons yield bones", () => {
    assert.deepEqual(changesFor("mushroom mixing"), [
        { item: "gloamcap mushroom", quantity: -3 },
        { item: "poison potion", quantity: 1 },
    ]);
    for (const skeleton of ["skeletal guard", "armored skeleton"]) {
        const changes = changesFor(skeleton);
        assert.ok(
            changes.some(change =>
                change.item === "bones" && change.quantity > 0
            ),
            skeleton + " does not yield bones",
        );
    }
});

test("castle magicians sell permanent combat spells for coins", () => {
    const trades = [
        ["magician selling force spell", "spell of force", -250],
        ["magician selling mending spell", "spell of mending", -220],
        ["magician selling warding spell", "spell of warding", -240],
    ];
    for (const [merchant, spell, price] of trades) {
        assert.deepEqual(changesFor(merchant), [
            { item: "coin", quantity: price },
            { item: spell, quantity: 1 },
        ]);
    }
});
