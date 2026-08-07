import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
import { HighlandMap } from "../js/HighlandMap.js";
import { Inventory } from "../js/Inventory.js";
import { ItemType } from "../js/ItemType.js";

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

function withoutWarnings(action) {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        return action();
    } finally {
        console.warn = originalWarn;
    }
}

test("malformed or invalid saves are ignored safely", () => {
    const invalidSaves = [
        "{",
        "null",
        JSON.stringify({ version: 99, quantities: {}, usedCoordinates: {} }),
        JSON.stringify({
            version: 1,
            quantities: { stick: -1 },
            usedCoordinates: {},
        }),
        JSON.stringify({
            version: 1,
            quantities: {},
            usedCoordinates: { "1,2,0": false },
        }),
    ];

    for (const serialized of invalidSaves) {
        localStorage.clear();
        localStorage.setItem("gpsgame.inventory", serialized);
        const inventory = withoutWarnings(() => new Inventory());
        assert.equal(inventory.countItemTypes(), 0);
        assert.deepEqual(inventory.usedCoordinates, {});
        assert.equal(inventory.getAreaId(), 0);
    }
});

test("inventory origins follow coordinate history and consumed items disappear", () => {
    localStorage.clear();
    const root = new Coordinates(1, 38);
    const stick = new Coordinates(1, 111);
    const club = new Coordinates(1, 1021);
    const inventory = new Inventory();

    assert.equal(inventory.takeItem(root)?.itemType.name, "root");
    assert.equal(inventory.takeItem(stick)?.itemType.name, "stick");
    assert.deepEqual(inventory.getItemOrigins("root"), [
        { latitude: 1, longitude: 38, areaId: 0 },
    ]);
    assert.deepEqual(inventory.getItemOrigins("stick"), [
        { latitude: 1, longitude: 111, areaId: 0 },
    ]);

    assert.equal(inventory.takeItem(club)?.itemType.name, "club");
    assert.equal(inventory.countItems(new ItemType("club")), 1);
    assert.equal(inventory.countItems(new ItemType("root")), 0);
    assert.equal(inventory.countItems(new ItemType("stick")), 0);
    assert.deepEqual(inventory.getItemOrigins("root"), []);
    assert.deepEqual(inventory.getItemOrigins("stick"), []);
    assert.deepEqual(inventory.getItemOrigins("club"), [
        { latitude: 1, longitude: 1021, areaId: 0 },
    ]);

    const reloaded = new Inventory();
    assert.deepEqual(reloaded.getItemOrigins("club"), [
        { latitude: 1, longitude: 1021, areaId: 0 },
    ]);
    const saved = JSON.parse(localStorage.getItem("gpsgame.inventory"));
    assert.equal(saved.version, 2);
    assert.equal("quantities" in saved, false);
});

test("permanent spells reconstruct only from purchased coordinates", () => {
    localStorage.clear();
    let magician = null;
    for (let latitude = -400; latitude <= 400 && magician === null; latitude++) {
        for (
            let longitude = -400;
            longitude <= 400 && magician === null;
            longitude++
        ) {
            const coordinates = new Coordinates(latitude, longitude);
            if (HighlandMap.itemAt(coordinates)?.name.startsWith(
                "magician selling ",
            )) {
                magician = coordinates;
            }
        }
    }
    assert.notEqual(magician, null);
    const action = HighlandMap.itemAt(magician);
    const spell = action.prizes().find(
        change => change.itemType.name.startsWith("spell of "),
    )?.itemType.name;
    assert.notEqual(spell, undefined);
    localStorage.setItem("gpsgame.inventory", JSON.stringify({
        version: 2,
        usedCoordinates: {
            [magician.latitude + "," + magician.longitude + ",3"]: true,
        },
    }));

    const inventory = new Inventory();
    assert.equal(inventory.totalQuantities[spell], 1);
    assert.deepEqual(inventory.getItemOrigins(spell), [{
        latitude: magician.latitude,
        longitude: magician.longitude,
        areaId: 3,
    }]);
});

test("storage failures do not interrupt taking an item", () => {
    const workingStorage = globalThis.localStorage;
    globalThis.localStorage = {
        getItem() {
            return null;
        },
        setItem() {
            throw new Error("storage full");
        },
    };

    try {
        const inventory = new Inventory();
        const result = withoutWarnings(() =>
            inventory.takeItem(new Coordinates(1, 111))
        );
        assert.equal(result?.itemType.name, "stick");
        assert.equal(inventory.countItems(new ItemType("stick")), 1);
    } finally {
        globalThis.localStorage = workingStorage;
    }
});

