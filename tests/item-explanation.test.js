import assert from "node:assert/strict";
import test from "node:test";

import { ItemExplanation } from "../js/ItemExplanation.js";
import { ItemType } from "../js/ItemType.js";
import { View } from "../js/View.js";

test("item explanations are deterministic from item origin", () => {
    const first = ItemExplanation.for("stick", 1234, -5678, 0);
    assert.equal(
        first,
        ItemExplanation.for("stick", 1234, -5678, 0),
    );
    assert.notEqual(
        first,
        ItemExplanation.for("stick", 1235, -5678, 0),
    );
});

test("item explanations derive useful facts from actual game rules", () => {
    const stick = ItemExplanation.for("stick", 10, 20, 0);
    assert.match(stick, /^Use:/);
    assert.match(stick, /\n\nField note:/);
    assert.match(stick, /club/);
    assert.match(stick, /torch/);
    assert.doesNotMatch(stick, /in fights|in battle|in combat|damage|healing|block/i);

    const rope = ItemExplanation.for("binding rope", 10, 21, 0);
    assert.match(rope, /^Make:/);
    assert.match(rope, /2 hay/);
    assert.match(rope, /captur|subdu/i);
    assert.doesNotMatch(rope, /\bcards?\b/i);

    const yarrow = ItemExplanation.for("yarrow", 11, 21, 0);
    assert.match(yarrow, /Fight:/);
    assert.match(yarrow, /starting fight health by 1/);
    assert.match(yarrow, /yarrow poultice/);

    const poultice = ItemExplanation.for("yarrow poultice", 11, 21, 0);
    assert.match(poultice, /^Make:/);
    assert.match(poultice, /\n\nFight:/);
    assert.match(poultice, /yarrow/);
    assert.match(poultice, /hay/);
    assert.match(poultice, /3 healing/);

    const sword = ItemExplanation.for("sword", 12, 22, 0);
    assert.match(sword, /^Make:/);
    assert.match(sword, /6 damage/);
    assert.match(sword, /a stick/);
    assert.match(sword, /2 roots/);
    assert.match(sword, /5 iron/);

    const dust = ItemExplanation.for("grave dust", 13, 23, 1);
    assert.match(dust, /^Use:/);
    assert.match(dust, /poison potion/);
    assert.doesNotMatch(dust, /fighting|battles|encounters|challenging/i);
});

test("fight descriptions talk about using items, never cards", () => {
    for (const itemName of [
        "stick",
        "root",
        "torch",
        "binding rope",
        "club",
        "wooden shield",
        "yarrow poultice",
        "healing potion",
        "sword",
    ]) {
        for (let index = 0; index < 100; index++) {
            const explanation = ItemExplanation.for(
                itemName,
                index * 43,
                index * -71,
                index % 3,
            );
            assert.doesNotMatch(explanation, /\bcards?\b/i, itemName);
        }
    }
});

test("river fish explain campfire cooking and the feast explains healing", () => {
    const trout = ItemExplanation.for("river trout", 31, 41, 0);
    assert.match(trout, /^Catch:/);
    assert.match(trout, /worm/i);
    assert.match(trout, /campfire/i);
    assert.doesNotMatch(trout, /craft it with a worm|recipe requires a worm/i);
    assert.equal(
        ItemExplanation.categoryFor("river trout"),
        "River fish",
    );

    const worm = ItemExplanation.for("worm", 30, 40, 0);
    assert.match(worm, /^Use:/);
    assert.match(worm, /fish/i);
    assert.equal(
        ItemExplanation.categoryFor("worm"),
        "Fishing bait",
    );

    const campfire = ItemExplanation.for("campfire", 32, 42, 0);
    for (const fish of ItemType.RIVER_FISH_NAMES) {
        assert.match(campfire, new RegExp(fish));
    }
    assert.match(campfire, /hay/);
    assert.match(campfire, /river feast/);
    assert.equal(
        ItemExplanation.categoryFor("campfire"),
        "Cooking fire",
    );

    const feast = ItemExplanation.for("river feast", 33, 43, 0);
    assert.match(feast, /7 healing/);
    assert.equal(
        ItemExplanation.categoryFor("river feast"),
        "Cooked healing item",
    );
});

test("item explanation chapters keep broad deterministic wording variation", () => {
    const explanations = [];
    for (let index = 0; index < 500; index++) {
        const explanation = ItemExplanation.for(
            "iron",
            index * 37,
            index * -59,
            index % 3,
        );
        explanations.push(explanation);
        assert.match(explanation, /^Use:/);
        assert.match(explanation, /\n\nField note:/);
    }

    assert.ok(new Set(explanations).size >= 200);
    assert.equal(
        explanations.some(explanation =>
            explanation.includes("For adventurers who read labels")
        ),
        false,
    );
    assert.equal(
        explanations.some(explanation => explanation.includes("It is used for")),
        false,
    );
});

