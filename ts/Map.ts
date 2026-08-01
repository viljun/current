export const ACCURACY_MULTIPLIER = 10_000;
export const ITEM_TAKING_RANGE = 1;

import { Coordinates }    from "./Coordinates.js";
import { DungeonMap }     from "./DungeonMap.js";
import { FightMonsterButton } from "./FightMonsterButton.js";
import { Image }          from "./Image.js";
import { Inventory }      from "./Inventory.js";
import { ItemTaking }     from "./ItemTaking.js";
import { ItemType }       from "./ItemType.js";
import { TakeItemButton } from "./TakeItemButton.js";
import { View }           from './View.js';

export class Map {
    slidingAnimationInProgress: boolean = false;
    interactionLocked: boolean = false;
    pendingCoordinates: Coordinates|null = null;

    map: HTMLDivElement;
    messageBox: HTMLDivElement;
    cols: number;
    rows: number;
    inventory: Inventory;
    coordinates: Coordinates;
    selected_coordinates: Coordinates | null = null;
    tile_size: number;
    isExploreMode: () => boolean;
    onCoordinatesChanged: (coordinates: Coordinates) => void;
    constructor(
        map: HTMLDivElement,
        messageBox: HTMLDivElement,
        cols: number,
        rows: number,
        inventory: Inventory,
        coordinates: Coordinates,
        tile_size: number,
        isExploreMode: () => boolean,
        onCoordinatesChanged: (coordinates: Coordinates) => void = () => {},
    ) {
        this.map = map;
        this.messageBox = messageBox;
        this.cols = cols;
        this.rows = rows;
        this.inventory = inventory;
        this.coordinates = coordinates;
        this.tile_size = tile_size;
        this.isExploreMode = isExploreMode;
        this.onCoordinatesChanged = onCoordinatesChanged;
    }