test("progress guidance advances from first materials to dungeon battles", () => {
    localStorage.clear();
    const inventory = new Inventory();
    const setItems = items => {
        inventory.totalQuantities = { ...items };
    };

    setItems({});
    assert.equal(
        inventory.getProgressHint(),
        "Find a stick and a root to craft a club.",
    );
    setItems({ stick: 1, root: 1 });
    assert.equal(
        inventory.getProgressHint(),
        "Craft a club now.",
    );
    setItems({ club: 1 });
    assert.equal(
        inventory.getProgressHint(),
        "Find yarrow to increase your starting health in fights.",
    );
    setItems({
        club: 1,
        yarrow: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find one more yarrow to improve your starting health even further.",
    );
    setItems({
        club: 1,
        yarrow: 2,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Gather one more yarrow and a hay to make a yarrow poultice.",
    );
    setItems({
        club: 1,
        yarrow: 2,
        hay: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and craft a yarrow poultice to heal yourself during fights.",
    );
    setItems({
        club: 1,
        yarrow: 1,
        "yarrow poultice": 1,
        stick: 1,
        hay: 1,
        root: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Get a hay for a binding rope.",
    );
    setItems({
        club: 1,
        yarrow: 1,
        "yarrow poultice": 1,
        "binding rope": 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and capture a rat to gain 10 coins and another attack.",
    );
    setItems({
        club: 1,
        "stone axe": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        "binding rope": 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and capture a rat to gain 10 coins and another attack.",
    );

    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        sword: 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 9,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Get 2 hay for a binding rope.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        sword: 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 9,
        hay: 2,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find 2 binding ropes to capture an orc.",
    );

    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find 5 stones and a hay to craft a crucible for smelting iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        stone: 3,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find 2 stones and a hay to craft a crucible for smelting iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        stone: 5,
        hay: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and craft a crucible to smelt iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        crucible: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find 3 iron ore and 3 hay to smelt iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        crucible: 1,
        "iron ore": 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find 2 more iron ore and 3 hay to smelt iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        crucible: 1,
        "iron ore": 3,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find 3 hay to smelt iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        crucible: 1,
        "iron ore": 3,
        hay: 3,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find a dungeon entrance and descend to find a furnace for smelting iron.",
    );
    inventory.getAreaId = () => 1;
    assert.equal(
        inventory.getProgressHint(),
        "Find a furnace and smelt your iron ore into iron.",
    );
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        crucible: 1,
        furnace: 1,
        iron: 9,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Return to the surface, then find and craft a sword to deal more damage.",
    );
    inventory.getAreaId = () => 0;
    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 5,
        crucible: 1,
        furnace: 1,
        iron: 9,
        stick: 1,
        root: 2,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and craft a sword to deal more damage.",
    );

    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        sword: 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 9,
        "binding rope": 2,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and capture an orc to gain 50 coins and a hide.",
    );
    setItems({
        rat: 1,
        orc: 1,
        club: 1,
        "stone axe": 1,
        sword: 1,
        "wooden shield": 1,
        "yarrow poultice": 1,
        yarrow: 9,
        "binding rope": 1,
    });
    assert.match(inventory.getProgressHint(), /reinforced shield/);

    setItems({
        rat: 1,
        orc: 1,
        "reinforced shield": 1,
        "iron-spiked club": 2,
        "iron hand axe": 2,
        sword: 1,
        "yarrow poultice": 1,
        yarrow: 13,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find a stick, 2 roots and 1 iron for an iron-spiked club. "
            + "Five upgraded weapons will prepare you to capture a troll.",
    );
    setItems({
        rat: 1,
        orc: 1,
        "reinforced shield": 1,
        "iron-spiked club": 2,
        "iron hand axe": 2,
        sword: 1,
        "yarrow poultice": 1,
        yarrow: 13,
        stick: 1,
        root: 2,
        iron: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and craft an iron-spiked club. "
            + "Five upgraded weapons will prepare you to capture a troll.",
    );

    setItems({
        rat: 1,
        orc: 1,
        club: 1,
        sword: 1,
        "reinforced shield": 1,
        "iron-spiked club": 1,
        "iron hand axe": 1,
        "flanged mace": 1,
        "bearded battle axe": 1,
        "arming sword": 1,
        "yarrow poultice": 1,
        yarrow: 13,
        "binding rope": 3,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and capture a troll to gain a club, iron, and hides.",
    );
    setItems({
        rat: 1,
        orc: 1,
        troll: 1,
        "reinforced shield": 1,
        "arming sword": 1,
        "yarrow poultice": 1,
        yarrow: 13,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find a dungeon entrance and descend to hunt dungeon monsters.",
    );

    inventory.getAreaId = () => 1;
    assert.equal(
        inventory.getProgressHint(),
        "Get 2 hay for a binding rope.",
    );
    setItems({
        rat: 1,
        orc: 1,
        troll: 1,
        "reinforced shield": 1,
        "arming sword": 1,
        "yarrow poultice": 1,
        yarrow: 13,
        "grave dust": 1,
        "bone knife": 1,
        "binding rope": 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Find and capture the weakest dungeon monster to gain dungeon materials.",
    );
});

test("inventory status hides item contents while a next objective exists", () => {
    localStorage.clear();
    const inventory = new Inventory();
    inventory.totalQuantities = { stick: 1, root: 1 };
    const message = inventory.getText();
    assert.equal(message, "Craft a club now.");
    assert.doesNotMatch(message, /You have|stick|root/);
});
