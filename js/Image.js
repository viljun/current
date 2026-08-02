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
        let srcs = [];
        let rotate = 0;
        let dimension = 1;
        let domId = null;
        let style = "";
        let zIndex = 20;
        const rotationSeed = Image.visualSeed(seed, name, 1);
        const dimensionSeed = Image.visualSeed(seed, name, 2);
        const opacitySeed = Image.visualSeed(seed, name, 3);
        const sourceSeed = Image.visualSeed(seed, name, 4);
        if (name === "cat") {
            rotate = (rotationSeed % 10) - 5;
            dimension = 2;
            zIndex = 30;
            domId = "cat";
            srcs = [
                "pngtree-cute-cat-animal-png-image_10149335.png",
            ];
        }
        else if (name === "chest") {
            dimension = 2;
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
            rotate = (rotationSeed % 20) - 10;
            dimension = 0.3 + (dimensionSeed % 700) / 70;
            style = "opacity:" + ((opacitySeed % 13) / 50 + 0.05).toFixed(2) + ";";
            zIndex = 40;
        }
        else if (name === "club") {
            srcs = [
                "20240124010710",
                "wooden_club.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 2.0;
        }
        else if (name === "coin") {
            srcs = [
                "f9da09a345b352d9f6cd4e59f66197c4.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 0.1;
        }
        else if (name === "crucible") {
            srcs = [
                "crucible-medieval-photoreal-v1.png",
            ];
            rotate = (rotationSeed % 16) - 8;
            dimension = 1.2;
        }
        else if (name === "dungeon entrance") {
            srcs = [
                "dungeon-entrance-medieval-photoreal-grounded-v2.png",
            ];
            dimension = 2.6 + (dimensionSeed % 60) / 100;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.9).toFixed(2) + ";";
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
            rotate = (rotationSeed % 10) - 5;
            style = "opacity:" + ((opacitySeed % 90) / 90 + 0.3).toFixed(2) + ";";
            dimension = 0.6 + (dimensionSeed % 110) / 80;
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
            dimension = 1.3 + (dimensionSeed % 110) / 500;
            zIndex = 2;
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
                "hay-medieval-photoreal-v1.png",
            ];
            dimension = 0.75 + (dimensionSeed % 25) / 100;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.88).toFixed(2) + ";";
            zIndex = 15;
        }
        else if (name === "yarrow") {
            srcs = [
                "yarrow-photoreal-v3.png",
            ];
            rotate = (rotationSeed % 20) - 10;
            dimension = 0.9 + (dimensionSeed % 30) / 100;
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
        else if (name === "orc") {
            srcs = [
                "monster-orc-photoreal-grounded-v2.png",
            ];
            dimension = 1.7 + (dimensionSeed % 25) / 100;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if (name === "rat") {
            srcs = [
                "monster-rat-photoreal-grounded-v2.png",
            ];
            dimension = 1.1 + (dimensionSeed % 15) / 100;
            style = "opacity:" + ((opacitySeed % 6) / 100 + 0.93).toFixed(2) + ";";
        }
        else if (name === "restaurant") {
            srcs = [
                "restaurant1.png",
                "restaurant2.png",
                "restaurant3.webp",
            ];
            rotate = (rotationSeed % 20) - 10;
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
                "weeping-stone-photoreal-soft-edge-grounded-v2.png",
            ];
            dimension = 2 + (dimensionSeed % 90) / 10;
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
        else if (name === "stairs up") {
            dimension = 1 + (dimensionSeed % 130) / 600;
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
                "weeping-stone-photoreal-soft-edge-grounded-v2.png",
            ];
            dimension = 0.2 + (dimensionSeed % 60) / 100;
            style = "opacity:" + ((opacitySeed % 31) / 100 + 0.5).toFixed(2) + ";";
        }
        else if (name === "stone axe") {
            srcs = [
                "image-asset-1.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 2.0;
        }
        else if (name === "sword") {
            srcs = [
                "Sword.png",
                "T_Pictos_CurvedSword_01.png",
                "FEWATH_Sword_of_the_Creator.png",
                "White_Sword_of_the_Sky_-_TotK_icon.png",
            ];
            rotate = rotationSeed % 360;
            dimension = 2.0;
        }
        else if (name === "treasure") {
            srcs = [
                "treasure-medieval-pouch-photoreal-grounded-v2.png",
            ];
            dimension = 1.1 + (dimensionSeed % 15) / 100;
            style = "opacity:" + ((opacitySeed % 8) / 100 + 0.9).toFixed(2) + ";";
        }
        else if (name === "torch") {
            srcs = [
                "torch.png",
            ];
            rotate = (rotationSeed % 24) - 12;
            dimension = 1.6;
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
            dimension = 2.2 + (dimensionSeed % 30) / 100;
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
        if (this.rotate !== 0) {
            style += "transform:rotate(" + this.rotate + "deg);";
        }
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