test("field notes are single comments related to their actual items", () => {
    const cases = [
        ["stick", /stick|club|splinter|handmade|dangerous/i],
        ["yarrow", /yarrow|flower|plant|health|poultice|potion|grimoire|covenant/i],
        ["crucible", /crucible|molten iron|smithing|glow|furnace/i],
        ["worm", /worm|fish|hook|bait/i],
        ["wooden shield", /wooden shield|shield|plank|handle|dent|ribs/i],
        ["grave dust", /grave dust|dust|grave|poison|distill|grimoire|curse/i],
        ["heavy crossbow", /heavy crossbow|string|loaded|distance|damage/i],
        ["river eel", /river eel|eel|fish|campfire|feast/i],
        ["bone rat", /bone rat|rat|food|fingers|binding rope/i],
    ];
    for (const [itemName, relatedWords] of cases) {
        for (let index = 0; index < 50; index++) {
            const note = ItemExplanation.sectionsFor(
                itemName,
                index * 31,
                index * -47,
                index % 3,
            ).find(section => section.heading === "Field note")?.text;
            assert.notEqual(note, undefined);
            assert.match(note, relatedWords, itemName);
            assert.equal(
                note.match(/[.!?](?:\s|$)/g)?.length,
                1,
                itemName + " should have one field-note sentence",
            );
            assert.doesNotMatch(
                note,
                /plan accordingly|backpack has been warned|try to look professional|keep the receipt/i,
            );
        }
    }
});

test("item explanation chapters only appear when applicable", () => {
    const poultice = ItemExplanation.sectionsFor(
        "yarrow poultice",
        11,
        21,
        0,
    );
    assert.deepEqual(
        poultice.map(section => section.heading),
        ["Make", "Use", "Fight", "Field note"],
    );
    const stick = ItemExplanation.sectionsFor("stick", 10, 20, 0);
    assert.deepEqual(
        stick.map(section => section.heading),
        ["Use", "Field note"],
    );
    for (const section of [...poultice, ...stick]) {
        assert.notEqual(section.text, "");
    }
});

test("item card names and categories are compact and useful", () => {
    assert.equal(ItemExplanation.displayName("stone axe"), "Stone axe");
    assert.equal(ItemExplanation.displayName("iron-spiked club"), "Iron-spiked club");
    assert.equal(ItemExplanation.categoryFor("stone axe"), "Crafted weapon");
    assert.equal(ItemExplanation.categoryFor("wooden shield"), "Crafted shield");
    assert.equal(
        ItemExplanation.categoryFor("yarrow poultice"),
        "Crafted healing item",
    );
    assert.equal(ItemExplanation.categoryFor("iron"), "Crafting material");
    assert.equal(ItemExplanation.categoryFor("binding rope"), "Capture tool");
    assert.equal(ItemExplanation.categoryFor("rat"), "Monster");
    assert.equal(ItemExplanation.categoryFor("coin"), "Currency");
});

test("recipe facts vary their wording while preserving the same rules", () => {
    const recipePhrases = [
        "Recipes that use it include",
        "Keep it for recipes such as",
        "Crafting plans that require it include",
        "You will need it when following",
        "It serves as an ingredient for",
        "Among its crafting uses are",
        "Save it for",
        "The recipe book calls for it in",
        "It has a place in the recipes for",
        "Useful destinations for it include",
    ];
    const seenPhrases = new Set();
    for (let index = 0; index < 500; index++) {
        const explanation = ItemExplanation.for(
            "stick",
            index * 41,
            index * -67,
            index % 3,
        );
        assert.match(explanation, /club/);
        assert.match(explanation, /torch/);
        for (const phrase of recipePhrases) {
            if (explanation.includes(phrase)) {
                seenPhrases.add(phrase);
            }
        }
    }

    assert.ok(seenPhrases.size >= 9);
});

test("item quantities use natural articles and plurals", () => {
    assert.equal(View.getQuantityText("hay", 1), "a hay");
    assert.equal(View.getQuantityText("yarrow", 1), "a yarrow");
    assert.equal(View.getQuantityText("yarrow", 2), "2 yarrow");
    assert.equal(View.getQuantityText("grave dust", 3), "3 grave dust");
    assert.equal(View.getQuantityText("torch", 2), "2 torches");
    assert.equal(View.getQuantityText("bone knife", 2), "2 bone knives");
    assert.equal(View.getQuantityText("red poppy", 2), "2 red poppies");
});
