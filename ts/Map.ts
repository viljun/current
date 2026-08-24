export const ACCURACY_MULTIPLIER = 10_000;
export const ITEM_TAKING_RANGE = 3;

import { Coordinates }    from "./Coordinates.js";
import { DungeonMap }     from "./DungeonMap.js";
import { HighlandMap }    from "./HighlandMap.js";
import { EncounterCard }  from "./EncounterCard.js";
import { EncounterText }  from "./EncounterText.js";
import { ShopMap }        from "./ShopMap.js";
import {
    SurfaceMap,
    type SurfaceForestCell,
    type SurfaceRiverCell,
    type SurfaceRoadCell,
    type SurfaceRoadVisual,
} from "./SurfaceMap.js";
import {
    DUNGEON_AREA,
    HIGHLAND_AREA,
    SHOP_AREA,
    SURFACE_AREA,
} from "./Area.js";
import { FightMonsterButton } from "./FightMonsterButton.js";
import { Image }          from "./Image.js";
import { Inventory }      from "./Inventory.js";
import { ItemExplanation } from "./ItemExplanation.js";
import { ItemTaking }     from "./ItemTaking.js";
import { ItemType }       from "./ItemType.js";
import { TakeItemButton } from "./TakeItemButton.js";
import { View }           from './View.js';

export interface MapState {
    coordinates: Coordinates;
    selectedCoordinates: Coordinates|null;
    exploreMode: boolean;
    takingRangeMeters: number|null;
}

export interface MapItemLabelVisual {
    angleDegrees: number;
    distanceInTiles: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
}

export interface ShopWallVisual {
    rotationDegrees: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
    scale: number;
}

export const DUNGEON_SOFT_TERRAINS = [
    "dungeon moonwell water",
    "dungeon wet floor",
    "dungeon sand floor",
    "dungeon fungal floor",
    "dungeon bone floor",
    "dungeon bazaar floor",
    "dungeon forge floor",
    "dungeon chapel floor",
    "dungeon web floor",
    "dungeon moss floor",
    "dungeon crystal floor",
] as const;

export type DungeonSoftTerrain = typeof DUNGEON_SOFT_TERRAINS[number];

export interface DungeonSoftTerrainVisual {
    diameterInTiles: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
    rotationDegrees: number;
    opacity: number;
}

export class Map {
    slidingAnimationInProgress: boolean = false;
    interactionLocked: boolean = false;
    private catFacingX = 1;
    private focusedLabelItemName: string|null = null;
    private catVisualState: {
        rotation: number;
        dimension: number;
        mirror: number;
    }|null = null;
    private visibleDungeonWalls: Record<string, boolean> = {};

    map: HTMLDivElement;
    messageBox: HTMLDivElement;
    cols: number;
    rows: number;
    inventory: Inventory;
    private readonly state: MapState;
    tile_size: number;
    private readonly onCellSelected: (coordinates: Coordinates) => void;
    private readonly onExploreMoveRequested: (coordinates: Coordinates) => void;
    private readonly onInteractionUnlocked: () => void;
    private dragState: {
        pointerId: number;
        startX: number;
        startY: number;
        active: boolean;
        targetCell: HTMLDivElement|null;
    }|null = null;
    private suppressNextCellClick = false;

    private static readonly PLAYER_DRAG_THRESHOLD_PIXELS = 8;

    static coordinatesAtCell(
        center: Coordinates,
        column: number,
        row: number,
        columns: number,
        rows: number,
    ): Coordinates {
        return new Coordinates(
            center.latitude + (rows + 1) / 2 - row,
            center.longitude + column - (columns + 1) / 2,
        );
    }

    static offsetForMovement(
        previousCoordinates: Coordinates,
        currentCoordinates: Coordinates,
    ): { x: number; y: number } {
        return {
            x: currentCoordinates.longitude - previousCoordinates.longitude,
            y: previousCoordinates.latitude - currentCoordinates.latitude,
        };
    }

    static interactionCoordinates(state: MapState): Coordinates|null {
        if (state.selectedCoordinates !== null) {
            return state.selectedCoordinates;
        }
        if (state.exploreMode || state.takingRangeMeters !== null) {
            return state.coordinates;
        }

        return null;
    }

    constructor(
        map: HTMLDivElement,
        messageBox: HTMLDivElement,
        cols: number,
        rows: number,
        inventory: Inventory,
        state: MapState,
        tile_size: number,
        onCellSelected: (coordinates: Coordinates) => void,
        onExploreMoveRequested: (coordinates: Coordinates) => void,
        onInteractionUnlocked: () => void,
    ) {
        this.map = map;
        this.messageBox = messageBox;
        this.cols = cols;
        this.rows = rows;
        this.inventory = inventory;
        this.state = state;
        this.tile_size = tile_size;
        this.onCellSelected = onCellSelected;
        this.onExploreMoveRequested = onExploreMoveRequested;
        this.onInteractionUnlocked = onInteractionUnlocked;
    }

