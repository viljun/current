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

test("vendor action buttons say only Trade", () => {
    for (const vendor of ["cat buying stick", "cat selling treasure"]) {
        const summary = new ItemTakingSummary(
            new ItemType(vendor),
            [],
            [],
            [],
            [],
        );
        assert.equal(summary.getTakeButtonText().buttonText, "Trade");
    }

    const yarrowTrade = new ItemTakingSummary(
        new ItemType("cat selling yarrow"),
        [new ItemTypeAndQuantity(new ItemType("yarrow"), 1)],
        [new ItemTypeAndQuantity(new ItemType("coin"), -15)],
        [],
        [],
    );
    assert.deepEqual(yarrowTrade.getTakeButtonText(), {
        buttonText: "Trade",
        additionalText: " 15 coins for a yarrow.",
    });
});
