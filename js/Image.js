import { ItemType } from "./ItemType.js";
export class Image {
    constructor(dimension, src, style, isTaken, takeable, rotate, domId, zIndex, tile_size) {
        this.dimension = dimension;
        this.src = src;
        this.style = style;
        this.isTaken = isTaken;
        this.takeable = takeable;
        this.rotate = rotate;
        this.domId = domId;
        this.zIndex = zIndex;
        this.tile_size = tile_size;
    }
    // Returns image for item type.
    static getWithItemTypeName(name, tile_size, seed = 0, isTaken = false, takeable = true) {
        var _a;
        const rotationSeed = Image.visualSeed(seed, name, 1);
        const dimensionSeed = Image.visualSeed(seed, name, 2);
        const opacitySeed = Image.visualSeed(seed, name, 3);
        const sourceSeed = Image.visualSeed(seed, name, 4);
        let srcs = [];
        let rotate = (rotationSeed % 21) - 10;
        let dimension = 0.9 + (dimensionSeed % 21) / 100;
        let domId = null;
        let style = "";
        let zIndex = 20;
        const dungeonMonsterSource = Image.DUNGEON_MONSTER_IMAGES[name];
        const vendorCatSource = Image.VENDOR_CAT_IMAGES[name];
        if (name === "armorer's bench") {
            srcs = [
                "armorers-bench-medieval-photoreal-grounded-v2.png",
            ];
            rotate = 0;
            dimension *= 2.2;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.94).toFixed(2) + ";";
            zIndex = 22;
        }
        else if (name === "cat") {
            dimension *= 2;
            zIndex = 30;
            domId = "cat";
            srcs = [
                "cat-photoreal-grounded-paws-v2.png",
            ];
        }
        else if (name === "cactus") {
            srcs = [
                "cactus-cluster-green-photoreal-grounded-v3.png",
            ];
            rotate = 0;
            dimension = 1.4 * (1 + (dimensionSeed % 101) / 100);
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
            zIndex = 31;
        }
        else if (name === "chest") {
            dimension *= 2;
            srcs = [
                "chest-medieval-grounded-v6.png",
            ];
        }
        else if (name === "cloud") {
            srcs = [
                "cloud-with-ai-generated-free-png.png",
                "realistic-white-cloud-png.png",
                "set-of-realistic-color-shade-cloud-illustration-on-transparency-background-png.png",
                "simple-sunny-day-cloud-image-realistic-cloud-on-a-transparent-background-cloud-on-the-sky-free-png.png",
            ];
            dimension = 0.3 + (dimensionSeed % 700) / 70;
            style = "opacity:" + ((opacitySeed % 13) / 50 + 0.05).toFixed(2) + ";";
            zIndex = 40;
        }
        else if (name === "club") {
            srcs = [
                "club-medieval-photoreal-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 2;
        }
        else if (name === "iron-spiked club") {
            srcs = ["iron-spiked-club-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2;
        }
        else if (name === "iron hand axe") {
            srcs = ["iron-hand-axe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.1;
        }
        else if (name === "flanged mace") {
            srcs = ["flanged-mace-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.1;
        }
        else if (name === "bearded battle axe") {
            srcs = ["bearded-battle-axe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.2;
        }
        else if (name === "arming sword") {
            srcs = ["arming-sword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.3;
        }
        else if (name === "war hammer") {
            srcs = ["war-hammer-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.2;
        }
        else if (name === "longsword") {
            srcs = ["longsword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (name === "two-handed battle axe") {
            srcs = ["two-handed-battle-axe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (name === "poleaxe") {
            srcs = ["poleaxe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (name === "masterwork greatsword") {
            srcs = ["masterwork-greatsword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.7;
        }
        else if (name === "poisoned masterwork greatsword") {
            srcs = [
                "poisoned-masterwork-greatsword-medieval-photoreal-transparent-v2.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 2.7;
        }
        else if (name === "calendula") {
            srcs = ["flower-calendula-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.2;
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
        }
        else if (name === "chamomile") {
            srcs = ["flower-chamomile-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.2;
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
        }
        else if (name === "lavender") {
            srcs = ["flower-lavender-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.2;
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
        }
        else if (name === "red poppy") {
            srcs = ["flower-red-poppy-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.2;
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
        }
        else if (name === "cornflower") {
            srcs = ["flower-cornflower-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.2;
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
        }
        else if (name === "healing potion") {
            srcs = ["healing-potion-medieval-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.35;
        }
        else if (name === "yarrow poultice") {
            srcs = ["yarrow-poultice-medieval-photoreal-transparent-v2.png"];
            rotate = 0;
            dimension *= 1.35;
        }
        else if (name === "river trout") {
            srcs = ["river-trout-medieval-photoreal-transparent-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.25;
            zIndex = 24;
        }
        else if (name === "silver perch") {
            srcs = ["silver-perch-medieval-photoreal-transparent-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.25;
            zIndex = 24;
        }
        else if (name === "northern pike") {
            srcs = ["northern-pike-medieval-photoreal-transparent-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.3;
            zIndex = 24;
        }
        else if (name === "common carp") {
            srcs = ["common-carp-medieval-photoreal-transparent-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.3;
            zIndex = 24;
        }
        else if (name === "river eel") {
            srcs = ["river-eel-medieval-photoreal-transparent-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.3;
            zIndex = 24;
        }
        else if (name === "campfire") {
            srcs = [
                "campfire-riverside-cooking-medieval-photoreal-transparent-v2.png",
            ];
            rotate = 0;
            dimension *= 1.75;
            zIndex = 30;
        }
        else if (name === "river feast") {
            srcs = ["river-feast-medieval-photoreal-transparent-v2.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.45;
        }
        else if (name === "poison potion") {
            srcs = ["poison-potion-medieval-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.35;
        }
        else if (["bone knife", "iron dagger"].includes(name)) {
            srcs = ["arming-sword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.8;
        }
        else if (["spiked cudgel", "morning star"].includes(name)) {
            srcs = ["flanged-mace-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.1;
        }
        else if (["falchion", "estoc"].includes(name)) {
            srcs = ["sword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.2;
        }
        else if (["war pick", "relic warhammer"].includes(name)) {
            srcs = ["war-hammer-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.2;
        }
        else if (["heavy crossbow", "bec de corbin"].includes(name)) {
            srcs = ["poleaxe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.4;
        }
        else if (["zweihander", "royal claymore"].includes(name)) {
            srcs = ["longsword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (["halberd", "blacksteel glaive"].includes(name)) {
            srcs = ["poleaxe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (["executioner's axe", "dragonbone axe"].includes(name)) {
            srcs = ["two-handed-battle-axe-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (["gothic mace", "runed longsword"].includes(name)) {
            srcs = [name === "gothic mace"
                    ? "flanged-mace-medieval-photoreal-v1.png"
                    : "longsword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.5;
        }
        else if (["obsidian polearm", "dungeon-forged greatblade"].includes(name)) {
            srcs = [name === "obsidian polearm"
                    ? "poleaxe-medieval-photoreal-v1.png"
                    : "masterwork-greatsword-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 2.7;
        }
        else if (name === "coin") {
            srcs = [
                "f9da09a345b352d9f6cd4e59f66197c4.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 0.1;
        }
        else if (name === "crucible") {
            srcs = [
                "crucible-medieval-photoreal-v1.png",
            ];
            dimension *= 1.8;
        }
        else if (name === "dungeon entrance") {
            srcs = [
                "dungeon-entrance-medieval-photoreal-grounded-v2.png",
            ];
            dimension *= 2.9;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.9).toFixed(2) + ";";
        }
        else if (name === "shop entrance") {
            srcs = [
                "shop-entrance-medieval-photoreal-v1.png",
            ];
            dimension *= 2.9;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.9).toFixed(2) + ";";
        }
        else if (name === "highland gate") {
            srcs = [
                "dungeon-entrance-medieval-photoreal-grounded-v2.png",
            ];
            dimension *= 3;
            style = "filter:brightness(.82) saturate(.72) hue-rotate(18deg);"
                + "opacity:.97;";
        }
        else if ([
            "highland rugged ground",
            "highland jungle ground",
            "highland mountain ground",
            "highland castle floor",
        ].includes(name)) {
            srcs = name === "highland jungle ground"
                ? ["highland-jungle-floor-medieval-photoreal-v1.png"]
                : name === "highland castle floor"
                    ? ["floor1.png", "floor2.png", "floor3.png", "floor4.png"]
                    : ["dirt2.png"];
            rotate = rotationSeed % 4 * 90;
            dimension *= 1.42;
            const highlandFilters = {
                "highland rugged ground": "brightness(.72) saturate(.7) sepia(.18)",
                "highland jungle ground": "brightness(.7) saturate(.72)",
                "highland mountain ground": "brightness(.38) saturate(.35) contrast(1.16)",
                "highland castle floor": "brightness(.6) saturate(.4) sepia(.12)",
            };
            style = "filter:" + highlandFilters[name] + ";opacity:.98;";
            zIndex = 1;
        }
        else if (name === "highland mountain crag") {
            srcs = [
                "highland-mountain-crag-medieval-photoreal-transparent-v1.png",
            ];
            rotate = 0;
            dimension = 2.05 + (dimensionSeed % 36) / 100;
            style = "filter:brightness(.72) saturate(.7);opacity:.98;";
            zIndex = 28;
        }
        else if ([
            "highland castle wall",
            "highland castle wall horizontal",
            "highland castle wall vertical",
        ].includes(name)) {
            srcs = [
                "highland-castle-wall-overhead-medieval-photoreal-transparent-v2.png",
            ];
            rotate = name === "highland castle wall vertical" ? 90 : 0;
            dimension = 1.62;
            style = "filter:brightness(.68) saturate(.5);opacity:.99;";
            zIndex = 27;
        }
        else if (name.startsWith("magician selling ")) {
            srcs = [
                "highland-magician-merchant-medieval-photoreal-transparent-v1.png",
            ];
            rotate = 0;
            dimension = 2.15;
            const magicianHue = name.includes("mending")
                ? 38
                : name.includes("warding")
                    ? 190
                    : 0;
            style = "filter:brightness(.84) saturate(.76) hue-rotate("
                + magicianHue + "deg);opacity:.99;";
            zIndex = 31;
        }
        else if ([
            "spell of force",
            "spell of mending",
            "spell of warding",
        ].includes(name)) {
            srcs = [
                "highland-permanent-spellbook-medieval-photoreal-transparent-v1.png",
            ];
            rotate = 0;
            dimension = 1.45;
            const spellHue = name === "spell of mending"
                ? 35
                : name === "spell of warding"
                    ? 190
                    : 0;
            style = "filter:brightness(.9) saturate(.72) hue-rotate("
                + spellHue + "deg);opacity:.98;";
            zIndex = 24;
        }
        else if (name === "dungeon floor") {
            srcs = [
                // "dungeon_floor.webp",
                // "dungeon_floor2.png",
                "floor1.png",
                "floor2.png",
                "floor3.png",
                "floor4.png",
                "floor1",
                "floor2",
                "floor3",
                "floor4",
            ];
            const baseOpacity = (opacitySeed % 90) / 90 + 0.3;
            const opacityBoost = 1.2
                + (Image.visualSeed(seed, name, 7) % 31) / 100;
            style = "opacity:"
                + Math.min(1, baseOpacity * opacityBoost).toFixed(2)
                + ";";
            dimension = 1.15 + (dimensionSeed % 186) / 100;
            rotate = (Image.visualSeed(seed, name, 8) % 33) - 16;
            zIndex = 1;
        }
        else if (name === "dungeon moonwell water") {
            srcs = [
                "dungeon-deep-water-round-medieval-photoreal-transparent-v3.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 2 + (dimensionSeed % 21) / 100;
            style = "background:#123e62;border-radius:50%;"
                + "filter:brightness(.78) saturate(.88);opacity:.98;"
                + "mask-image:radial-gradient(circle,#000 0 68%,"
                + "transparent 75%);"
                + "-webkit-mask-image:radial-gradient(circle,#000 0 68%,"
                + "transparent 75%);";
            zIndex = 1;
        }
        else if (name === "dungeon wet floor") {
            srcs = [
                "dungeon-shallow-water-round-medieval-photoreal-transparent-v2.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 2 + (dimensionSeed % 21) / 100;
            style = "background:#397b88;border-radius:50%;"
                + "filter:brightness(.82) saturate(.8);opacity:.98;"
                + "mask-image:radial-gradient(circle,#000 0 68%,"
                + "transparent 75%);"
                + "-webkit-mask-image:radial-gradient(circle,#000 0 68%,"
                + "transparent 75%);";
            zIndex = 1;
        }
        else if (name === "dungeon sand floor") {
            srcs = [
                "dungeon-sand-vault-floor-medieval-photoreal-v1.png",
            ];
            rotate = rotationSeed % 4 * 90
                + (Image.visualSeed(seed, name, 7) % 25) - 12;
            dimension = 1.25 + (dimensionSeed % 156) / 100;
            style = "filter:brightness(.72) saturate(.68);opacity:.98;";
            zIndex = 1;
        }
        else if ([
            "dungeon fungal floor",
            "dungeon bone floor",
            "dungeon bazaar floor",
            "dungeon forge floor",
            "dungeon chapel floor",
            "dungeon web floor",
            "dungeon moss floor",
            "dungeon crystal floor",
        ].includes(name)) {
            srcs = [
                "floor1.png",
                "floor2.png",
                "floor3.png",
                "floor4.png",
            ];
            rotate = rotationSeed % 4 * 90
                + (Image.visualSeed(seed, name, 7) % 25) - 12;
            dimension = 1.25 + (dimensionSeed % 156) / 100;
            const terrainFilters = {
                "dungeon fungal floor": "brightness(.42) sepia(.45) hue-rotate(230deg) saturate(.7)",
                "dungeon bone floor": "grayscale(.7) sepia(.25) brightness(.58)",
                "dungeon bazaar floor": "sepia(.5) brightness(.58) saturate(.65)",
                "dungeon forge floor": "sepia(.75) hue-rotate(330deg) brightness(.34) saturate(.75)",
                "dungeon chapel floor": "grayscale(.75) sepia(.2) brightness(.32)",
                "dungeon web floor": "grayscale(.9) brightness(.54) contrast(1.15)",
                "dungeon moss floor": "sepia(.65) hue-rotate(55deg) brightness(.45) saturate(.8)",
                "dungeon crystal floor": "grayscale(.55) hue-rotate(150deg) brightness(.52) saturate(.5)",
            };
            style = "filter:" + terrainFilters[name] + ";opacity:.96;";
            zIndex = 1;
        }
        else if (name === "dungeon wall") {
            srcs = [
                // "dungeon_wall.webp",
                // "dungeon_wall2.webp",
                // "dungeon_wall3",
                // "dungeon_wall4.png",
                "wall1",
                "wall2",
                "wall3",
                "wall4",
                "wall5",
            ];
            rotate = rotationSeed % 77 / 30;
            style = "opacity:" + ((opacitySeed % 100) / 500 + 0.9).toFixed(2) + ";";
            dimension *= 1.41;
            zIndex = 2;
        }
        else if ([
            "dungeon mushroom cluster",
            "gloamcap mushroom",
            "mushroom mixing",
        ].includes(name)) {
            srcs = [
                "dungeon-gloamcap-cluster-medieval-photoreal-transparent-v1.png",
            ];
            rotate = 0;
            dimension = name === "gloamcap mushroom"
                ? 1.02
                : name === "mushroom mixing"
                    ? 1.35
                    : .92 + (dimensionSeed % 19) / 100;
            style = "filter:brightness(.78) saturate(.72);opacity:.96;";
            zIndex = name === "dungeon mushroom cluster" ? 14 : 20;
        }
        else if (name === "dungeon boneyard scatter") {
            srcs = [
                "dungeon-boneyard-scatter-medieval-photoreal-transparent-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = .5 + (dimensionSeed % 251) / 100;
            style = "filter:brightness(.72) sepia(.18);opacity:"
                + (.5 + (opacitySeed % 31) / 100).toFixed(2) + ";";
            zIndex = 13;
        }
        else if (name === "dungeon mineral cluster") {
            srcs = [
                "dungeon-mineral-cluster-medieval-photoreal-transparent-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = .5 + (dimensionSeed % 251) / 100;
            style = "filter:brightness(.68) saturate(.55);opacity:"
                + (.5 + (opacitySeed % 31) / 100).toFixed(2) + ";";
            zIndex = 18;
        }
        else if (name === "dungeon candle shrine") {
            srcs = [
                "dungeon-black-candle-shrine-medieval-photoreal-transparent-v1.png",
            ];
            rotate = 0;
            dimension = 1.05 + (dimensionSeed % 16) / 100;
            style = "filter:brightness(.78) saturate(.7);opacity:.96;";
            zIndex = 19;
        }
        else if (name === "dungeon web tangle") {
            srcs = ["hay-medieval-photoreal-soft-edge-v2.png"];
            rotate = rotationSeed % 360;
            dimension = 1.15 + (dimensionSeed % 26) / 100;
            style = "filter:grayscale(1) brightness(1.22);opacity:.34;";
            zIndex = 12;
        }
        else if (name === "dungeon root tangle") {
            srcs = ["root-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension = .5 + (dimensionSeed % 251) / 100;
            style = "filter:brightness(.55) sepia(.45) saturate(.7);opacity:"
                + (.5 + (opacitySeed % 31) / 100).toFixed(2) + ";";
            zIndex = 13;
        }
        else if (name === "forest") { // quite similar to "tree"
            srcs = [
                "tree-grounded-olive-v1.png",
                "tree-grounded-dark-v1.png",
                "tree-grounded-broadleaf-v1.png",
                "tree-grounded-tall-v1.png",
                "tree-grounded-weathered-v1.png",
            ];
            dimension = 0.3 + (dimensionSeed % 500) / 170;
            style = "opacity:" + ((opacitySeed % 100) / 10).toFixed(2) + ";";
            zIndex = 16;
        }
        else if (name === "furnace") {
            srcs = [
                "furnace-medieval-photoreal-grounded-v2.png",
            ];
            rotate = 0;
            dimension *= 2.2;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.94).toFixed(2) + ";";
            zIndex = 22;
        }
        else if (name === "grass") {
            srcs = [
                "grass1.png",
                "grass2.png",
                "grass3.png",
                "grass4.png",
                "grass5.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.3 + (dimensionSeed % 300) / 70;
            style = "opacity:" + ((opacitySeed % 13) / 50 + 0.25).toFixed(2) + ";";
            zIndex = 13;
        }
        else if (name === "hay") {
            srcs = [
                "hay-medieval-photoreal-soft-edge-v2.png",
            ];
            const sizeMultiplier = 1.5
                + (Image.visualSeed(seed, name, 5) % 26) / 100;
            rotate = rotationSeed % 360;
            dimension = (0.75 + (dimensionSeed % 25) / 100) * sizeMultiplier;
            style = "filter:brightness(1.12) contrast(1.08) saturate(0.95);"
                + "opacity:" + ((opacitySeed % 6) / 100 + 0.94).toFixed(2) + ";";
            zIndex = 15;
        }
        else if (name === "hide") {
            srcs = [
                "hide-medieval-photoreal-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 1.35;
        }
        else if (name === "binding rope") {
            srcs = [
                "binding-rope-medieval-photoreal-transparent-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.95 + (dimensionSeed % 11) / 100;
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2)
                + ";";
        }
        else if (["bones", "bone carving"].includes(name)) {
            srcs = ["root-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.15;
            style = "filter:grayscale(.82) sepia(.18) brightness(1.18);";
        }
        else if (["cracked skull", "skull crushing"].includes(name)) {
            srcs = [
                "cracked-skull-dark-medieval-photoreal-transparent-v1.png",
            ];
            rotate = (rotationSeed % 17) - 8;
            dimension = 1.05 + (dimensionSeed % 22) / 100;
            style = "filter:brightness(.82) saturate(.72);opacity:.98;";
        }
        else if (["rusted chain", "chain smelting"].includes(name)) {
            srcs = ["iron_ore.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.1;
            style = "filter:sepia(.7) saturate(.75);";
        }
        else if (["grave dust", "dust distilling"].includes(name)) {
            srcs = ["hay-medieval-photoreal-soft-edge-v2.png"];
            rotate = rotationSeed % 360;
            dimension *= 0.85;
            style = "filter:grayscale(.75) brightness(.7);";
        }
        else if (["bat wing", "wing tanning"].includes(name)) {
            srcs = ["hide-medieval-photoreal-v1.png"];
            rotate = rotationSeed % 360;
            dimension *= 1.05;
            style = "filter:brightness(.55) saturate(.55);";
        }
        else if (["spider silk", "silk binding"].includes(name)) {
            srcs = ["hay-medieval-photoreal-soft-edge-v2.png"];
            rotate = rotationSeed % 360;
            dimension *= 0.9;
            style = "filter:grayscale(1) brightness(1.35);";
        }
        else if (["black candle", "candle reclaiming"].includes(name)) {
            srcs = ["torch.png"];
            rotate = 0;
            dimension *= 1.15;
            style = "filter:grayscale(.8) brightness(.55);";
        }
        else if (["ancient nail", "nail reforging"].includes(name)) {
            srcs = [
                "ancient-hand-forged-nail-medieval-photoreal-transparent-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = .98 + (dimensionSeed % 21) / 100;
            style = "filter:brightness(.82) saturate(.72);opacity:.98;";
        }
        else if (["broken tile", "tile knapping"].includes(name)) {
            srcs = ["stone-item-photoreal-blended-v2.png"];
            rotate = rotationSeed % 360;
            dimension *= 0.9;
            style = "filter:sepia(.45);";
        }
        else if (["dungeon moss", "moss brewing"].includes(name)) {
            srcs = ["yarrow-photoreal-v3.png"];
            rotate = 0;
            dimension *= 0.95;
            style = "filter:hue-rotate(45deg) saturate(.7) brightness(.7);";
        }
        else if (name === "padded hide") {
            srcs = [
                "padded-hide-medieval-photoreal-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 1.45;
        }
        else if (name === "wooden shield") {
            srcs = [
                "wooden-shield-medieval-photoreal-v1.png",
            ];
            dimension *= 1.55;
        }
        else if (name === "reinforced shield") {
            srcs = [
                "reinforced-shield-medieval-photoreal-v1.png",
            ];
            dimension *= 1.65;
        }
        else if (name === "yarrow") {
            srcs = [
                "yarrow-photoreal-v3.png",
            ];
            dimension *= 1.05;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.9).toFixed(2) + ";";
        }
        else if (name === "iron") {
            srcs = [
                "20211223230236",
            ];
            rotate = 360;
        }
        else if (name === "iron ore") {
            srcs = [
                "20200602231757",
                "20220109170708",
                "iron_ore.png",
                "iron_ore2.png",
                "iron_ore3.png",
            ];
            style = "opacity:" + ((opacitySeed % 31) / 100 + 0.5).toFixed(2) + ";";
            rotate = 360;
            dimension = 0.5 + (dimensionSeed % 49) / 200;
        }
        else if ([
            "bone rat", "cave bat", "giant spider", "plague beetle",
            "crypt hound", "dungeon scavenger", "tomb robber",
            "cave crawler", "brood spider", "banshee",
        ].includes(name)) {
            srcs = [dungeonMonsterSource !== null && dungeonMonsterSource !== void 0 ? dungeonMonsterSource : ""];
            rotate = 0;
            dimension *= 1.2 + (dimensionSeed % 31) / 100;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if ([
            "skeletal guard", "goblin cutthroat", "ghoul", "wight",
            "cultist", "armored skeleton", "dungeon orc",
            "plague bearer", "crypt knight", "necromancer",
        ].includes(name)) {
            srcs = [dungeonMonsterSource !== null && dungeonMonsterSource !== void 0 ? dungeonMonsterSource : ""];
            rotate = 0;
            dimension *= 1.75 + (dimensionSeed % 31) / 100;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if ([
            "cave troll", "stone sentinel", "ogre jailer", "basilisk",
            "minotaur", "vampire", "lich", "bone colossus",
            "abyssal knight", "dungeon dragon",
        ].includes(name)) {
            srcs = [dungeonMonsterSource !== null && dungeonMonsterSource !== void 0 ? dungeonMonsterSource : ""];
            rotate = 0;
            dimension *= 2.15 + (dimensionSeed % 41) / 100;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if (name === "orc") {
            srcs = [
                "monster-orc-photoreal-grounded-v2.png",
            ];
            dimension *= 1.82;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if (name === "palm") {
            srcs = [
                "date-palm-green-brown-photoreal-grounded-v2.png",
            ];
            rotate = 0;
            dimension = 2.2 * (1 + (dimensionSeed % 101) / 100);
            style = "opacity:" + ((opacitySeed % 5) / 100 + 0.95).toFixed(2) + ";";
            zIndex = 32;
        }
        else if (name === "rat") {
            srcs = [
                "monster-rat-photoreal-grounded-v2.png",
            ];
            dimension *= 1.17;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if (name === "restaurant") {
            srcs = [
                "restaurant1.png",
                "restaurant2.png",
                "restaurant3.webp",
            ];
            dimension = 1.0 + ((dimensionSeed % 100) / 100);
        }
        else if (name === "road") {
            srcs = [
                "road1.png",
                "road2.png",
                "road3.png",
            ];
            rotate = (rotationSeed % 30) - 15;
            dimension = 0.5 + (dimensionSeed % 123) / 20;
            style = "opacity:" + ((opacitySeed % 105) / 400 + 0.05).toFixed(2) + ";";
            zIndex = 10;
        }
        else if (name === "surface road bridge") {
            srcs = [
                "surface-road-timber-bridge-medieval-photoreal-transparent-v1.png",
            ];
            rotate = 0;
            dimension = 4.15;
            style = "filter:brightness(.86) saturate(.72);opacity:.98;";
            zIndex = 8;
        }
        else if (name === "surface road milestone") {
            srcs = [
                "surface-road-milestone-medieval-photoreal-grounded-v2.png",
            ];
            rotate = 0;
            dimension = 1.05 + (dimensionSeed % 18) / 100;
            style = "filter:brightness(.78) saturate(.55);opacity:.96;";
            zIndex = 19;
        }
        else if (name === "surface road grass") {
            srcs = [
                "grass1.png",
                "grass2.png",
                "grass3.png",
                "grass4.png",
                "grass5.png",
            ];
            rotate = rotationSeed % 360;
            dimension = .38 + (dimensionSeed % 43) / 100;
            style = "opacity:"
                + (.12 + (opacitySeed % 15) / 100).toFixed(2) + ";";
            zIndex = 5;
        }
        else if (name === "rock formation") {
            srcs = [
                "rock_formation_faded1.png",
                "rock_formation_faded2.png",
                "rock_formation_faded3.png",
                "rock_formation_faded4.png",
            ];
            rotate = rotationSeed % 359;
            dimension = 0.5 + (dimensionSeed % 207) / 20;
            style = "opacity:" + ((opacitySeed % 109) / 200).toFixed(2) + ";";
            zIndex = 14;
        }
        else if (name === "big rock") {
            srcs = [
                "weeping-stone-bedrock-terrain-blended-v7.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 2 + (dimensionSeed % 90) / 10;
            style = "opacity:" + ((opacitySeed % 19) / 100 + 0.62).toFixed(2) + ";";
            zIndex = 14;
        }
        else if (name === "root") {
            srcs = [
                "root-photoreal-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.65 + (dimensionSeed % 35) / 100;
            style = "opacity:" + ((opacitySeed % 12) / 100 + 0.82).toFixed(2) + ";";
        }
        else if (name === "sand") {
            srcs = [
                "sand_PNG40.png",
                "png_sand_7125.png",
                "sand_PNG44.png",
                "Sharp-Sand.png",
                "soil_PNG84.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.3 + (dimensionSeed % 270) / 30;
            style = "opacity:" + ((opacitySeed % 100) / 400).toFixed(2) + ";";
            zIndex = 10;
        }
        else if (vendorCatSource !== undefined) {
            const playerDimension = (0.9 + (Image.visualSeed(seed, "cat", 2) % 21) / 100) * 2;
            srcs = [vendorCatSource];
            rotate = 0;
            dimension = playerDimension
                * ItemType.vendorCatPlayerScale(name);
            zIndex = 30;
        }
        else if (name === "shop floor") {
            srcs = ["floor1.png", "floor2.png", "floor3.png", "floor4.png"];
            rotate = rotationSeed % 4 * 90;
            dimension *= 1.35;
            style = "filter:sepia(.25) brightness(.82);";
            zIndex = 1;
        }
        else if (name === "shop outside grass") {
            srcs = [
                "grass1.png",
                "grass2.png",
                "grass3.png",
                "grass4.png",
                "grass5.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.3 + (dimensionSeed % 300) / 70;
            style = "opacity:" + ((opacitySeed % 13) / 50 + 0.25).toFixed(2) + ";";
            zIndex = 1;
        }
        else if (name === "shop wall") {
            srcs = ["wall1", "wall2", "wall3", "wall4", "wall5"];
            rotate = 0;
            dimension *= 1.41;
            style = "filter:sepia(.3) brightness(.9);";
            zIndex = 2;
        }
        else if (name === "shop table") {
            srcs = ["shop-table-medieval-photoreal-v1.png"];
            rotate = 0;
            dimension *= 1.8;
            zIndex = 21;
        }
        else if (name === "shop shelf") {
            srcs = ["shop-shelf-medieval-photoreal-v1.png"];
            rotate = 0;
            dimension *= 2;
            zIndex = 22;
        }
        else if (name === "stairs up") {
            dimension *= 1.11;
            zIndex = 25;
            srcs = [
                "stairs_up.png",
            ];
        }
        else if (name === "stick") {
            srcs = [
                "Stick2D-Isometric.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.3 + (dimensionSeed % 130) / 100;
            style = "opacity:" + ((opacitySeed % 41) / 50 + 0.3).toFixed(2) + ";";
        }
        else if (name === "stone") {
            srcs = [
                "stone-item-photoreal-blended-v2.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.45 + (dimensionSeed % 35) / 100;
            style = "opacity:" + ((opacitySeed % 12) / 100 + 0.78).toFixed(2) + ";";
        }
        else if (name === "stone axe") {
            srcs = [
                "stone-axe-medieval-photoreal-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 2;
        }
        else if (name === "sword") {
            srcs = [
                "sword-medieval-photoreal-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension *= 2;
        }
        else if (name === "treasure") {
            srcs = [
                "treasure-medieval-pouch-photoreal-grounded-v2.png",
            ];
            dimension *= 1.17;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.9).toFixed(2) + ";";
        }
        else if (name === "worm") {
            srcs = [
                "worm-earthworm-medieval-photoreal-transparent-v1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 1.2 + (dimensionSeed % 16) / 100;
            style = "filter:brightness(.8) saturate(.72) contrast(1.08);"
                + "opacity:.97;";
        }
        else if (name === "torch") {
            srcs = [
                "torch.png",
            ];
            dimension *= 1.6;
        }
        else if (name === "tree") {
            srcs = [
                "tree-grounded-olive-v1.png",
                "tree-grounded-dark-v1.png",
                "tree-grounded-broadleaf-v1.png",
                "tree-grounded-tall-v1.png",
                "tree-grounded-weathered-v1.png",
            ];
            dimension = 0.3 + (dimensionSeed % 500) / 120;
            zIndex = 30;
        }
        else if (name === "troll") {
            srcs = [
                "monster-troll-photoreal-grounded-v2.png",
            ];
            dimension *= 2.35;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if (name === "water") {
            srcs = [
                "water1.png",
                "water2.png",
            ];
            rotate = (rotationSeed % 30) - 15;
            dimension = 2.0 + (dimensionSeed % 123) / 30;
            style = "opacity:" + ((opacitySeed % 105) / 10).toFixed(2) + ";";
            zIndex = 120;
        }
        else {
            console.log("getWithItemTypeName: faulty name " + name);
        }
        style += "--item-mirror:"
            + (name !== "cat" && Image.visualSeed(seed, name, 6) % 2 ? -1 : 1)
            + ";";
        return new Image(dimension, (_a = srcs[sourceSeed % srcs.length]) !== null && _a !== void 0 ? _a : "", style, isTaken, takeable, rotate, domId, zIndex, tile_size);
    }
    // Creates independent, repeatable random-looking streams for each visual
    // property. Item placement continues to use the original coordinate seed.
    static visualSeed(seed, name, channel) {
        let hash = (seed >>> 0) ^ 0x9e3779b9;
        for (let index = 0; index < name.length; index++) {
            hash = Math.imul(hash ^ name.charCodeAt(index), 0x01000193) >>> 0;
        }
        hash ^= Math.imul(channel, 0x85ebca6b);
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b) >>> 0;
        hash ^= hash >>> 16;
        return hash >>> 0;
    }
    // Returns image as html element.
    element() {
        let margin = (this.dimension - 1) / 2;
        margin *= this.tile_size;
        margin = -Math.round(margin);
        let dimension = this.dimension * this.tile_size;
        dimension = Math.round(dimension);
        // Style.
        let style = this.style;
        style += "width:" + dimension + "px;";
        style += "height:" + dimension + "px;";
        style += "margin-top:" + margin + "px;";
        style += "margin-left:" + margin + "px;";
        style += "z-index:" + this.zIndex + ";";
        if (this.isTaken) {
            style += "filter:grayscale(1);opacity:0.2;";
        }
        if (this.takeable === false) {
            style += "filter:grayscale(55%) sepia(35%) saturate(55%) "
                + "brightness(72%) contrast(85%) blur(0.6px);opacity:0.55;";
        }
        style += "transform:rotate(" + this.rotate
            + "deg) scaleX(var(--item-mirror));";
        // Create image element.
        let img = document.createElement("img");
        img.setAttribute("class", "item");
        img.setAttribute("src", 'images/' + this.src);
        if (style !== null) {
            img.setAttribute("style", style);
        }
        if (this.domId !== null) {
            img.setAttribute("id", this.domId);
        }
        return img;
    }
}
Image.DUNGEON_MONSTER_IMAGES = {
    "bone rat": "monster-bone-rat-medieval-photoreal-v1.png",
    "cave bat": "monster-cave-bat-medieval-photoreal-v1.png",
    "giant spider": "monster-giant-spider-medieval-photoreal-v1.png",
    "plague beetle": "monster-plague-beetle-medieval-photoreal-v1.png",
    "crypt hound": "monster-crypt-hound-medieval-photoreal-v1.png",
    "skeletal guard": "monster-skeletal-guard-medieval-photoreal-v1.png",
    "dungeon scavenger": "monster-dungeon-scavenger-medieval-photoreal-v1.png",
    "goblin cutthroat": "monster-goblin-cutthroat-medieval-photoreal-v1.png",
    "tomb robber": "monster-tomb-robber-medieval-photoreal-v1.png",
    "cave crawler": "monster-cave-crawler-medieval-photoreal-v1.png",
    "ghoul": "monster-ghoul-medieval-photoreal-v1.png",
    "wight": "monster-wight-medieval-photoreal-v1.png",
    "cultist": "monster-cultist-medieval-photoreal-v1.png",
    "armored skeleton": "monster-armored-skeleton-medieval-photoreal-v1.png",
    "brood spider": "monster-brood-spider-medieval-photoreal-v1.png",
    "cave troll": "monster-cave-troll-medieval-photoreal-v1.png",
    "dungeon orc": "monster-dungeon-orc-medieval-photoreal-v1.png",
    "plague bearer": "monster-plague-bearer-medieval-photoreal-v1.png",
    "stone sentinel": "monster-stone-sentinel-medieval-photoreal-v1.png",
    "crypt knight": "monster-crypt-knight-medieval-photoreal-v1.png",
    "banshee": "monster-banshee-medieval-photoreal-v1.png",
    "necromancer": "monster-necromancer-medieval-photoreal-v1.png",
    "ogre jailer": "monster-ogre-jailer-medieval-photoreal-v1.png",
    "basilisk": "monster-basilisk-medieval-photoreal-v1.png",
    "minotaur": "monster-minotaur-medieval-photoreal-v1.png",
    "vampire": "monster-vampire-medieval-photoreal-v1.png",
    "lich": "monster-lich-medieval-photoreal-v1.png",
    "bone colossus": "monster-bone-colossus-medieval-photoreal-v1.png",
    "abyssal knight": "monster-abyssal-knight-medieval-photoreal-v1.png",
    "dungeon dragon": "monster-dungeon-dragon-medieval-photoreal-v1.png",
};
Image.VENDOR_CAT_IMAGES = {
    "cat buying stick": "vendor-cat-buyer-stick-medieval-photoreal-v1.png",
    "cat buying stone": "vendor-cat-buyer-stone-medieval-photoreal-v1.png",
    "cat buying hay": "vendor-cat-buyer-hay-medieval-photoreal-v1.png",
    "cat buying root": "vendor-cat-buyer-root-medieval-photoreal-v1.png",
    "cat buying iron ore": "vendor-cat-buyer-iron-ore-medieval-photoreal-v1.png",
    "cat buying iron": "vendor-cat-buyer-iron-medieval-photoreal-v1.png",
    "cat buying yarrow": "vendor-cat-buyer-yarrow-medieval-photoreal-v1.png",
    "cat buying hide": "vendor-cat-buyer-hide-medieval-photoreal-v1.png",
    "cat buying chest": "vendor-cat-buyer-chest-medieval-photoreal-v1.png",
    "cat buying rat": "vendor-cat-buyer-rat-medieval-photoreal-v1.png",
    "cat buying orc": "vendor-cat-buyer-orc-medieval-photoreal-v1.png",
    "cat buying troll": "vendor-cat-buyer-troll-medieval-photoreal-v1.png",
    "cat buying torch": "vendor-cat-buyer-torch-medieval-photoreal-v1.png",
    "cat buying club": "vendor-cat-buyer-club-medieval-photoreal-v1.png",
    "cat buying stone axe": "vendor-cat-buyer-stone-axe-medieval-photoreal-v1.png",
    "cat buying sword": "vendor-cat-buyer-sword-medieval-photoreal-v1.png",
    "cat buying padded hide": "vendor-cat-buyer-padded-hide-medieval-photoreal-v1.png",
    "cat buying wooden shield": "vendor-cat-buyer-wooden-shield-medieval-photoreal-v1.png",
    "cat buying reinforced shield": "vendor-cat-buyer-reinforced-shield-medieval-photoreal-v1.png",
    "cat buying crucible": "vendor-cat-buyer-crucible-medieval-photoreal-v1.png",
    "cat buying treasure": "vendor-cat-buyer-treasure-medieval-photoreal-v1.png",
    "cat selling stick": "vendor-cat-seller-stick-medieval-photoreal-v1.png",
    "cat selling stone": "vendor-cat-seller-stone-medieval-photoreal-v1.png",
    "cat selling hay": "vendor-cat-seller-hay-medieval-photoreal-v1.png",
    "cat selling root": "vendor-cat-seller-root-medieval-photoreal-v1.png",
    "cat selling iron ore": "vendor-cat-seller-iron-ore-medieval-photoreal-v1.png",
    "cat selling iron": "vendor-cat-seller-iron-medieval-photoreal-v1.png",
    "cat selling yarrow": "vendor-cat-seller-yarrow-medieval-photoreal-v1.png",
    "cat selling hide": "vendor-cat-seller-hide-medieval-photoreal-v1.png",
    "cat selling chest": "vendor-cat-seller-chest-medieval-photoreal-v1.png",
    "cat selling rat": "vendor-cat-seller-rat-medieval-photoreal-v1.png",
    "cat selling orc": "vendor-cat-seller-orc-medieval-photoreal-v1.png",
    "cat selling troll": "vendor-cat-seller-troll-medieval-photoreal-v1.png",
    "cat selling torch": "vendor-cat-seller-torch-medieval-photoreal-v1.png",
    "cat selling club": "vendor-cat-seller-club-medieval-photoreal-v1.png",
    "cat selling stone axe": "vendor-cat-seller-stone-axe-medieval-photoreal-v1.png",
    "cat selling sword": "vendor-cat-seller-sword-medieval-photoreal-v1.png",
    "cat selling padded hide": "vendor-cat-seller-padded-hide-medieval-photoreal-v1.png",
    "cat selling wooden shield": "vendor-cat-seller-wooden-shield-medieval-photoreal-v1.png",
    "cat selling reinforced shield": "vendor-cat-seller-reinforced-shield-medieval-photoreal-v1.png",
    "cat selling crucible": "vendor-cat-seller-crucible-medieval-photoreal-v1.png",
    "cat selling treasure": "vendor-cat-seller-treasure-medieval-photoreal-v1.png",
};
