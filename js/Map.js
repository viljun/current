export const ACCURACY_MULTIPLIER = 10000;
export const ITEM_TAKING_RANGE = 1;
import { Coordinates } from "./Coordinates.js";
import { DungeonMap } from "./DungeonMap.js";
import { HighlandMap } from "./HighlandMap.js";
import { EncounterCard } from "./EncounterCard.js";
import { EncounterText } from "./EncounterText.js";
import { ShopMap } from "./ShopMap.js";
import { SurfaceMap, } from "./SurfaceMap.js";
import { DUNGEON_AREA, HIGHLAND_AREA, SHOP_AREA, SURFACE_AREA, } from "./Area.js";
import { FightMonsterButton } from "./FightMonsterButton.js";
import { Image } from "./Image.js";
import { Inventory } from "./Inventory.js";
import { ItemExplanation } from "./ItemExplanation.js";
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
        this.visibleDungeonWalls = {};
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
        var _a, _b, _c;
        // updateRealWorldMap(latitude, longitude);
        if (previousCoordinates !== null) {
            const horizontalMovement = this.state.coordinates.latitude
                - previousCoordinates.latitude;
            if (horizontalMovement !== 0) {
                this.catFacingX = horizontalMovement > 0 ? 1 : -1;
            }
        }
        const areaId = this.inventory.getAreaId();
        const dungeonMapExtraSize = 10;
        const dungeonMap = areaId === DUNGEON_AREA
            ? DungeonMap.forViewport(this.cols, this.rows, this.state.coordinates, dungeonMapExtraSize)
            : null;
        this.visibleDungeonWalls = {};
        // Set map background.
        let style = "";
        if (areaId === SURFACE_AREA) {
            style = "background-image: url(images/seamless-sand-light-beach-square-texture-39125213.jpg);";
        }
        else if (areaId === SHOP_AREA) {
            style = "background-image: url(images/dirt2.png);";
        }
        else if (areaId === HIGHLAND_AREA) {
            style = "background-color:#263126;"
                + "background-image:url(images/highland-jungle-floor-medieval-photoreal-v1.png);";
        }
        else {
            style = "background-image: url(images/dirt2.png);";
        }
        this.map.setAttribute("style", style);
        // Inventory is the default whenever the selected location has no action.
        EncounterCard.clear();
        View.setMessage(this.messageBox, this.progressStatusElement());
        this.map.innerHTML = "";
        for (let y = 1; y <= this.rows; y++) {
            for (let x = 1; x <= this.cols; x++) {
                const cell_coordinates = new Coordinates(this.state.coordinates.latitude + (x - (this.cols + 1) / 2), this.state.coordinates.longitude + (y - (this.rows + 1) / 2));
                const seed = cell_coordinates.getSeed();
                const surfaceRiver = areaId === SURFACE_AREA
                    ? SurfaceMap.riverAt(cell_coordinates)
                    : null;
                const surfaceRoad = areaId === SURFACE_AREA
                    ? SurfaceMap.roadAt(cell_coordinates)
                    : null;
                const surfaceItem = areaId === SURFACE_AREA
                    ? SurfaceMap.itemAt(cell_coordinates)
                    : null;
                const surfaceMilestone = areaId === SURFACE_AREA
                    ? SurfaceMap.milestoneAt(cell_coordinates)
                    : false;
                const surfaceCrossing = areaId === SURFACE_AREA
                    ? SurfaceMap.crossingAt(cell_coordinates, surfaceRoad, surfaceRiver)
                    : null;
                let div = this.getCellElement(x, y, cell_coordinates);
                const hasWall = dungeonMap === null
                    ? this.isWallAt(cell_coordinates, areaId)
                    : Boolean((_a = dungeonMap.map[y + dungeonMapExtraSize]) === null || _a === void 0 ? void 0 : _a[x + dungeonMapExtraSize]);
                if (areaId === DUNGEON_AREA) {
                    this.visibleDungeonWalls[Map.coordinatesKey(cell_coordinates)] = hasWall;
                }
                if (areaId === DUNGEON_AREA) {
                    const feature = DungeonMap.featureAt(cell_coordinates);
                    if (feature !== null) {
                        div.classList.add("dungeon-feature", "dungeon-feature--"
                            + feature.kind.replace(/ /g, "-"));
                        div.dataset.dungeonArea =
                            (_b = DungeonMap.featureTitleAt(cell_coordinates)) !== null && _b !== void 0 ? _b : "";
                    }
                    if (hasWall) {
                        div.append(Image.getWithItemTypeName("road", this.tile_size, seed).element());
                        div.append(Image.getWithItemTypeName("dungeon wall", this.tile_size, seed).element());
                    }
                    else {
                        const terrain = DungeonMap.terrainAt(cell_coordinates);
                        if (terrain === "dungeon moonwell water"
                            || terrain === "dungeon wet floor"
                            || terrain === "dungeon chapel floor"
                            || terrain === "dungeon web floor") {
                            this.decorateDungeonSoftTerrainCell(div, cell_coordinates, terrain);
                        }
                        else {
                            div.append(Image.getWithItemTypeName(terrain, this.tile_size, seed).element());
                        }
                        const decoration = DungeonMap.decorationAt(cell_coordinates);
                        if (decoration !== null) {
                            const decorationElement = Image.getWithItemTypeName(decoration, this.tile_size, seed).element();
                            decorationElement.classList.add("dungeon-decoration");
                            div.append(decorationElement);
                        }
                    }
                }
                else if (areaId === SHOP_AREA) {
                    const outside = ShopMap.isOutside(cell_coordinates);
                    if (outside) {
                        div.classList.add("shop-outside");
                        div.append(Image.getWithItemTypeName("shop outside grass", this.tile_size, seed).element());
                        const decoration = Map.shopOutsideDecoration(seed);
                        if (decoration !== null) {
                            const decorationImage = Image.getWithItemTypeName(decoration, this.tile_size, seed).element();
                            decorationImage.classList.add("shop-outside-decoration");
                            div.append(decorationImage);
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
                else if (areaId === HIGHLAND_AREA) {
                    const castle = HighlandMap.castleAt(cell_coordinates);
                    if (castle !== null) {
                        div.classList.add("highland-castle");
                        div.dataset.highlandArea =
                            (_c = HighlandMap.castleTitleAt(cell_coordinates)) !== null && _c !== void 0 ? _c : "";
                    }
                    div.append(Image.getWithItemTypeName(HighlandMap.terrainAt(cell_coordinates), this.tile_size, seed).element());
                    const decoration = HighlandMap.decorationAt(cell_coordinates);
                    if (decoration !== null) {
                        const decorationElement = Image.getWithItemTypeName(decoration, this.tile_size, seed).element();
                        decorationElement.classList.add("highland-decoration");
                        div.append(decorationElement);
                    }
                }
                else {
                    if (surfaceRiver !== null) {
                        this.decorateRiverCell(div, cell_coordinates, surfaceRiver);
                    }
                    let roadVisual = null;
                    if (surfaceRoad !== null) {
                        roadVisual = this.decorateRoadCell(div, cell_coordinates, surfaceRoad);
                    }
                    if (surfaceRiver === null && surfaceRoad === null) {
                        // Sand.
                        div.append(Image.getWithItemTypeName('sand', this.tile_size, seed).element());
                        // Grass.
                        div.append(Image.getWithItemTypeName('grass', this.tile_size, seed).element());
                        if ((surfaceItem === null || surfaceItem === void 0 ? void 0 : surfaceItem.name) !== "campfire"
                            && !surfaceMilestone) {
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
                    }
                    else if (roadVisual !== null) {
                        this.decorateRoadGrass(div, seed, roadVisual);
                        if (!(seed % 99)) {
                            div.append(Image.getWithItemTypeName("cloud", this.tile_size, seed).element());
                        }
                    }
                    if (surfaceCrossing !== null) {
                        div.classList.add("surface-road-crossing", "surface-road-crossing--"
                            + surfaceCrossing.kind);
                        if (surfaceCrossing.bridgeAnchor) {
                            const bridge = Image.getWithItemTypeName("surface road bridge", this.tile_size, seed).element();
                            bridge.classList.add("surface-road-bridge");
                            bridge.style.transform = "rotate("
                                + surfaceCrossing.rotationDegrees
                                + "deg)";
                            div.append(bridge);
                        }
                    }
                    if (surfaceMilestone) {
                        const milestone = Image.getWithItemTypeName("surface road milestone", this.tile_size, seed).element();
                        milestone.classList.add("surface-road-milestone");
                        div.append(milestone);
                    }
                }
                // Get item type.
                const shopOutside = areaId === SHOP_AREA
                    && ShopMap.isOutside(cell_coordinates);
                let itemType = hasWall
                    ? null
                    : areaId === SURFACE_AREA
                        ? surfaceItem
                        : shopOutside
                            ? ItemType.getShopOutsideWithSeed(seed)
                            : areaId === DUNGEON_AREA
                                ? DungeonMap.itemAt(cell_coordinates)
                                : areaId === HIGHLAND_AREA
                                    ? HighlandMap.itemAt(cell_coordinates)
                                    : ItemType.getWithSeed(seed, areaId);
                if (areaId === DUNGEON_AREA
                    && itemType !== null
                    && dungeonMap !== null
                    && !dungeonMap.allowsItemAt(x + dungeonMapExtraSize, y + dungeonMapExtraSize, itemType)) {
                    itemType = null;
                }
                if (areaId === HIGHLAND_AREA
                    && itemType !== null
                    && !HighlandMap.allowsItemAt(cell_coordinates, itemType)) {
                    itemType = null;
                }
                if (areaId === SHOP_AREA
                    && (itemType === null || itemType === void 0 ? void 0 : itemType.name.startsWith("cat "))
                    && (shopOutside
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
                            const isEncounter = itemType.isMonster()
                                || itemType.name.startsWith("cat ")
                                || itemType.name.startsWith("magician selling ");
                            const identity = isEncounter
                                ? EncounterText.for(itemType.name, selected_coordinates.latitude, selected_coordinates.longitude)
                                : null;
                            if (identity !== null) {
                                EncounterCard.show(identity.description, itemType.isMonster()
                                    ? ItemExplanation.element(itemType.name, selected_coordinates.latitude, selected_coordinates.longitude, areaId)
                                    : "", itemType.isMonster()
                                    ? ItemExplanation.displayName(itemType.name)
                                    : "");
                            }
                            const action = itemType.name.startsWith("cat ")
                                || itemType.name.startsWith("magician selling ")
                                ? "trade"
                                : "take this " + itemType.name;
                            View.setMessage(this.messageBox, itemType.isMonster()
                                ? "Walk closer to capture "
                                    + View.getQuantityText(itemType.name, 1)
                                    + "."
                                : (identity === null
                                    ? ""
                                    : identity.name + " — ")
                                    + "Walk closer to " + action + ".");
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
    static progressItemReferences(text) {
        var _a, _b;
        const candidates = [];
        const lowerText = text.toLowerCase();
        for (const itemName of Map.PROGRESS_ITEM_NAMES) {
            const plural = View.getQuantityText(itemName, 2).replace(/^2\s+/, "");
            const labels = Array.from(new Set([itemName, plural]));
            for (const label of labels) {
                let searchFrom = 0;
                while (searchFrom < lowerText.length) {
                    const start = lowerText.indexOf(label, searchFrom);
                    if (start < 0) {
                        break;
                    }
                    const before = (_a = lowerText[start - 1]) !== null && _a !== void 0 ? _a : "";
                    const after = (_b = lowerText[start + label.length]) !== null && _b !== void 0 ? _b : "";
                    if (!/[a-z]/.test(before)
                        && !/[a-z]/.test(after)) {
                        candidates.push({
                            start,
                            length: label.length,
                            itemName,
                        });
                    }
                    searchFrom = start + label.length;
                }
            }
        }
        candidates.sort((first, second) => first.start - second.start
            || second.length - first.length
            || (first.itemName < second.itemName ? -1 : 1));
        const references = [];
        for (const candidate of candidates) {
            const previous = references[references.length - 1];
            if (previous === undefined
                || candidate.start >= previous.start + previous.length) {
                references.push(candidate);
            }
        }
        return references;
    }
    progressStatusElement() {
        const text = this.inventory.getText();
        const status = document.createElement("div");
        status.className = "message status-text";
        status.title = text;
        const references = Map.progressItemReferences(text);
        let position = 0;
        for (const reference of references) {
            status.append(document.createTextNode(text.slice(position, reference.start)));
            const button = document.createElement("button");
            button.type = "button";
            button.className = "status-item-link";
            button.setAttribute("aria-controls", EncounterCard.ID);
            button.setAttribute("aria-expanded", "false");
            button.textContent = text.slice(reference.start, reference.start + reference.length);
            button.setAttribute("aria-label", "View details for "
                + ItemExplanation.displayName(reference.itemName));
            button.onclick = () => EncounterCard.showItem(reference.itemName, {
                latitude: this.state.coordinates.latitude,
                longitude: this.state.coordinates.longitude,
                areaId: this.inventory.getAreaId(),
            }, button);
            status.append(button);
            position = reference.start + reference.length;
        }
        status.append(document.createTextNode(text.slice(position)));
        return status;
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
            const visibleWall = this.visibleDungeonWalls[Map.coordinatesKey(coordinates)];
            if (visibleWall !== undefined) {
                return visibleWall;
            }
            return DungeonMap.hasWallAt(coordinates);
        }
        if (areaId === SHOP_AREA) {
            return ShopMap.hasWallAt(coordinates);
        }
        if (areaId === HIGHLAND_AREA) {
            return HighlandMap.hasWallAt(coordinates);
        }
        return false;
    }
    static coordinatesKey(coordinates) {
        return coordinates.latitude + "," + coordinates.longitude;
    }
    decorateDungeonSoftTerrainCell(div, coordinates, terrain) {
        const variants = {
            "dungeon moonwell water": "deep",
            "dungeon wet floor": "shallow",
            "dungeon chapel floor": "chapel-soil",
            "dungeon web floor": "spider-soil",
        };
        const patch = document.createElement("span");
        patch.className = "dungeon-soft-terrain-patch "
            + "dungeon-soft-terrain-patch--" + variants[terrain];
        const textureCells = terrain === "dungeon chapel floor"
            || terrain === "dungeon web floor"
            ? 8
            : 10;
        const textureSize = this.tile_size * textureCells;
        const diameter = this.tile_size * 3;
        const inset = (diameter - this.tile_size) / 2;
        patch.style.width = diameter + "px";
        patch.style.height = diameter + "px";
        patch.style.marginLeft = -inset + "px";
        patch.style.marginTop = -inset + "px";
        patch.style.backgroundSize =
            textureSize + "px " + textureSize + "px";
        patch.style.backgroundPosition =
            (-Map.positiveModulo(coordinates.latitude, textureCells) * this.tile_size + inset) + "px "
                + (-Map.positiveModulo(coordinates.longitude, textureCells) * this.tile_size + inset) + "px";
        patch.setAttribute("aria-hidden", "true");
        div.append(patch);
    }
    decorateRiverCell(div, coordinates, river) {
        div.classList.add("surface-river", "surface-river--" + river.channel);
        div.dataset.riverSystem = String(river.systemId);
        const visual = SurfaceMap.riverVisualAt(coordinates, river);
        const diameter = visual.diameterInTiles * this.tile_size;
        const inset = (diameter - this.tile_size) / 2;
        const textureSize = this.tile_size * 8;
        div.style.setProperty("--surface-river-size", diameter + "px");
        div.style.setProperty("--surface-river-rotation", visual.rotationDegrees + "deg");
        div.style.setProperty("--surface-river-texture-size", textureSize + "px");
        div.style.setProperty("--surface-river-texture-position", visual.textureOffsetXInTiles * this.tile_size + inset + "px "
            + (visual.textureOffsetYInTiles * this.tile_size + inset)
            + "px");
    }
    decorateRoadCell(div, coordinates, road) {
        div.classList.add("surface-road", "surface-road--" + road.kind, "surface-road-surface--" + road.surface);
        div.dataset.roadRoute = String(road.routeId);
        const visual = SurfaceMap.roadVisualAt(coordinates, road);
        const diameter = visual.diameterInTiles * this.tile_size;
        const inset = (diameter - this.tile_size) / 2;
        const textureSize = this.tile_size * 8;
        div.style.setProperty("--surface-road-size", diameter + "px");
        div.style.setProperty("--surface-road-rotation", visual.rotationDegrees + "deg");
        div.style.setProperty("--surface-road-texture-size", textureSize + "px");
        div.style.setProperty("--surface-road-texture-position", visual.textureOffsetXInTiles * this.tile_size + inset + "px "
            + (visual.textureOffsetYInTiles * this.tile_size + inset)
            + "px");
        return visual;
    }
    decorateRoadGrass(div, seed, visual) {
        if (visual.grassOpacity <= 0) {
            return;
        }
        const grass = Image.getWithItemTypeName("surface road grass", this.tile_size, seed).element();
        const dimension = visual.grassSizeInTiles * this.tile_size;
        const margin = -(dimension - this.tile_size) / 2;
        grass.classList.add("surface-road-grass");
        grass.style.width = dimension + "px";
        grass.style.height = dimension + "px";
        grass.style.marginLeft = margin + "px";
        grass.style.marginTop = margin + "px";
        grass.style.opacity = String(visual.grassOpacity);
        grass.style.transform = "rotate("
            + visual.grassRotationDegrees
            + "deg)";
        div.append(grass);
    }
    static positiveModulo(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }
    static shopOutsideDecoration(seed) {
        // Trees used to occur once per 11 seeds. Once per 330 is exactly 30x
        // rarer, while the separately salted stream makes desert plants the
        // main outside decoration without correlating their kind or placement.
        if (!(seed % 330)) {
            return "tree";
        }
        const placementSeed = Map.decorationSeed(seed, 0x6d2b79f5);
        if (placementSeed % 7 !== 0) {
            return null;
        }
        const kindSeed = Map.decorationSeed(seed, 0x1b873593);
        return kindSeed % 2 === 0 ? "cactus" : "palm";
    }
    static decorationSeed(seed, salt) {
        let value = (seed >>> 0) ^ salt;
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d) >>> 0;
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b) >>> 0;
        value ^= value >>> 16;
        return value >>> 0;
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
Map.PROGRESS_ITEM_NAMES = [
    "yarrow poultice",
    "reinforced shield",
    "wooden shield",
    "iron-spiked club",
    "iron hand axe",
    "arming sword",
    "binding rope",
    "dungeon entrance",
    "highland gate",
    "stone axe",
    "iron ore",
    "crucible",
    "furnace",
    "coin",
    "hide",
    "sword",
    "club",
    "yarrow",
    "stone",
    "stick",
    "root",
    "hay",
    "iron",
    "rat",
    "orc",
    "troll",
];
