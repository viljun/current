import assert from "node:assert/strict";
import { statSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Image } from "../js/Image.js";

const IMAGES_DIRECTORY = fileURLToPath(new URL("../images/", import.meta.url));
const CRITICAL_IMAGES = [
    "calendula", "chamomile", "lavender", "red poppy", "cornflower",
    "healing potion", "poison potion", "poisoned masterwork greatsword",
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
    "palm", "dungeon floor", "dungeon wall", "shop floor", "shop wall",
    "shop outside grass",
];

test("critical map and crafting items resolve to nonempty image files", () => {
    for (const name of CRITICAL_IMAGES) {
        const image = Image.getWithItemTypeName(name, 42, 24680);
        assert.notEqual(image.src, "", name + " has no image mapping");
        const file = IMAGES_DIRECTORY + image.src;
        assert.ok(statSync(file).size > 0, name + " image is empty");
    }
});
