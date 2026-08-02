export const ACCURACY_MULTIPLIER = 10000;
export const ITEM_TAKING_RANGE = 1;
import { Coordinates } from "./Coordinates.js";
import { DungeonMap } from "./DungeonMap.js";
import { ShopMap } from "./ShopMap.js";
import { DUNGEON_AREA, SHOP_AREA, SURFACE_AREA } from "./Area.js";
import { FightMonsterButton } from "./FightMonsterButton.js";
import { Image } from "./Image.js";
import { Inventory } from "./Inventory.js";
import { ItemTaking } from "./ItemTaking.js";
import { ItemType } from "./ItemType.js";
import { TakeItemButton } from "./TakeItemButton.js";
import { View } from './View.js';
export class Map {
    constructor(map, messageBox, cols, rows, inventory, state, tile_size, onCellSelected, onInteractionUnlocked) {
        this.slidingAnimationInProgress = false;
        this.interactionLocked = false;
        this.catFacingX = 1;
        this.catVisualState = null;
        this.map = map;
        this.messageBox = messageBox;
        this.cols = cols;
        this.rows = rows;
        this.inventory = inventory;
        this.state = state;
        this.tile_size = tile_size;
        this.onCellSelected = onCellSelected;
        this.onInteractionUnlocked = onInteractionUnlocked;
    }
    // Redraws map.
    show({ previousCoordinates = null, }) {
        // updateRealWorldMap(latitude, longitude);
        if (previousCoordinates !== null) {
            const horizontalMovement = this.state.coordinates.latitude
                - previousCoordinates.latitude;
            if (horizontalMovement !== 0) {
                this.catFacingX = horizontalMovement > 0 ? 1 : -1;
            }
        }
        const areaId = this.inventory.getAreaId();
        // Set map background.
        let style = "";
        if (areaId === SURFACE_AREA) {
            style = "background-image: url(images/seamless-sand-light-beach-square-texture-39125213.jpg);";
        }
        else if (areaId === SHOP_AREA) {
            style = "background-image: url(images/dirt2.png);";
        }
        else {
            style = "background-image: url(images/dirt2.png);";
        }
        this.map.setAttribute("style", style);
        // Inventory is the default whenever the selected location has no action.
        View.setMessage(this.messageBox, this.inventory.getText());
        this.map.innerHTML = "";
        for (let y = 1; y <= this.rows; y++) {
            for (let x = 1; x <= this.cols; x++) {
                const cell_coordinates = new Coordinates(this.state.coordinates.latitude + (x - (this.cols + 1) / 2), this.state.coordinates.longitude + (y - (this.rows + 1) / 2));
                const seed = cell_coordinates.getSeed();
                let div = this.getCellElement(x, y, cell_coordinates);
                const hasWall = this.isWallAt(cell_coordinates, areaId);
                if (areaId === DUNGEON_AREA) {
                    if (hasWall) {
                        div.append(Image.getWithItemTypeName("road", this.tile_size, seed).element());
                        div.append(Image.getWithItemTypeName("dungeon wall", this.tile_size, seed).element());
                    }
                    else {
                        div.append(Image.getWithItemTypeName("dungeon floor", this.tile_size, seed).element());
                    }
                }
                else if (areaId === SHOP_AREA) {
                    const outside = ShopMap.isOutside(cell_coordinates);
                    if (outside) {
                        div.classList.add("shop-outside");
                        div.append(Image.getWithItemTypeName("shop outside grass", this.tile_size, seed).element());
                        if (!(seed % 31)) {
                            const tree = Image.getWithItemTypeName("tree", this.tile_size, seed).element();
                            tree.classList.add("shop-outside-tree");
                            div.append(tree);
                        }
                    }
                    else {
                        div.classList.add("shop-indoor");
                        if (hasWall) {
                            div.append(Image.getWithItemTypeName("shop wall", this.tile_size, seed).element());
                        }
                        else {
                            const floor = Image.getWithItemTypeName("shop floor", this.tile_size, seed).element();
                            floor.classList.add("shop-floor");
                            div.append(floor);
                            const decoration = ShopMap.decorationAt(cell_coordinates);
                            if (decoration !== null) {
                                div.append(Image.getWithItemTypeName(decoration, this.tile_size, seed).element());
                            }
                        }
                    }
                }
                else {
                    // Sand.
                    div.append(Image.getWithItemTypeName('sand', this.tile_size, seed).element());
                    // // Grass.
                    div.append(Image.getWithItemTypeName('grass', this.tile_size, seed).element());
                    // Tree.
                    if (!(seed % 21)) {
                        div.append(Image.getWithItemTypeName('tree', this.tile_size, seed).element());
                    }
                    // Rock formation.
                    if (!(seed % 177)) {
                        div.append(Image.getWithItemTypeName("rock formation", this.tile_size, seed).element());
                    }
                    // Big rock.
                    if (!(seed % 997)) {
                        div.append(Image.getWithItemTypeName("big rock", this.tile_size, seed).element());
                    }
                    // Cloud.
                    if (!(seed % 99)) {
                        div.append(Image.getWithItemTypeName("cloud", this.tile_size, seed).element());
                    }
                }
                // Get item type.
                let itemType = hasWall ? null : ItemType.getWithSeed(seed, areaId);
                if (areaId === SHOP_AREA
                    && (itemType === null || itemType === void 0 ? void 0 : itemType.name.startsWith("cat "))
                    && (ShopMap.isOutside(cell_coordinates)
                        || ShopMap.isBesideWall(cell_coordinates))) {
                    itemType = null;
                }
                // Check if item has been taken. Show item.
                let isTaken = null;
                let takeable = null;
                let item_taking_summary = null;
                if (itemType) {
                    // Check if item has been taken.
                    isTaken = this.inventory.isItemTaken(cell_coordinates);
                    // Summary.
                    item_taking_summary = new ItemTaking(itemType, this.inventory).summary();
                    if (item_taking_summary.missing.length > 0) {
                        takeable = false;
                    }
                    else {
                        takeable = true;
                    }
                    const itemElement = Image.getWithItemTypeName(itemType.name, this.tile_size, seed, isTaken, takeable).element();
                    itemElement.classList.add("collectible");
                    div.append(itemElement);
                }
                // If a location has been selected and it is the current location.
                const selected_coordinates = this.state.selectedCoordinates;
                if (selected_coordinates !== null && cell_coordinates.equals(selected_coordinates)) {
                    div.classList.add("selected");
                    // Show "take"-button if item has not been taken.
                    if (isTaken === false
                        && item_taking_summary !== null // to satisfy ts compiler
                        && itemType !== null // to satisfy ts compiler
                    ) {
                        if (this.isWithinTakingRange(selected_coordinates)) {
                            const actionButton = itemType.isMonster()
                                ? new FightMonsterButton(item_taking_summary, this.inventory, selected_coordinates, this).element()
                                : new TakeItemButton(item_taking_summary, this.inventory, selected_coordinates, this, this.messageBox).element();
                            View.setMessage(this.messageBox, actionButton);
                        }
                        else {
                            View.setMessage(this.messageBox, "Walk closer to take this " + itemType.name + ".");
                        }
                    }
                }
                // Current location.
                if (x === (this.cols + 1) / 2 && y === (this.rows + 1) / 2) {
                    // Cat.
                    const catImage = Image.getWithItemTypeName("cat", this.tile_size, seed);
                    const cat = catImage.element();
                    cat.style.setProperty("--item-mirror", String(this.catFacingX));
                    this.animateCatVisual(cat, catImage);
                    div.append(cat);
                }
                this.map.append(div);
            }
        }
        // Map is moved - slide it.
        if (previousCoordinates !== null) {
            this.slide({ previous_coordinates: previousCoordinates, tile_size: this.tile_size });
        }
    }
    animateCatVisual(cat, image) {
        const nextState = {
            rotation: image.rotate,
            dimension: image.dimension,
            mirror: this.catFacingX,
        };
        const previousState = this.catVisualState;
        this.catVisualState = nextState;
        if (previousState === null
            || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const startScale = previousState.dimension / nextState.dimension;
        cat.animate([
            {
                transform: "rotate(" + previousState.rotation + "deg) scaleX("
                    + previousState.mirror + ") scale(" + startScale + ")",
            },
            {
                transform: "rotate(" + nextState.rotation + "deg) scaleX("
                    + nextState.mirror + ") scale(1)",
            },
        ], {
            duration: 420,
            easing: "cubic-bezier(.4,0,.2,1)",
        });
    }
    isWithinTakingRange(coordinates) {
        return this.state.coordinates.distanceFrom(coordinates) <= ITEM_TAKING_RANGE;
    }
    isWallAt(coordinates, areaId = this.inventory.getAreaId()) {
        if (areaId === DUNGEON_AREA) {
            return DungeonMap.hasWallAt(coordinates);
        }
        if (areaId === SHOP_AREA) {
            return ShopMap.hasWallAt(coordinates);
        }
        return false;
    }
    setInteractionLocked(locked) {
        this.interactionLocked = locked;
        if (!locked) {
            this.onInteractionUnlocked();
        }
    }
    // Effetct that smoothly slides the map after location has changed. Game works well without calling this function.
    slide({ previous_coordinates, tile_size, }) {
        var _a;
        if (this.slidingAnimationInProgress) {
            console.log("Animation in progress, do not start another.");
            return; // Do not start another sliding animation if one is already in progress.
        }
        this.slidingAnimationInProgress = true;
        console.log("Start sliding animation.");
        const MAP_SLIDING_STEPS = 30; // How many steps the sliding effect has. Higher value makes the effect slower.
        let latitudeDifference = this.state.coordinates.latitude - previous_coordinates.latitude;
        let longitudeDifference = this.state.coordinates.longitude - previous_coordinates.longitude;
        let stepSizeX = tile_size / MAP_SLIDING_STEPS * Math.abs(latitudeDifference);
        let stepSizeY = tile_size / MAP_SLIDING_STEPS * Math.abs(longitudeDifference);
        let latitudeSign = Math.sign(latitudeDifference);
        let longitudeSign = Math.sign(longitudeDifference);
        const cat = (_a = document.getElementById("cat")) !== null && _a !== void 0 ? _a : new HTMLElement();
        console.log("slide");
        const originalMargins = {
            mapLeft: parseFloat(window.getComputedStyle(this.map).marginLeft),
            mapTop: parseFloat(window.getComputedStyle(this.map).marginTop),
            catLeft: parseFloat(window.getComputedStyle(cat).marginLeft),
            catTop: parseFloat(window.getComputedStyle(cat).marginTop),
        };
        this.slideAnimation({
            stepNumber: 0,
            signedStepSizeX: stepSizeX * latitudeSign,
            signedStepSizeY: stepSizeY * longitudeSign,
            originalMargins: originalMargins,
        });
    }
    slideAnimation({ stepNumber, signedStepSizeX, signedStepSizeY, originalMargins, }) {
        var _a;
        const MAP_MOVE_STEP_TIME = 1;
        const MAP_SLIDING_STEPS = 30; // How many steps the sliding effect has. Higher value makes the effect slower.
        const cat = (_a = document.getElementById("cat")) !== null && _a !== void 0 ? _a : new HTMLElement();
        let margins = Object.assign({}, originalMargins);
        if (stepNumber < MAP_SLIDING_STEPS) {
            const vertical_margin = (MAP_SLIDING_STEPS - stepNumber) * signedStepSizeX;
            const horizontal_margin = (MAP_SLIDING_STEPS - stepNumber) * signedStepSizeY;
            margins.mapLeft += vertical_margin;
            margins.mapTop += horizontal_margin;
            margins.catLeft -= vertical_margin;
            margins.catTop -= horizontal_margin;
            // Callback.
            window.setTimeout(() => {
                stepNumber++;
                this.slideAnimation({
                    stepNumber: stepNumber,
                    signedStepSizeX: signedStepSizeX,
                    signedStepSizeY: signedStepSizeY,
                    originalMargins: originalMargins,
                });
            }, MAP_MOVE_STEP_TIME);
        }
        else {
            this.slidingAnimationInProgress = false;
            console.log("End sliding animation.");
        }
        // Save margin values to css.
        this.map.style.marginLeft = margins.mapLeft + "px";
        cat.style.marginLeft = margins.catLeft + "px";
        this.map.style.marginTop = margins.mapTop + "px";
        cat.style.marginTop = margins.catTop + "px";
    }
    getCellElement(x, y, cell_coordinates) {
        let div = document.createElement("div");
        div.setAttribute("class", "cell");
        div.setAttribute("style", "grid-column:" + x + "/" + x + ";grid-row:" + y + "/" + y);
        div.setAttribute("aria-label", cell_coordinates.latitude + "," + cell_coordinates.longitude);
        div.setAttribute("id", "cell" + x + "-" + y);
        // Select a location, or move to it in Explore mode.
        div.addEventListener("click", () => {
            if (!this.slidingAnimationInProgress && !this.interactionLocked) {
                this.onCellSelected(cell_coordinates);
            }
        });
        return div;
    }
}
