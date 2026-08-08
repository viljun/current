import assert from "node:assert/strict";
import { statSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Image } from "../js/Image.js";
import { BattleSpell } from "../js/BattleSpell.js";

const IMAGES_DIRECTORY = fileURLToPath(new URL("../images/", import.meta.url));
const CRITICAL_IMAGES = [
    "calendula", "chamomile", "lavender", "red poppy", "cornflower",
    "yarrow poultice", "healing potion", "poison potion",
    "river trout", "silver perch", "northern pike", "common carp",
    "river eel", "worm", "campfire", "river feast",
    "poisoned masterwork greatsword",
    "bones", "cracked skull", "rusted chain", "grave dust", "bat wing",
    "spider silk", "black candle", "ancient nail", "broken tile",
    "dungeon moss", "bone knife", "spiked cudgel", "iron dagger", "falchion",
    "morning star", "war pick", "heavy crossbow", "zweihander", "halberd",
    "executioner's axe", "estoc", "bec de corbin", "gothic mace",
    "runed longsword", "blacksteel glaive", "relic warhammer",
    "dragonbone axe", "royal claymore", "obsidian polearm",
    "dungeon-forged greatblade", "bone carving", "skull crushing",
    "chain smelting", "dust distilling", "wing tanning", "silk binding",
    "candle reclaiming", "nail reforging", "tile knapping", "moss brewing",
    "stairs up", "dungeon entrance", "shop entrance", "chest", "cactus",
    "surface road bridge", "surface road milestone",
    "palm", "dungeon floor", "dungeon wall", "shop floor", "shop wall",
    "shop outside grass", "dungeon moonwell water", "dungeon wet floor",
    "dungeon sand floor", "dungeon fungal floor", "dungeon bone floor",
    "dungeon bazaar floor", "dungeon forge floor", "dungeon chapel floor",
    "dungeon web floor", "dungeon moss floor", "dungeon crystal floor",
    "dungeon mushroom cluster", "dungeon boneyard scatter",
    "dungeon mineral cluster", "dungeon candle shrine",
    "dungeon web tangle", "dungeon root tangle", "gloamcap mushroom",
    "mushroom mixing",
    "highland gate", "highland rugged ground", "highland jungle ground",
    "highland mountain ground", "highland castle floor",
    "highland mountain crag", "highland castle wall",
    "highland castle wall horizontal", "highland castle wall vertical",
    "magician selling force spell", "magician selling mending spell",
    "magician selling warding spell", "spell of force",
    "spell of mending", "spell of warding",
    ...BattleSpell.names(),
];
const SURFACE_TERRAIN_IMAGES = [
    "surface-river-water-medieval-photoreal-v1.png",
    "dungeon-deep-water-seamless-medieval-photoreal-v1.png",
    "dungeon-shallow-water-seamless-medieval-photoreal-v1.png",
];

test("critical map and crafting items resolve to nonempty image files", () => {
    for (const name of CRITICAL_IMAGES) {
        const image = Image.getWithItemTypeName(name, 42, 24680);
        assert.notEqual(image.src, "", name + " has no image mapping");
        const file = IMAGES_DIRECTORY + image.src;
        assert.ok(statSync(file).size > 0, name + " image is empty");
    }
});

test("surface terrain images are present and nonempty", () => {
    for (const fileName of SURFACE_TERRAIN_IMAGES) {
        assert.ok(
            statSync(IMAGES_DIRECTORY + fileName).size > 0,
            fileName + " is empty",
        );
    }
});

test("shop walls use the generated seamless oak texture", () => {
    assert.equal(
        Image.getWithItemTypeName("shop wall", 42, 24680).src,
        "shop-wall-aged-oak-seamless-topdown-photoreal-v3.png",
    );
});
