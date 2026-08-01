export class Image {
    dimension: number;
    src: string;
    style: string;
    isTaken: boolean;
    takeable: boolean;
    rotate: number;
    domId: string | null;
    zIndex: number;
    tile_size: number;
    constructor(
        dimension: number,
        src: string,
        style: string,
        isTaken: boolean,
        takeable: boolean,
        rotate: number,
        domId: string | null,
        zIndex: number,
        tile_size: number,
    ) {
        this.dimension = dimension;
        this.src       = src;
        this.style     = style;
        this.isTaken   = isTaken;
        this.takeable  = takeable;
        this.rotate    = rotate;
        this.domId     = domId;
        this.zIndex    = zIndex;
        this.tile_size = tile_size;
    }

    // Returns image for item type.
    static getWithItemTypeName(name: string, tile_size: number, seed: number = 0, isTaken: boolean = false, takeable: boolean = true): Image {
        let srcs: string[] = [];
        let rotate: number = 0;
        let dimension: number = 1;
        let domId: string | null = null;
        let style: string = "";
        let zIndex: number = 20;

        if (name === "cat") {
            rotate    = (seed % 10) - 5;
            dimension = 2;
            zIndex    = 30;
            domId     = "cat";
            srcs      = [
                "pngtree-cute-cat-animal-png-image_10149335.png",
            ];
        } else if (name === "body shop") {
            dimension = 3;
            srcs      = [
                "1966313.png",
            ];
        } else if (name === "chest") {
            rotate    = (seed % 10) - 5;
            dimension = 2;
            srcs      = [
                "pngtree-treasure-chest-illustration-png-image_9243267.png",
            ];
        } else if (name === "cloud") {
            srcs = [
                "cloud-with-ai-generated-free-png.png",
                "realistic-white-cloud-png.png",
                "set-of-realistic-color-shade-cloud-illustration-on-transparency-background-png.png",
                "simple-sunny-day-cloud-image-realistic-cloud-on-a-transparent-background-cloud-on-the-sky-free-png.png",
            ];
            rotate = (seed % 20) - 10;
            dimension = 0.3 + (seed % 700) / 70;
            style = "opacity:" + ((seed % 13) / 50 + 0.05).toFixed(2) + ";";
            zIndex = 40;
        } else if (name === "club") {
            srcs = [
                "20240124010710",
                "wooden_club.png",
            ];
            rotate = seed % 360;
            dimension = 2.0;
        } else if (name === "coin") {
            srcs = [
                "f9da09a345b352d9f6cd4e59f66197c4.png",
            ];
            rotate = seed % 360;
            dimension = 0.1;
        } else if (name === "dungeon entrance") {
            dimension = 2;
            srcs      = [
                "cave.webp",
            ];
            rotate = (seed % 20) - 10;
            dimension = 2 + (seed % 300) / 100;
            style = "opacity:" + ((seed % 100) / 500 + 0.7).toFixed(2) + ";";
        } else if (name === "dungeon floor") {
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
            rotate = (seed % 10) - 5;
            style = "opacity:" + ((seed % 90) / 90 + 0.3).toFixed(2) + ";";
            dimension = 0.6 + (seed % 110) / 80;
            zIndex = 1;
        } else if (name === "dungeon wall") {
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
            rotate = seed % 77 / 30;
            style = "opacity:" + ((seed % 100) / 500 + 0.9).toFixed(2) + ";";
            dimension = 1.3 + (seed % 110) / 500;
            zIndex = 2;
        } else if (name === "forest") {  // quite similar to "tree"
            srcs = [
                "isolated-tree-high-res-free-png.png",
                "8330e0dade8daf56eaedf68805c7414e-beautiful-tall-tree.png",
                "Tree01.png",
                "tree_PNG92780.png",
                "bush.webp",
            ];
            rotate = (seed % 14) - 7;
            dimension = 0.3 + (seed % 500) / 170;
            style = "opacity:" + ((seed % 100) / 10).toFixed(2) + ";";
            zIndex = 16;
        } else if (name === "grass") {
            srcs = [
                "grass1.png",
                "grass2.png",
                "grass3.png",
                "grass4.png",
                "grass5.png",
            ];
            rotate = seed % 360;
            dimension = 0.3 + (seed % 300) / 70;
            style = "opacity:" + ((seed % 13) / 50 + 0.25).toFixed(2) + ";";
            zIndex = 13;
        } else if (name === "hay") {
            srcs = [
                "Hay-no-bg.png",
                "296be9_f3f5ab4acf65417486a6a59c5b146e22~mv2.png",
                "image_e60bdb0e-68ab-40d7-802d-4e256bf5c954_300x300.png",
                "image_300x300.png",
            ];
            rotate = seed % 360;
            dimension = 0.3 + (seed % 100) / 200;
            style = "opacity:" + ((seed % 30) / 100 + 0.5).toFixed(2) + ";";
            zIndex = 15;
        } else if (name === "heart") {
            srcs = [
                "pngtree-smooth-glossy-heart-vector-file-ai-and-png-png-image_4557871.png",
            ];
            rotate = seed % 30;
            dimension = 0.5 + (seed % 60) / 200;
            style = "opacity:" + ((seed % 30) / 100 + 0.6).toFixed(2) + ";";
        } else if (name === "iron") {
            srcs = [
                "20211223230236",
            ];
            rotate = 360;
        } else if (name === "iron ore") {
            srcs = [
                "20200602231757",
                "20220109170708",
                "iron_ore.png",
                "iron_ore2.png",
                "iron_ore3.png",
            ];
            style = "opacity:" + ((seed % 31) / 100 + 0.5).toFixed(2) + ";";
            rotate = 360;
            dimension = 0.5 + (seed % 49) / 200;
        } else if (name === "nature shop") {
            srcs = [
                "869636.png",
            ];
            dimension = 2.0;
        } else if (name === "orc") {
            srcs = [
                "500004073345_lrg.png",
            ];
            rotate = (seed % 20) - 10;
            dimension = 1.5 + ((seed % 151) / 100);
        } else if (name === "rat") {
            srcs = [
                "Mouse-Animal-Transparent.png",
            ];
            rotate = (seed % 20) - 10;
        } else if (name === "restaurant") {
            srcs = [
                "restaurant1.png",
                "restaurant2.png",
                "restaurant3.webp",
            ];
            rotate = (seed % 20) - 10;
            dimension = 1.0 + ((seed % 100) / 100);
        } else if (name === "road") {
            srcs = [
                "road1.png",
                "road2.png",
                "road3.png",
            ];
            rotate = (seed % 30) - 15;
            dimension = 0.5 + (seed % 123) / 20;
            style = "opacity:" + ((seed % 105) / 400 + 0.05).toFixed(2) + ";";
            zIndex = 10;
        } else if (name === "rock formation") {
            srcs = [
                "rock_formation_faded1.png",
                "rock_formation_faded2.png",
                "rock_formation_faded3.png",
                "rock_formation_faded4.png",
            ];
            rotate = seed % 359;
            dimension = 0.5 + (seed % 207) / 20;
            style = "opacity:" + ((seed % 109) / 200).toFixed(2) + ";";
            zIndex = 14;
        } else if (name === "big rock") {
            srcs = [
                "weeping_stone.png",
            ];
            rotate = seed % 360;
            dimension = 2 + (seed % 90) / 10;
        } else if (name === "root") {
            srcs = [
                "e4bee5977278bccccde170df93dea643-roots-stroke-botanical.png",
            ];
            rotate = seed % 360;
            dimension = 0.3 + (seed % 130) / 100;
            style = "opacity:" + ((seed % 41) / 100 + 0.3).toFixed(2) + ";";
        } else if (name === "sand") {
            srcs = [
                "sand_PNG40.png",
                "png_sand_7125.png",
                "sand_PNG44.png",
                "Sharp-Sand.png",
                "soil_PNG84.png",
            ];
            rotate = seed % 360;
            dimension = 0.3 + (seed % 270) / 30;
            style = "opacity:" + ((seed % 100) / 400).toFixed(2) + ";";
            zIndex = 10;
        } else if (name === "smelter") {
            srcs = [
                "Smelter.png",
            ];
            dimension = 3;
        } else if (name === "stairs up") {
            dimension = 1 + (seed % 130) / 600;
            zIndex    = 25;
            srcs      = [
                "stairs_up.png",
            ];
        } else if (name === "stick") {
            srcs = [
                "Stick2D-Isometric.png",
            ];
            rotate = seed % 360;
            dimension = 0.3 + (seed % 130) / 100;
            style = "opacity:" + ((seed % 41) / 50 + 0.3).toFixed(2) + ";";
        } else if (name === "stone") {
            srcs = [
                "weeping_stone.png",
            ];
            rotate = seed % 360;
            dimension = 0.2 + (seed % 60) / 100;
            style = "opacity:" + ((seed % 31) / 100 + 0.5).toFixed(2) + ";";
        } else if (name === "stone axe") {
            srcs = [
                "image-asset-1.png",
            ];
            rotate = seed % 360;
            dimension = 2.0;
        } else if (name === "sword") {
            srcs = [
                "Sword.png",
                "T_Pictos_CurvedSword_01.png",
                "FEWATH_Sword_of_the_Creator.png",
                "White_Sword_of_the_Sky_-_TotK_icon.png",
            ];
            rotate = seed % 360;
            dimension = 2.0;
        } else if (name === "treasure") {
            srcs = [
                "free-gold-dollar-coins-stack-4834362-4025175.png",
            ];
            rotate = (seed % 10) - 5;
            dimension = 3;
        } else if (name === "tree") {
            srcs = [
                "isolated-tree-high-res-free-png.png",
                "8330e0dade8daf56eaedf68805c7414e-beautiful-tall-tree.png",
                "Tree01.png",
                "tree_PNG92780.png",
                "bush.webp",
            ];
            rotate = (seed % 14) - 7;
            dimension = 0.3 + (seed % 500) / 120;
            zIndex = 30;
        } else if (name === "troll") {
            srcs = [
                "Troll-icon.png",
            ];
            dimension = 2.0;
        } else if (name === "water") {
            srcs = [
                "water1.png",
                "water2.png",
            ];
            rotate = (seed % 30) - 15;
            dimension = 2.0 + (seed % 123) / 30;
            style = "opacity:" + ((seed % 105) / 10).toFixed(2) + ";";
            zIndex = 120;
        } else if (name === "weapon shop") {
            srcs = [
                "free-shop-2149883-1806293.png",
            ];
            dimension = 2.0;
        } else {
            console.log("getWithItemTypeName: faulty name " + name);
        }

        return new Image(
            dimension,
            srcs[seed % srcs.length] ?? "",
            style,
            isTaken,
            takeable,
            rotate,
            domId,
            zIndex,
            tile_size,
        );
    }

    // Returns image as html element.
    element(): HTMLImageElement {
        let margin: number = (this.dimension - 1) / 2;
        margin *= this.tile_size;
        margin = -Math.round(margin);

        let dimension: number = this.dimension * this.tile_size;
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
            style += "filter:blur(3px) brightness(10%);";
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
