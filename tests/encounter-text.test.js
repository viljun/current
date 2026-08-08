import assert from "node:assert/strict";
import test from "node:test";

import { EncounterText } from "../js/EncounterText.js";
import { ItemTakingSummary } from "../js/ItemTakingSummary.js";
import { ItemType } from "../js/ItemType.js";
import { ItemTypeAndQuantity } from "../js/ItemTypeAndQuantity.js";

test("encounter prose is deterministic from entity type and coordinates", () => {
    const first = EncounterText.for("cat selling sword", 1234, -5678);
    const replay = EncounterText.for("cat selling sword", 1234, -5678);
    assert.deepEqual(first, replay);

    const monster = EncounterText.for("dungeon orc", 1234, -5678);
    assert.deepEqual(
        monster,
        EncounterText.for("dungeon orc", 1234, -5678),
    );
});

test("encounter prose has enormous practical variation", () => {
    const descriptions = new Set();
    const names = new Set();
    for (let index = 0; index < 5000; index++) {
        const itemName = index % 2 === 0 ? "cat buying treasure" : "crypt knight";
        const identity = EncounterText.for(
            itemName,
            index * 37 - 91_003,
            index * -53 + 7001,
        );
        descriptions.add(identity.description);
        names.add(identity.name);
    }

    assert.ok(descriptions.size >= 4990);
    assert.ok(names.size >= 1500);
});

test("cat and creature prose identifies its subject and reads as a sentence", () => {
    const cat = EncounterText.for("cat buying yarrow", 77, 901);
    assert.match(cat.description, /cat/);
    assert.match(cat.description, /yarrow/);
    assert.match(cat.description, /\.$/);

    const creature = EncounterText.for("bone rat", -120, 44);
    assert.match(creature.description, /bone rat/);
    assert.match(creature.description, /\.$/);
    assert.ok(creature.name.length >= 3);
});

test("monster status labels include the generated name and monster type", () => {
    const rat = EncounterText.for("rat", 10, 20);
    assert.equal(
        EncounterText.monsterLabel("rat", rat.name),
        rat.name + ", a rat",
    );
    const orc = EncounterText.for("orc", 30, 40);
    assert.equal(
        EncounterText.monsterLabel("orc", orc.name),
        orc.name + ", an orc",
    );
});

test("vendor actions clearly say Buy or Sell", () => {
    const yarrowPurchase = new ItemTakingSummary(
        new ItemType("cat selling yarrow"),
        [new ItemTypeAndQuantity(new ItemType("yarrow"), 1)],
        [new ItemTypeAndQuantity(new ItemType("coin"), -15)],
        [],
        [],
    );
    assert.deepEqual(yarrowPurchase.getTakeButtonText(), {
        buttonText: "Buy",
        additionalText: " a yarrow with 15 coins.",
    });

    const stickSale = new ItemTakingSummary(
        new ItemType("cat buying stick"),
        [new ItemTypeAndQuantity(new ItemType("coin"), 4)],
        [new ItemTypeAndQuantity(new ItemType("stick"), -3)],
        [],
        [],
    );
    assert.deepEqual(stickSale.getTakeButtonText(), {
        buttonText: "Sell",
        additionalText: " 3 sticks for 4 coins.",
    });

    const missingCruciblePurchase = new ItemTakingSummary(
        new ItemType("cat selling crucible"),
        [new ItemTypeAndQuantity(new ItemType("crucible"), 1)],
        [new ItemTypeAndQuantity(new ItemType("coin"), -21)],
        [],
        [new ItemTypeAndQuantity(new ItemType("coin"), -21)],
    );
    assert.deepEqual(missingCruciblePurchase.getTakeButtonText(), {
        buttonText: "Buy",
        additionalText:
            " a crucible with 21 coins. Find them to buy a crucible.",
    });
});