    // Redraws map.
    show({
        new_coordinates = null, // If null, location does not change.
    }: {
        new_coordinates?:     Coordinates | null,
    } ) {
        if (new_coordinates && this.interactionLocked) {
            this.pendingCoordinates = new_coordinates;

            return;
        }

        const previous_coordinates: Coordinates = this.coordinates;  // Save previous coordinates for sliding effect.
        if (new_coordinates) {  // If moving to new coordinates.
            this.coordinates = new_coordinates;
            this.onCoordinatesChanged(this.coordinates);
            console.log("Latitude " + this.coordinates.latitude + ", longitude " + this.coordinates.longitude);
        }

        // updateRealWorldMap(latitude, longitude);

        // Depth is how many dungeon entrances minus stairs up the player has taken.
        let depth                    = this.inventory.getDepth();
        const dungeon_map_extra_size = 10;  // Extra size to make dungeon map big enough. Its edges tend to be a bit shaky.
        let dungeon_map              = null;
        dungeon_map = new DungeonMap(
            this.cols + dungeon_map_extra_size * 2,
            this.rows + dungeon_map_extra_size * 2,
            this.coordinates,
        );

        // Set map background.
        let style = "";
        if (depth === 0) {
            style = "background-image: url(images/seamless-sand-light-beach-square-texture-39125213.jpg);";
        } else {
            style = "background-image: url(images/dirt2.png);";
        }
        this.map.setAttribute("style", style);

        // Inventory is the default whenever the selected location has no action.
        View.setMessage(this.messageBox, this.inventory.getText(this.messageBox));

        this.map.innerHTML = "";
        for (let y = 1; y <= this.rows; y++) {
            for (let x = 1; x <= this.cols; x++) {
                const cell_coordinates = new Coordinates(
                    this.coordinates.latitude  + (x - (this.cols + 1) / 2),
                    this.coordinates.longitude + (y - (this.rows + 1) / 2)
                );
                const seed = cell_coordinates.getSeed();

                let div = this.getCellElement(x, y, cell_coordinates);

                // Has dungeon wall?
                let $has_dungeon_wall = null;
                if (dungeon_map.map[y + dungeon_map_extra_size]?.[x + dungeon_map_extra_size]) {
                    $has_dungeon_wall = true;
                } else {
                    $has_dungeon_wall = false;
                }

                if (depth > 0 && dungeon_map) {
                    // Dungeon map.
                    if ($has_dungeon_wall) {
                        div.append(Image.getWithItemTypeName("road", this.tile_size, seed).element());
                        div.append(Image.getWithItemTypeName("dungeon wall", this.tile_size, seed).element());
                    } else {
                        div.append(Image.getWithItemTypeName("dungeon floor", this.tile_size, seed).element());
                    }
                } else {
                    // Sand.
                    div.append(Image.getWithItemTypeName('sand', this.tile_size, seed).element());

                    // // Grass.
                    div.append(Image.getWithItemTypeName('grass', this.tile_size, seed).element());

                    // Tree.
                    if (!(seed % 21)) {
                        div.append(Image.getWithItemTypeName('tree', this.tile_size, seed).element());
                    }

                    // Rock formation.
                    if ($has_dungeon_wall && !(seed % 177)) {
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
                let itemType = ItemType.getWithSeed(seed, depth);

                // Check if item is dungeon entrance and there's a wall in the dungeon map.
                // If so, do not show the item.
                if ($has_dungeon_wall
                    && itemType?.name === "dungeon entrance"
                ) {
                    itemType = null;
                }

                // Check if item has been taken. Show item.
                let isTaken             = null;
                let takeable            = null;
                let item_taking_summary = null;
                if (itemType) {
                    // Check if item has been taken.
                    isTaken = this.inventory.isItemTaken(cell_coordinates)
                    if (!isTaken && itemType.canBeTakenOnlyOnce()) {
                        isTaken = this.inventory.isItemTypeTaken(itemType);
                    }

                    // Summary.
                    item_taking_summary = new ItemTaking(itemType, this.inventory).summary();
                    if (item_taking_summary.missing.length > 0) {
                        takeable = false;
                    } else {
                        takeable = true;
                    }

                    const itemElement = Image.getWithItemTypeName(
                        itemType.name,
                        this.tile_size,
                        seed,
                        isTaken,
                        takeable,
                    ).element();
                    itemElement.classList.add("collectible");
                    div.append(itemElement);
                }

                // If a location has been selected and it is the current location.
                const selected_coordinates = this.selected_coordinates;
                if (selected_coordinates !== null && cell_coordinates.equals(selected_coordinates)) {
                    div.classList.add("selected");

                    // Show "take"-button if item has not been taken.
                    if (isTaken === false
                        && item_taking_summary !== null  // to satisfy ts compiler
                        && itemType !== null             // to satisfy ts compiler
                    ) {
                        if (this.isWithinTakingRange(selected_coordinates)) {
                            const actionButton = itemType.isMonster()
                                ? new FightMonsterButton(
                                    item_taking_summary,
                                    this.inventory,
                                    selected_coordinates,
                                    this,
                                ).element()
                                : new TakeItemButton(
                                    item_taking_summary,
                                    this.inventory,
                                    selected_coordinates,
                                    this,
                                    this.messageBox,
                                ).element();
                            View.setMessage(this.messageBox, actionButton);
                        } else {
                            View.setMessage(
                                this.messageBox,
                                "Walk closer to take this " + itemType.name + ".",
                            );
                        }
                    }
                }
                
                // Current location.
                if (x === (this.cols + 1) / 2 && y === (this.rows + 1) / 2) {
                    // Cat.
                    div.append(Image.getWithItemTypeName("cat", this.tile_size, seed).element());
                }

                this.map.append(div);
            }
        }

        // Map is moved - slide it.
        if (new_coordinates) {
            this.slide({ previous_coordinates: previous_coordinates, tile_size: this.tile_size });
        }
    }

    isWithinTakingRange(coordinates: Coordinates): boolean {
        return this.coordinates.distanceFrom(coordinates) <= ITEM_TAKING_RANGE;
    }

    setInteractionLocked(locked: boolean): void {
        this.interactionLocked = locked;
        if (!locked && this.pendingCoordinates !== null) {
            const coordinates = this.pendingCoordinates;
            this.pendingCoordinates = null;
            this.show({ new_coordinates: coordinates });
        } else if (!locked) {
            this.show({});
        }
    }

    // Effetct that smoothly slides the map after location has changed. Game works well without calling this function.
    slide({
        previous_coordinates,
        tile_size,
    }: {
        previous_coordinates: Coordinates,
        tile_size:            number,
    }) {
        if (this.slidingAnimationInProgress) {
            console.log("Animation in progress, do not start another.");
            return; // Do not start another sliding animation if one is already in progress.
        }

        this.slidingAnimationInProgress = true;
        console.log("Start sliding animation.");

        const MAP_SLIDING_STEPS         = 30;  // How many steps the sliding effect has. Higher value makes the effect slower.
        let latitudeDifference: number  = this.coordinates.latitude  - previous_coordinates.latitude;
        let longitudeDifference: number = this.coordinates.longitude - previous_coordinates.longitude;
        let stepSizeX: number           = tile_size / MAP_SLIDING_STEPS * Math.abs(latitudeDifference);
        let stepSizeY: number           = tile_size / MAP_SLIDING_STEPS * Math.abs(longitudeDifference);
        let latitudeSign: number        = Math.sign(latitudeDifference);
        let longitudeSign: number       = Math.sign(longitudeDifference);
        const cat: HTMLElement = document.getElementById("cat") ?? new HTMLElement();

        console.log("slide");

        const originalMargins = {
            mapLeft: parseFloat(window.getComputedStyle(this.map).marginLeft),
            mapTop:  parseFloat(window.getComputedStyle(this.map).marginTop),
            catLeft: parseFloat(window.getComputedStyle(cat).marginLeft),
            catTop:  parseFloat(window.getComputedStyle(cat).marginTop),
        }

        this.slideAnimation({
            stepNumber:           0,
            signedStepSizeX:      stepSizeX * latitudeSign,
            signedStepSizeY:      stepSizeY * longitudeSign,
            originalMargins:      originalMargins,
        });

    }

    slideAnimation({
        stepNumber,
        signedStepSizeX,
        signedStepSizeY,
        originalMargins,
    }: {
        stepNumber: number,
        signedStepSizeX: number,
        signedStepSizeY: number,
        originalMargins: {mapLeft: number, mapTop: number, catLeft: number, catTop: number},
    }) {
        const MAP_MOVE_STEP_TIME        = 1;
        const MAP_SLIDING_STEPS         = 30;  // How many steps the sliding effect has. Higher value makes the effect slower.
        const cat: HTMLElement          = document.getElementById("cat") ?? new HTMLElement();
        let margins                     = { ...originalMargins };

        if (stepNumber < MAP_SLIDING_STEPS) {
            const vertical_margin   = (MAP_SLIDING_STEPS - stepNumber) * signedStepSizeX;
            const horizontal_margin = (MAP_SLIDING_STEPS - stepNumber) * signedStepSizeY;

            margins.mapLeft += vertical_margin;
            margins.mapTop  += horizontal_margin;
            margins.catLeft -= vertical_margin;
            margins.catTop  -= horizontal_margin;

            // Callback.
            window.setTimeout(
                () => {
                    stepNumber++;
                    this.slideAnimation({
                        stepNumber:           stepNumber,
                        signedStepSizeX:      signedStepSizeX,
                        signedStepSizeY:      signedStepSizeY,
                        originalMargins:      originalMargins,
                    });
                },
                MAP_MOVE_STEP_TIME,
            );
        } else {
            this.slidingAnimationInProgress = false;
            console.log("End sliding animation.");
        }

        // Save margin values to css.
        this.map.style.marginLeft = margins.mapLeft + "px";
        cat.style.marginLeft      = margins.catLeft + "px";
        this.map.style.marginTop  = margins.mapTop  + "px";
        cat.style.marginTop       = margins.catTop  + "px";
    }

    getCellElement(
        x: number,
        y: number,
        cell_coordinates: Coordinates,
    ): HTMLDivElement  {
        let div = document.createElement("div");
        div.setAttribute("class", "cell");
        div.setAttribute("style", "grid-column:" + x + "/" + x + ";grid-row:" + y + "/" + y);
        div.setAttribute("aria-label", cell_coordinates.latitude + "," + cell_coordinates.longitude);
        div.setAttribute("id", "cell" + x + "-" + y);

        // Select a location, or move to it in Explore mode.
        div.addEventListener("click", () => {
            if (!this.slidingAnimationInProgress && !this.interactionLocked) {
                this.selected_coordinates = cell_coordinates;

                if (this.isExploreMode()) {
                    this.show({
                        new_coordinates: cell_coordinates,
                    });
                } else {
                    this.show({});
                }
            }
        });

        return div;
    }
}