    // Redraws map.
    show({
        previousCoordinates = null,
    }: {
        previousCoordinates?: Coordinates|null,
    } ) {
        // updateRealWorldMap(latitude, longitude);
        if (previousCoordinates !== null) {
            const horizontalMovement = this.state.coordinates.longitude
                - previousCoordinates.longitude;
            if (horizontalMovement !== 0) {
                this.catFacingX = horizontalMovement > 0 ? 1 : -1;
            }
        }

        const areaId = this.inventory.getAreaId();
        const dungeonMapExtraSize = 10;
        const dungeonMap = areaId === DUNGEON_AREA
            ? DungeonMap.forViewport(
                this.cols,
                this.rows,
                this.state.coordinates,
                dungeonMapExtraSize,
            )
            : null;
        this.visibleDungeonWalls = {};

        // Set map background.
        let style = "";
        if (areaId === SURFACE_AREA) {
            style = "background-image: url(images/seamless-sand-light-beach-square-texture-39125213.jpg);";
        } else if (areaId === SHOP_AREA) {
            style = "background-image: url(images/dirt2.png);";
        } else if (areaId === HIGHLAND_AREA) {
            style = "background-color:#263126;"
                + "background-image:url(images/highland-jungle-floor-medieval-photoreal-v1.png);";
        } else {
            style = "background-image: url(images/dirt2.png);";
        }
        this.map.setAttribute("style", style);

        // Inventory is the default whenever the selected location has no action.
        EncounterCard.clear();
        this.setStatusMessage(this.progressStatusElement());

        this.map.innerHTML = "";
        for (let y = 1; y <= this.rows; y++) {
            for (let x = 1; x <= this.cols; x++) {
                const cell_coordinates = Map.coordinatesAtCell(
                    this.state.coordinates,
                    x,
                    y,
                    this.cols,
                    this.rows,
                );
                const seed = cell_coordinates.getSeed();
                const surfaceRiver = areaId === SURFACE_AREA
                    ? SurfaceMap.riverAt(cell_coordinates)
                    : null;
                const surfaceRoad = areaId === SURFACE_AREA
                    ? SurfaceMap.roadAt(cell_coordinates)
                    : null;
                const surfaceForest = areaId === SURFACE_AREA
                    ? SurfaceMap.forestAt(cell_coordinates)
                    : null;
                const surfaceItem = areaId === SURFACE_AREA
                    ? SurfaceMap.itemAt(cell_coordinates)
                    : null;
                const surfaceMilestone = areaId === SURFACE_AREA
                    ? SurfaceMap.milestoneAt(cell_coordinates)
                    : false;
                const surfaceCrossing = areaId === SURFACE_AREA
                    ? SurfaceMap.crossingAt(
                        cell_coordinates,
                        surfaceRoad,
                        surfaceRiver,
                    )
                    : null;

                let div = this.getCellElement(x, y, cell_coordinates);

                const hasWall = dungeonMap === null
                    ? this.isWallAt(cell_coordinates, areaId)
                    : Boolean(
                        dungeonMap.map[y + dungeonMapExtraSize]?.[
                            x + dungeonMapExtraSize
                        ],
                    );
                if (areaId === DUNGEON_AREA) {
                    this.visibleDungeonWalls[
                        Map.coordinatesKey(cell_coordinates)
                    ] = hasWall;
                }
                if (areaId === DUNGEON_AREA) {
                    const feature = DungeonMap.featureAt(cell_coordinates);
                    if (feature !== null) {
                        div.classList.add(
                            "dungeon-feature",
                            "dungeon-feature--"
                                + feature.kind.replace(/ /g, "-"),
                        );
                        div.dataset.dungeonArea =
                            DungeonMap.featureTitleAt(cell_coordinates) ?? "";
                    }
                    if (hasWall) {
                        div.append(Image.getWithItemTypeName("road", this.tile_size, seed).element());
                        div.append(Image.getWithItemTypeName("dungeon wall", this.tile_size, seed).element());
                    } else {
                        const terrain = DungeonMap.terrainAt(cell_coordinates);
                        if (Map.isDungeonSoftTerrain(terrain)) {
                            this.decorateDungeonSoftTerrainCell(
                                div,
                                cell_coordinates,
                                terrain,
                            );
                        } else {
                            div.append(Image.getWithItemTypeName(
                                terrain,
                                this.tile_size,
                                seed,
                            ).element());
                        }
                        const decoration = DungeonMap.decorationAt(
                            cell_coordinates,
                        );
                        if (decoration !== null) {
                            const decorationElement =
                                Image.getWithItemTypeName(
                                    decoration,
                                    this.tile_size,
                                    seed,
                                ).element();
                            decorationElement.classList.add(
                                "dungeon-decoration",
                            );
                            div.append(decorationElement);
                        }
                    }
                } else if (areaId === SHOP_AREA) {
                    const outside = ShopMap.isOutside(cell_coordinates);
                    if (outside) {
                        div.classList.add("shop-outside");
                        div.append(
                            Image.getWithItemTypeName(
                                "shop outside grass",
                                this.tile_size,
                                seed,
                            ).element(),
                        );
                        const decoration = Map.shopOutsideDecoration(seed);
                        if (decoration !== null) {
                            const decorationImage = Image.getWithItemTypeName(
                                decoration,
                                this.tile_size,
                                seed,
                            ).element();
                            decorationImage.classList.add(
                                "shop-outside-decoration",
                            );
                            div.append(decorationImage);
                        }
                    } else {
                        div.classList.add("shop-indoor");
                        if (hasWall) {
                            this.decorateShopWallCell(
                                div,
                                cell_coordinates,
                            );
                        } else {
                            const floor = Image.getWithItemTypeName(
                                "shop floor",
                                this.tile_size,
                                seed,
                            ).element();
                            floor.classList.add("shop-floor");
                            div.append(floor);
                            const decoration = ShopMap.decorationAt(cell_coordinates);
                            if (decoration !== null) {
                                div.append(Image.getWithItemTypeName(decoration, this.tile_size, seed).element());
                            }
                        }
                    }
                } else if (areaId === HIGHLAND_AREA) {
                    const castle = HighlandMap.castleAt(cell_coordinates);
                    if (castle !== null) {
                        div.classList.add("highland-castle");
                        div.dataset.highlandArea =
                            HighlandMap.castleTitleAt(cell_coordinates) ?? "";
                    }
                    div.append(Image.getWithItemTypeName(
                        HighlandMap.terrainAt(cell_coordinates),
                        this.tile_size,
                        seed,
                    ).element());
                    const decoration = HighlandMap.decorationAt(
                        cell_coordinates,
                    );
                    if (decoration !== null) {
                        const decorationElement = Image.getWithItemTypeName(
                            decoration,
                            this.tile_size,
                            seed,
                        ).element();
                        decorationElement.classList.add(
                            "highland-decoration",
                        );
                        div.append(decorationElement);
                    }
                } else {
                    if (surfaceRiver !== null) {
                        this.decorateRiverCell(
                            div,
                            cell_coordinates,
                            surfaceRiver,
                        );
                    }
                    let roadVisual: SurfaceRoadVisual|null = null;
                    if (surfaceRoad !== null) {
                        roadVisual = this.decorateRoadCell(
                            div,
                            cell_coordinates,
                            surfaceRoad,
                        );
                    }
                    if (surfaceRiver === null && surfaceRoad === null) {
                        // Sand.
                        div.append(Image.getWithItemTypeName('sand', this.tile_size, seed).element());

                        // Grass.
                        div.append(Image.getWithItemTypeName('grass', this.tile_size, seed).element());

                        if (
                            surfaceForest !== null
                            && SurfaceMap.hasForestMossAt(
                                cell_coordinates,
                                surfaceForest,
                                surfaceRiver,
                                surfaceRoad,
                            )
                        ) {
                            this.decorateForestMoss(
                                div,
                                cell_coordinates,
                                surfaceForest,
                            );
                        }

                        if (surfaceItem === null && !surfaceMilestone) {
                            const forestTree = SurfaceMap.hasForestTreeAt(
                                cell_coordinates,
                                surfaceForest,
                            );
                            // Tree.
                            if (forestTree && surfaceForest !== null) {
                                const visual = SurfaceMap.forestTreeVisualAt(
                                    cell_coordinates,
                                    surfaceForest,
                                );
                                const forestImage = Image.getWithItemTypeName(
                                    "forest",
                                    this.tile_size,
                                    visual.imageSeed,
                                );
                                forestImage.dimension *= visual.sizeMultiplier;
                                const tree = forestImage.element();
                                const offsetX = visual.offsetXInTiles
                                    * this.tile_size;
                                const offsetY = visual.offsetYInTiles
                                    * this.tile_size;
                                tree.style.marginLeft = (
                                    Number.parseFloat(tree.style.marginLeft)
                                    + offsetX
                                ) + "px";
                                tree.style.marginTop = (
                                    Number.parseFloat(tree.style.marginTop)
                                    + offsetY
                                ) + "px";
                                tree.style.setProperty(
                                    "--item-mirror",
                                    String(visual.mirrorX),
                                );
                                tree.classList.add("surface-forest-tree");
                                div.append(tree);
                            } else if (SurfaceMap.hasScatteredTreeAt(
                                cell_coordinates,
                                surfaceRiver,
                                surfaceRoad,
                            )) {
                                div.append(Image.getWithItemTypeName(
                                    "tree",
                                    this.tile_size,
                                    seed,
                                ).element());
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
                    } else if (roadVisual !== null) {
                        this.decorateRoadGrass(
                            div,
                            seed,
                            roadVisual,
                        );
                        if (!(seed % 99)) {
                            div.append(Image.getWithItemTypeName(
                                "cloud",
                                this.tile_size,
                                seed,
                            ).element());
                        }
                    }
                    if (surfaceCrossing !== null) {
                        div.classList.add(
                            "surface-road-crossing",
                            "surface-road-crossing--"
                                + surfaceCrossing.kind,
                        );
                        if (surfaceCrossing.bridgeAnchor) {
                            const bridge = Image.getWithItemTypeName(
                                "surface road bridge",
                                this.tile_size,
                                seed,
                            ).element();
                            bridge.classList.add("surface-road-bridge");
                            bridge.style.transform = "rotate("
                                + surfaceCrossing.rotationDegrees
                                + "deg)";
                            div.append(bridge);
                        }
                    }
                    if (surfaceMilestone) {
                        const milestone = Image.getWithItemTypeName(
                            "surface road milestone",
                            this.tile_size,
                            seed,
                        ).element();
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
                    && !dungeonMap.allowsItemAt(
                        x + dungeonMapExtraSize,
                        y + dungeonMapExtraSize,
                        itemType,
                    )
                ) {
                    itemType = null;
                }
                if (areaId === HIGHLAND_AREA
                    && itemType !== null
                    && !HighlandMap.allowsItemAt(
                        cell_coordinates,
                        itemType,
                    )
                ) {
                    itemType = null;
                }
                if (areaId === SHOP_AREA
                    && itemType?.name.startsWith("cat ")
                    && (
                        shopOutside
                        || ShopMap.isBesideWall(cell_coordinates)
                    )
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

                    // Summary.
                    item_taking_summary = new ItemTaking(itemType, this.inventory).summary();
                    takeable = !item_taking_summary.isUnavailable();

                    const itemElement = Image.getWithItemTypeName(
                        itemType.name,
                        this.tile_size,
                        seed,
                        isTaken,
                        takeable,
                    ).element();
                    itemElement.classList.add("collectible");
                    div.append(itemElement);
                    if (isTaken === false) {
                        this.decorateItemLabel(
                            div,
                            itemType.name,
                            cell_coordinates,
                            x,
                            y,
                            takeable === false,
                        );
                    }
                }

                // If a location has been selected and it is the current location.
                const selected_coordinates = Map.interactionCoordinates(
                    this.state,
                );
                if (selected_coordinates !== null && cell_coordinates.equals(selected_coordinates)) {
                    div.classList.add("selected");
                    if (itemType !== null) {
                        div.classList.add("selected-item");
                    }

                    // Show "take"-button if item has not been taken.
                    if (isTaken === false
                        && item_taking_summary !== null  // to satisfy ts compiler
                        && itemType !== null             // to satisfy ts compiler
                    ) {
                        if (this.isWithinTakingRange(
                            selected_coordinates,
                            itemType,
                        )) {
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
                            this.setStatusMessage(actionButton);
                        } else {
                            const isEncounter = itemType.isMonster()
                                || itemType.name.startsWith("cat ")
                                || itemType.name.startsWith(
                                    "magician selling ",
                                );
                            const identity = isEncounter
                                ? EncounterText.for(
                                    itemType.name,
                                    selected_coordinates.latitude,
                                    selected_coordinates.longitude,
                                )
                                : null;
                            if (identity !== null) {
                                EncounterCard.show(
                                    identity.description,
                                    itemType.isMonster()
                                        ? ItemExplanation.element(
                                            itemType.name,
                                            selected_coordinates.latitude,
                                            selected_coordinates.longitude,
                                            areaId,
                                        )
                                        : "",
                                    itemType.isMonster()
                                        ? ItemExplanation.displayName(itemType.name)
                                        : "",
                                );
                            } else {
                                EncounterCard.showItem(
                                    itemType.name,
                                    {
                                        latitude:
                                            selected_coordinates.latitude,
                                        longitude:
                                            selected_coordinates.longitude,
                                        areaId,
                                    },
                                    null,
                                    this.inventory.countItems(itemType),
                                );
                            }
                            const catMerchant = itemType.name.startsWith(
                                "cat ",
                            );
                            const merchantAction =
                                item_taking_summary.getTakeButtonText();
                            const action = catMerchant
                                ? (
                                    merchantAction.buttonText.toLowerCase()
                                    + merchantAction.additionalText.split(
                                        ".",
                                        1,
                                    )[0]
                                ).replace(/\.$/, "")
                                : itemType.name.startsWith(
                                    "magician selling ",
                                )
                                    ? "buy a spell"
                                    : "take this " + itemType.name;
                            this.setStatusMessage(
                                itemType.isMonster()
                                    ? "Walk closer to capture "
                                        + View.getQuantityText(itemType.name, 1)
                                        + "."
                                    : (identity === null
                                        ? ""
                                        : identity.name + " — ")
                                        + "Walk closer to " + action + ".",
                            );
                        }
                    }
                }
                
                // Current location.
                if (x === (this.cols + 1) / 2 && y === (this.rows + 1) / 2) {
                    div.classList.add("player-cell");
                    // Cat.
                    const catImage = Image.getWithItemTypeName("cat", this.tile_size, seed);
                    const cat = catImage.element();
                    cat.style.setProperty("--item-mirror", String(this.catFacingX));
                    this.animateCatVisual(cat, catImage);
                    div.append(cat);
                    this.bindPlayerDragging(div, cat);
                }

                this.map.append(div);
            }
        }

        // Opening an encounter card while its cell is being built focuses item
        // labels before that cell has been attached to the map. Reapply the
        // focus after every cell exists so the clicked item is included too.
        this.focusItemLabels(this.focusedLabelItemName);

        // Map is moved - slide it.
        if (previousCoordinates !== null) {
            this.slide({ previous_coordinates: previousCoordinates, tile_size: this.tile_size });
        }
    }

    static progressItemReferences(
        text: string,
    ): { start: number; length: number; itemName: string }[] {
        const candidates: {
            start: number;
            length: number;
            itemName: string;
        }[] = [];
        const lowerText = text.toLowerCase();
        for (const itemName of ItemType.allNames()) {
            const plural = View.getQuantityText(itemName, 2).replace(
                /^2\s+/,
                "",
            );
            const labels = Array.from(new Set([
                itemName,
                plural,
                ...(itemName === "yarrow" ? ["yarrows"] : []),
            ]));
            for (const label of labels) {
                let searchFrom = 0;
                while (searchFrom < lowerText.length) {
                    const start = lowerText.indexOf(label, searchFrom);
                    if (start < 0) {
                        break;
                    }
                    const before = lowerText[start - 1] ?? "";
                    const after = lowerText[start + label.length] ?? "";
                    if (
                        !/[a-z]/.test(before)
                        && !/[a-z]/.test(after)
                    ) {
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
        candidates.sort((first, second) =>
            first.start - second.start
                || second.length - first.length
                || (first.itemName < second.itemName ? -1 : 1)
        );
        const references: typeof candidates = [];
        for (const candidate of candidates) {
            const previous = references[references.length - 1];
            if (
                previous === undefined
                || candidate.start >= previous.start + previous.length
            ) {
                references.push(candidate);
            }
        }

        return references;
    }

    static itemLabelVisualAt(
        itemName: string,
        coordinates: Coordinates,
    ): MapItemLabelVisual {
        const angleDegrees = Map.itemLabelSeed(
            itemName,
            coordinates,
            0x4d617041,
        ) % 360;
        const distanceInTiles = 1.05 + Map.itemLabelSeed(
            itemName,
            coordinates,
            0x4d617044,
        ) % 31 / 100;
        const angle = angleDegrees * Math.PI / 180;

        return {
            angleDegrees,
            distanceInTiles,
            offsetXInTiles: Math.cos(angle) * distanceInTiles,
            offsetYInTiles: Math.sin(angle) * distanceInTiles,
        };
    }

    static shopWallVisualAt(coordinates: Coordinates): ShopWallVisual {
        return {
            rotationDegrees: (
                Map.shopWallSeed(coordinates, 0x57616c52) % 81 - 40
            ) / 10,
            offsetXInTiles: (
                Map.shopWallSeed(coordinates, 0x57616c58) % 7 - 3
            ) / 100,
            offsetYInTiles: (
                Map.shopWallSeed(coordinates, 0x57616c59) % 7 - 3
            ) / 100,
            // The minimum oversize covers the furthest corner exposed by the
            // allowed rotation and movement, so adjoining pieces stay joined.
            scale: (
                114 + Map.shopWallSeed(coordinates, 0x57616c53) % 9
            ) / 100,
        };
    }

    static dungeonSoftTerrainVisualAt(
        terrain: DungeonSoftTerrain,
        coordinates: Coordinates,
    ): DungeonSoftTerrainVisual {
        const minimumOpacity: Readonly<Record<DungeonSoftTerrain, number>> = {
            "dungeon moonwell water": 68,
            "dungeon wet floor": 62,
            "dungeon sand floor": 50,
            "dungeon fungal floor": 48,
            "dungeon bone floor": 48,
            "dungeon bazaar floor": 42,
            "dungeon forge floor": 50,
            "dungeon chapel floor": 48,
            "dungeon web floor": 50,
            "dungeon moss floor": 48,
            "dungeon crystal floor": 50,
        };

        return {
            diameterInTiles: (
                280 + Map.dungeonSoftTerrainSeed(
                    terrain,
                    coordinates,
                    0x54657253,
                ) % 121
            ) / 100,
            offsetXInTiles: (
                Map.dungeonSoftTerrainSeed(
                    terrain,
                    coordinates,
                    0x54657258,
                ) % 61 - 30
            ) / 100,
            offsetYInTiles: (
                Map.dungeonSoftTerrainSeed(
                    terrain,
                    coordinates,
                    0x54657259,
                ) % 61 - 30
            ) / 100,
            rotationDegrees: Map.dungeonSoftTerrainSeed(
                terrain,
                coordinates,
                0x54657252,
            ) % 360,
            opacity: (
                minimumOpacity[terrain]
                + Map.dungeonSoftTerrainSeed(
                    terrain,
                    coordinates,
                    0x5465724f,
                ) % 13
            ) / 100,
        };
    }

    private static dungeonSoftTerrainSeed(
        terrain: DungeonSoftTerrain,
        coordinates: Coordinates,
        salt: number,
    ): number {
        let hash = salt >>> 0;
        hash ^= Math.imul(coordinates.latitude | 0, 0x85ebca6b);
        hash ^= Math.imul(coordinates.longitude | 0, 0xc2b2ae35);
        for (let index = 0; index < terrain.length; index++) {
            hash ^= terrain.charCodeAt(index);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b) >>> 0;
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    private static shopWallSeed(
        coordinates: Coordinates,
        salt: number,
    ): number {
        let hash = salt >>> 0;
        hash ^= Math.imul(coordinates.latitude | 0, 0x85ebca6b);
        hash ^= Math.imul(coordinates.longitude | 0, 0xc2b2ae35);
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b) >>> 0;
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    private static itemLabelSeed(
        itemName: string,
        coordinates: Coordinates,
        salt: number,
    ): number {
        let hash = salt >>> 0;
        hash ^= Math.imul(coordinates.latitude | 0, 0x85ebca6b);
        hash ^= Math.imul(coordinates.longitude | 0, 0xc2b2ae35);
        for (let index = 0; index < itemName.length; index++) {
            hash ^= itemName.charCodeAt(index);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;

        return hash >>> 0;
    }

    private decorateItemLabel(
        cell: HTMLDivElement,
        itemName: string,
        coordinates: Coordinates,
        column: number,
        row: number,
        disabled: boolean,
    ): void {
        const viewportWidth = this.map.parentElement?.clientWidth
            ?? this.cols * this.tile_size;
        const viewportHeight = this.map.parentElement?.clientHeight
            ?? this.rows * this.tile_size;
        const hiddenColumns = Math.max(
            0,
            (this.cols - viewportWidth / this.tile_size) / 2,
        );
        const hiddenRows = Math.max(
            0,
            (this.rows - viewportHeight / this.tile_size) / 2,
        );
        const firstVisibleColumn = Math.ceil(hiddenColumns + .5);
        const lastVisibleColumn = Math.floor(
            hiddenColumns + viewportWidth / this.tile_size + .5,
        );
        const firstVisibleRow = Math.ceil(hiddenRows + .5);
        const lastVisibleRow = Math.floor(
            hiddenRows + viewportHeight / this.tile_size + .5,
        );
        if (
            column < firstVisibleColumn
            || column > lastVisibleColumn
            || row < firstVisibleRow
            || row > lastVisibleRow
        ) {
            return;
        }
        const visual = Map.itemLabelVisualAt(itemName, coordinates);
        const edgeBuffer = 3;
        let offsetX = visual.offsetXInTiles;
        let offsetY = visual.offsetYInTiles;
        if (column < firstVisibleColumn + edgeBuffer) {
            offsetX = Math.abs(offsetX);
        } else if (column > lastVisibleColumn - edgeBuffer) {
            offsetX = -Math.abs(offsetX);
        }
        if (row < firstVisibleRow + edgeBuffer) {
            offsetY = Math.abs(offsetY);
        } else if (row > lastVisibleRow - edgeBuffer) {
            offsetY = -Math.abs(offsetY);
        }
        const angleDegrees = (
            Math.atan2(offsetY, offsetX) * 180 / Math.PI + 360
        ) % 360;
        const distance = visual.distanceInTiles * this.tile_size;
        const label = document.createElement("span");
        label.className = "map-item-label";
        label.dataset.itemName = itemName;
        label.classList.toggle(
            "map-item-label--item-focus",
            itemName === this.focusedLabelItemName,
        );
        if (disabled) {
            label.classList.add("map-item-label--disabled");
        }
        label.setAttribute("aria-hidden", "true");
        label.style.setProperty(
            "--map-item-label-angle",
            angleDegrees + "deg",
        );
        label.style.setProperty(
            "--map-item-label-distance",
            distance + "px",
        );
        label.style.setProperty(
            "--map-item-label-x",
            offsetX * this.tile_size + "px",
        );
        label.style.setProperty(
            "--map-item-label-y",
            offsetY * this.tile_size + "px",
        );
        const arrow = document.createElement("span");
        arrow.className = "map-item-label-arrow";
        const text = document.createElement("span");
        text.className = "map-item-label-text";
        text.textContent = ItemExplanation.displayName(itemName);
        label.append(arrow, text);
        cell.classList.add("map-item-labelled");
        cell.append(label);
    }

    private progressStatusElement(): HTMLDivElement {
        const text = this.inventory.getText();
        const status = document.createElement("div");
        status.className = "message status-text";
        status.title = text;
        this.appendLinkedItemText(status, text);

        return status;
    }

    setStatusMessage(message: string|HTMLDivElement): void {
        View.setMessage(this.messageBox, message);
        const content = this.messageBox.querySelector<HTMLDivElement>(
            ".message",
        );
        if (content !== null) {
            this.linkItemNamesInElement(content);
        }
    }

    private linkItemNamesInElement(element: HTMLElement): void {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
        );
        const textNodes: Text[] = [];
        let current = walker.nextNode();
        while (current !== null) {
            const parent = current.parentElement;
            if (current instanceof Text
                && parent !== null
                && !parent.closest(
                    "button, input, select, option, a, .status-item-link",
                )
                && Map.progressItemReferences(current.data).length > 0
            ) {
                textNodes.push(current);
            }
            current = walker.nextNode();
        }
        for (const textNode of textNodes) {
            const fragment = document.createDocumentFragment();
            this.appendLinkedItemText(fragment, textNode.data);
            textNode.replaceWith(fragment);
        }
    }

    private appendLinkedItemText(
        container: HTMLElement|DocumentFragment,
        text: string,
    ): void {
        const references = Map.progressItemReferences(text);
        let position = 0;
        for (const reference of references) {
            container.append(document.createTextNode(
                text.slice(position, reference.start),
            ));
            const button = document.createElement("button");
            button.type = "button";
            button.className = "status-item-link";
            button.dataset.itemName = reference.itemName;
            button.setAttribute("aria-controls", EncounterCard.ID);
            button.setAttribute("aria-expanded", "false");
            button.textContent = text.slice(
                reference.start,
                reference.start + reference.length,
            );
            button.setAttribute(
                "aria-label",
                "View details for "
                    + ItemExplanation.displayName(reference.itemName),
            );
            button.onclick = () => EncounterCard.showItem(
                reference.itemName,
                {
                    latitude: this.state.coordinates.latitude,
                    longitude: this.state.coordinates.longitude,
                    areaId: this.inventory.getAreaId(),
                },
                button,
                this.inventory.countItems(
                    new ItemType(reference.itemName),
                ),
            );
            container.append(button);
            position = reference.start + reference.length;
        }
        container.append(document.createTextNode(text.slice(position)));
    }

    focusItemLabels(itemName: string|null): void {
        this.focusedLabelItemName = itemName;
        this.map.parentElement?.classList.toggle(
            "map-labels-item-focus",
            itemName !== null,
        );
        this.map.querySelectorAll<HTMLElement>(".map-item-label").forEach(
            label => {
                label.classList.toggle(
                    "map-item-label--item-focus",
                    itemName !== null && label.dataset.itemName === itemName,
                );
            },
        );
    }

    private animateCatVisual(cat: HTMLImageElement, image: Image): void {
        const nextState = {
            rotation: image.rotate,
            dimension: image.dimension,
            mirror: this.catFacingX,
        };
        const previousState = this.catVisualState;
        this.catVisualState = nextState;
        if (previousState === null
            || window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
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

    isWithinTakingRange(
        coordinates: Coordinates,
        itemType: ItemType,
    ): boolean {
        if (!this.state.exploreMode && this.state.takingRangeMeters === null) {
            return false;
        }

        const maximumDistance = itemType.changesArea()
            ? 0
            : ITEM_TAKING_RANGE;

        return this.state.coordinates.distanceFrom(coordinates)
            <= maximumDistance;
    }

    isWallAt(coordinates: Coordinates, areaId = this.inventory.getAreaId()): boolean {
        if (areaId === DUNGEON_AREA) {
            const visibleWall = this.visibleDungeonWalls[
                Map.coordinatesKey(coordinates)
            ];
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

    private static coordinatesKey(coordinates: Coordinates): string {
        return coordinates.latitude + "," + coordinates.longitude;
    }

    private decorateDungeonSoftTerrainCell(
        div: HTMLDivElement,
        coordinates: Coordinates,
        terrain: DungeonSoftTerrain,
    ): void {
        const variants: Readonly<Record<typeof terrain, string>> = {
            "dungeon moonwell water": "deep",
            "dungeon wet floor": "shallow",
            "dungeon sand floor": "sand",
            "dungeon fungal floor": "fungal",
            "dungeon bone floor": "bone",
            "dungeon bazaar floor": "bazaar",
            "dungeon forge floor": "forge",
            "dungeon chapel floor": "chapel-soil",
            "dungeon web floor": "spider-soil",
            "dungeon moss floor": "moss",
            "dungeon crystal floor": "crystal",
        };
        const visual = Map.dungeonSoftTerrainVisualAt(
            terrain,
            coordinates,
        );
        const patch = document.createElement("span");
        patch.className = "dungeon-soft-terrain-patch "
            + "dungeon-soft-terrain-patch--" + variants[terrain];
        const textureCells = terrain !== "dungeon moonwell water"
            && terrain !== "dungeon wet floor"
            ? 8
            : 10;
        const textureSize = this.tile_size * textureCells;
        const diameter = this.tile_size * visual.diameterInTiles;
        const inset = (diameter - this.tile_size) / 2;
        patch.style.width = diameter + "px";
        patch.style.height = diameter + "px";
        patch.style.marginLeft = -inset + "px";
        patch.style.marginTop = -inset + "px";
        patch.style.opacity = String(visual.opacity);
        patch.style.transform = "translate("
            + visual.offsetXInTiles * this.tile_size + "px, "
            + visual.offsetYInTiles * this.tile_size + "px) rotate("
            + visual.rotationDegrees + "deg)";
        patch.style.backgroundSize =
            textureSize + "px " + textureSize + "px";
        patch.style.backgroundPosition =
            (
                -Map.positiveModulo(
                    coordinates.longitude,
                    textureCells,
                ) * this.tile_size + inset
            ) + "px "
            + (
                Map.positiveModulo(
                    coordinates.latitude,
                    textureCells,
                ) * this.tile_size + inset
            ) + "px";
        patch.setAttribute("aria-hidden", "true");
        div.append(patch);
    }

    private static isDungeonSoftTerrain(
        terrain: string,
    ): terrain is DungeonSoftTerrain {
        return DUNGEON_SOFT_TERRAINS.some(value => value === terrain);
    }

    private decorateRiverCell(
        div: HTMLDivElement,
        coordinates: Coordinates,
        river: SurfaceRiverCell,
    ): void {
        div.classList.add(
            "surface-river",
            "surface-river--" + river.channel,
        );
        div.dataset.riverSystem = String(river.systemId);
        const visual = SurfaceMap.riverVisualAt(coordinates, river);
        const diameter = visual.diameterInTiles * this.tile_size;
        const inset = (diameter - this.tile_size) / 2;
        const textureSize = this.tile_size * 8;
        div.style.setProperty("--surface-river-size", diameter + "px");
        div.style.setProperty(
            "--surface-river-rotation",
            visual.rotationDegrees + "deg",
        );
        div.style.setProperty(
            "--surface-river-texture-size",
            textureSize + "px",
        );
        div.style.setProperty(
            "--surface-river-texture-position",
            visual.textureOffsetXInTiles * this.tile_size + inset + "px "
                + (visual.textureOffsetYInTiles * this.tile_size + inset)
                + "px",
        );
    }

    private decorateShopWallCell(
        div: HTMLDivElement,
        coordinates: Coordinates,
    ): void {
        const textureCells = 8;
        const visual = Map.shopWallVisualAt(coordinates);
        div.classList.add("shop-wall");
        div.style.setProperty(
            "--shop-wall-offset-x",
            visual.offsetXInTiles * this.tile_size + "px",
        );
        div.style.setProperty(
            "--shop-wall-offset-y",
            visual.offsetYInTiles * this.tile_size + "px",
        );
        div.style.setProperty(
            "--shop-wall-rotation",
            visual.rotationDegrees + "deg",
        );
        div.style.setProperty("--shop-wall-scale", String(visual.scale));
        div.style.setProperty(
            "--shop-wall-texture-size",
            this.tile_size * textureCells + "px",
        );
        div.style.setProperty(
            "--shop-wall-texture-position",
            (
                -Map.positiveModulo(
                    coordinates.longitude,
                    textureCells,
                ) * this.tile_size + 1
            ) + "px "
            + (
                Map.positiveModulo(
                    coordinates.latitude,
                    textureCells,
                ) * this.tile_size + 1
            ) + "px",
        );
    }

    private decorateRoadCell(
        div: HTMLDivElement,
        coordinates: Coordinates,
        road: SurfaceRoadCell,
    ): SurfaceRoadVisual {
        div.classList.add(
            "surface-road",
            "surface-road--" + road.kind,
            "surface-road-surface--" + road.surface,
        );
        div.dataset.roadRoute = String(road.routeId);
        const visual = SurfaceMap.roadVisualAt(coordinates, road);
        const diameter = visual.diameterInTiles * this.tile_size;
        const inset = (diameter - this.tile_size) / 2;
        const textureSize = this.tile_size * visual.textureSizeInTiles;
        div.style.setProperty("--surface-road-size", diameter + "px");
        div.style.setProperty(
            "--surface-road-offset-x",
            visual.offsetXInTiles * this.tile_size + "px",
        );
        div.style.setProperty(
            "--surface-road-offset-y",
            visual.offsetYInTiles * this.tile_size + "px",
        );
        div.style.setProperty(
            "--surface-road-rotation",
            visual.rotationDegrees + "deg",
        );
        div.style.setProperty(
            "--surface-road-texture-size",
            textureSize + "px",
        );
        div.style.setProperty(
            "--surface-road-texture-position",
            visual.textureOffsetXInTiles * this.tile_size + inset + "px "
                + (visual.textureOffsetYInTiles * this.tile_size + inset)
                + "px",
        );
        if (road.kind === "path") {
            this.decoratePathPatches(div, coordinates, road, textureSize);
        }

        return visual;
    }

    private decoratePathPatches(
        div: HTMLDivElement,
        coordinates: Coordinates,
        road: SurfaceRoadCell,
        textureSize: number,
    ): void {
        for (
            const patch of SurfaceMap.pathPatchVisualsAt(coordinates, road)
        ) {
            const element = document.createElement("span");
            const diameter = patch.diameterInTiles * this.tile_size;
            const offsetX = patch.offsetXInTiles * this.tile_size;
            const offsetY = patch.offsetYInTiles * this.tile_size;
            const inset = (diameter - this.tile_size) / 2;
            element.className = "surface-path-patch";
            element.style.setProperty(
                "--surface-path-patch-size",
                diameter + "px",
            );
            element.style.setProperty(
                "--surface-path-patch-left",
                offsetX + "px",
            );
            element.style.setProperty(
                "--surface-path-patch-top",
                offsetY + "px",
            );
            element.style.setProperty(
                "--surface-path-patch-opacity",
                String(patch.opacity),
            );
            element.style.setProperty(
                "--surface-path-texture-size",
                textureSize + "px",
            );
            element.style.setProperty(
                "--surface-path-texture-position",
                -coordinates.longitude * this.tile_size
                    + inset - offsetX + "px "
                    + (
                        coordinates.latitude * this.tile_size
                        + inset - offsetY
                    ) + "px",
            );
            div.append(element);
        }
    }

    private decorateRoadGrass(
        div: HTMLDivElement,
        seed: number,
        visual: SurfaceRoadVisual,
    ): void {
        if (visual.grassOpacity <= 0) {
            return;
        }
        const grass = Image.getWithItemTypeName(
            "surface road grass",
            this.tile_size,
            seed,
        ).element();
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

    private decorateForestMoss(
        div: HTMLDivElement,
        coordinates: Coordinates,
        forest: SurfaceForestCell,
    ): void {
        const visual = SurfaceMap.forestMossVisualAt(coordinates, forest);
        const patch = document.createElement("span");
        const diameter = visual.diameterInTiles * this.tile_size;
        const textureSize = visual.textureSizeInTiles * this.tile_size;
        patch.className = "surface-forest-moss";
        patch.style.setProperty(
            "--surface-forest-moss-size",
            diameter + "px",
        );
        patch.style.setProperty(
            "--surface-forest-moss-offset-x",
            visual.offsetXInTiles * this.tile_size + "px",
        );
        patch.style.setProperty(
            "--surface-forest-moss-offset-y",
            visual.offsetYInTiles * this.tile_size + "px",
        );
        patch.style.setProperty(
            "--surface-forest-moss-rotation",
            visual.rotationDegrees + "deg",
        );
        patch.style.setProperty(
            "--surface-forest-moss-opacity",
            visual.opacity.toFixed(3),
        );
        patch.style.setProperty(
            "--surface-forest-moss-texture-size",
            textureSize + "px",
        );
        patch.style.setProperty(
            "--surface-forest-moss-texture-position",
            visual.textureOffsetXInTiles * this.tile_size + "px "
                + visual.textureOffsetYInTiles * this.tile_size + "px",
        );
        patch.setAttribute("aria-hidden", "true");
        div.append(patch);
    }

    private static positiveModulo(value: number, divisor: number): number {
        return ((value % divisor) + divisor) % divisor;
    }

    private static shopOutsideDecoration(seed: number): string|null {
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

    private static decorationSeed(seed: number, salt: number): number {
        let value = (seed >>> 0) ^ salt;
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d) >>> 0;
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b) >>> 0;
        value ^= value >>> 16;

        return value >>> 0;
    }

    setInteractionLocked(locked: boolean): void {
        this.interactionLocked = locked;
        if (!locked) {
            this.onInteractionUnlocked();
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
        const movementOffset = Map.offsetForMovement(
            previous_coordinates,
            this.state.coordinates,
        );
        const signedStepSizeX = tile_size / MAP_SLIDING_STEPS
            * movementOffset.x;
        const signedStepSizeY = tile_size / MAP_SLIDING_STEPS
            * movementOffset.y;
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
            signedStepSizeX,
            signedStepSizeY,
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
            const horizontalMargin = (MAP_SLIDING_STEPS - stepNumber)
                * signedStepSizeX;
            const verticalMargin = (MAP_SLIDING_STEPS - stepNumber)
                * signedStepSizeY;

            margins.mapLeft += horizontalMargin;
            margins.mapTop  += verticalMargin;
            margins.catLeft -= horizontalMargin;
            margins.catTop  -= verticalMargin;

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
        div.dataset.latitude = String(cell_coordinates.latitude);
        div.dataset.longitude = String(cell_coordinates.longitude);

        // Selecting and moving are separate: Explore movement is performed by
        // dragging the player, while a click or tap always inspects this cell.
        div.addEventListener("click", event => {
            if (this.suppressNextCellClick) {
                this.suppressNextCellClick = false;
                event.preventDefault();
                event.stopPropagation();

                return;
            }
            if (!this.slidingAnimationInProgress && !this.interactionLocked) {
                this.onCellSelected(cell_coordinates);
            }
        });

        return div;
    }

    private bindPlayerDragging(
        playerCell: HTMLDivElement,
        player: HTMLImageElement,
    ): void {
        // Images are natively draggable on desktop browsers. That drag can
        // take over the pointer before our movement threshold is reached.
        player.draggable = false;

        playerCell.addEventListener("pointerdown", event => {
            if (!this.state.exploreMode
                || this.slidingAnimationInProgress
                || this.interactionLocked
                || !event.isPrimary
                || event.button !== 0
                || event.target !== player
            ) {
                return;
            }

            this.suppressNextCellClick = false;
            this.dragState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                active: false,
                targetCell: playerCell,
            };
            try {
                playerCell.setPointerCapture(event.pointerId);
            } catch {
                // Synthetic pointer events used by browser tests do not own a
                // native pointer, so they cannot be captured.
            }
        });
        playerCell.addEventListener("pointermove", event => {
            const drag = this.dragState;
            if (drag === null || drag.pointerId !== event.pointerId) {
                return;
            }

            const offsetX = event.clientX - drag.startX;
            const offsetY = event.clientY - drag.startY;
            if (!drag.active
                && Math.hypot(offsetX, offsetY)
                    < Map.PLAYER_DRAG_THRESHOLD_PIXELS
            ) {
                return;
            }

            drag.active = true;
            player.style.translate = offsetX + "px " + offsetY + "px";
            player.classList.add("player-drag-preview");
            this.map.classList.add("player-dragging");
            this.setPlayerDragTarget(this.cellAtPoint(
                event.clientX,
                event.clientY,
            ));
            event.preventDefault();
        });
        playerCell.addEventListener("pointerup", event => {
            const drag = this.dragState;
            if (drag === null || drag.pointerId !== event.pointerId) {
                return;
            }

            if (!drag.active) {
                drag.active = Math.hypot(
                    event.clientX - drag.startX,
                    event.clientY - drag.startY,
                ) >= Map.PLAYER_DRAG_THRESHOLD_PIXELS;
            }
            if (drag.active) {
                this.setPlayerDragTarget(this.cellAtPoint(
                    event.clientX,
                    event.clientY,
                ));
            }
            const target = this.state.exploreMode
                && drag.active
                && drag.targetCell !== null
                ? Map.coordinatesFromCell(drag.targetCell)
                : null;
            this.suppressNextCellClick = drag.active;
            this.finishPlayerDrag(playerCell, player, event.pointerId);
            if (target !== null) {
                this.onExploreMoveRequested(target);
            }
            if (drag.active) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        playerCell.addEventListener("pointercancel", event => {
            if (this.dragState?.pointerId !== event.pointerId) {
                return;
            }

            this.suppressNextCellClick = false;
            this.finishPlayerDrag(playerCell, player, event.pointerId);
        });
    }

    private cellAtPoint(clientX: number, clientY: number): HTMLDivElement|null {
        const element = document.elementFromPoint(clientX, clientY);
        const cell = element?.closest(".cell");

        return cell instanceof HTMLDivElement && this.map.contains(cell)
            ? cell
            : null;
    }

    private setPlayerDragTarget(target: HTMLDivElement|null): void {
        const drag = this.dragState;
        if (drag === null || drag.targetCell === target) {
            return;
        }

        drag.targetCell?.classList.remove("player-drop-target");
        drag.targetCell = target;
        drag.targetCell?.classList.add("player-drop-target");
    }

    private finishPlayerDrag(
        playerCell: HTMLDivElement,
        player: HTMLImageElement,
        pointerId: number,
    ): void {
        this.dragState?.targetCell?.classList.remove("player-drop-target");
        this.dragState = null;
        player.style.removeProperty("translate");
        player.classList.remove("player-drag-preview");
        this.map.classList.remove("player-dragging");
        if (playerCell.hasPointerCapture(pointerId)) {
            playerCell.releasePointerCapture(pointerId);
        }
    }

    private static coordinatesFromCell(cell: HTMLDivElement): Coordinates|null {
        const latitude = Number(cell.dataset.latitude);
        const longitude = Number(cell.dataset.longitude);

        return Number.isFinite(latitude) && Number.isFinite(longitude)
            ? new Coordinates(latitude, longitude)
            : null;
    }
}
