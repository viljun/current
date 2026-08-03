import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
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
        "Next: find a stick and a root for your first club.",
    );
    setItems({ stick: 1, root: 1 });
    assert.equal(
        inventory.getProgressHint(),
        "You have what you need—find a club and craft it now.",
    );
    setItems({ club: 1 });
    assert.equal(
        inventory.getProgressHint(),
        "Next: find a yarrow plant so you have health for your first fight.",
    );
    setItems({
        club: 1,
        yarrow: 1,
        stick: 1,
        hay: 1,
        root: 1,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Materials ready—find a torch and craft it.",
    );
    setItems({ club: 1, yarrow: 1, torch: 1 });
    assert.match(inventory.getProgressHint(), /^Next: try fighting a rat/);
    setItems({
        club: 1,
        "stone axe": 1,
        yarrow: 5,
        torch: 1,
    });
    assert.equal(inventory.getProgressHint(), "Next: find and fight a rat.");

    setItems({
        rat: 1,
        club: 1,
        "stone axe": 1,
        sword: 1,
        "wooden shield": 1,
        yarrow: 9,
        torch: 3,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Ready for the next challenge—find and fight an orc.",
    );
    setItems({
        rat: 1,
        orc: 1,
        club: 1,
        "stone axe": 1,
        sword: 1,
        "wooden shield": 1,
        yarrow: 9,
        torch: 1,
    });
    assert.match(inventory.getProgressHint(), /reinforced shield/);

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
        yarrow: 13,
        torch: 3,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Ready for a hard battle—find and fight a troll.",
    );
    setItems({
        rat: 1,
        orc: 1,
        troll: 1,
        "reinforced shield": 1,
        "arming sword": 1,
        yarrow: 13,
    });
    assert.equal(
        inventory.getProgressHint(),
        "Next: find a dungeon entrance and explore underground.",
    );

    inventory.getAreaId = () => 1;
    assert.equal(
        inventory.getProgressHint(),
        "Next: collect grave dust before fighting a dungeon monster.",
    );
    setItems({
        rat: 1,
        orc: 1,
        troll: 1,
        "reinforced shield": 1,
        "arming sword": 1,
        yarrow: 13,
        "grave dust": 1,
        "bone knife": 1,
    });
    assert.match(inventory.getProgressHint(), /fight dungeon monsters/);
});

test("inventory status puts the next objective before the item list", () => {
    localStorage.clear();
    const inventory = new Inventory();
    inventory.totalQuantities = { stick: 1, root: 1 };
    const originalDocument = globalThis.document;
    globalThis.document = {
        createElement: () => ({ className: "", textContent: "" }),
    };
    try {
        const message = inventory.getText();
        assert.equal(typeof message, "object");
        assert.match(
            message.textContent,
            /^You have what you need—find a club and craft it now\./,
        );
    } finally {
        globalThis.document = originalDocument;
    }
});
