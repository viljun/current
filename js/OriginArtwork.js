import { Coordinates } from "./Coordinates.js";
import { Image as GameImage } from "./Image.js";
import { HighlandMap } from "./HighlandMap.js";
import { ShopMap } from "./ShopMap.js";
import { SurfaceMap, } from "./SurfaceMap.js";
export class OriginArtwork {
    static containSubject(artwork, frameClassName) {
        const subject = artwork.querySelector(".origin-artwork-subject");
        if (subject === null) {
            return;
        }
        subject.style.setProperty("--origin-artwork-subject-width", subject.style.width);
        subject.style.setProperty("--origin-artwork-subject-height", subject.style.height);
        const frame = document.createElement("div");
        frame.className = frameClassName;
        frame.append(subject);
        artwork.append(frame);
    }
    static create(itemName, origin, className) {
        const artwork = document.createElement("div");
        artwork.className = className + " origin-artwork";
        artwork.style.backgroundImage = origin.areaId === 0
            ? "url(images/seamless-sand-light-beach-square-texture-39125213.jpg)"
            : origin.areaId === 2
                ? "url(images/dirt2.png)"
                : origin.areaId === 3
                    ? "url(images/highland-jungle-floor-medieval-photoreal-v1.png)"
                    : "url(images/dirt2.png)";
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                const coordinates = new Coordinates(origin.latitude + x, origin.longitude + y);
                const seed = coordinates.getSeed();
                const cell = document.createElement("div");
                cell.className = "origin-artwork-cell";
                cell.style.setProperty("--origin-left", (x * 54 - 27) + "px");
                cell.style.setProperty("--origin-top", (y * 54 - 27) + "px");
                if (origin.areaId === 0) {
                    const river = SurfaceMap.riverAt(coordinates);
                    const road = SurfaceMap.roadAt(coordinates);
                    const milestone = SurfaceMap.milestoneAt(coordinates);
                    if (river !== null) {
                        const visual = SurfaceMap.riverVisualAt(coordinates, river);
                        const diameter = visual.diameterInTiles * 54;
                        const inset = (diameter - 54) / 2;
                        cell.classList.add("surface-river", "surface-river--" + river.channel);
                        cell.style.setProperty("--surface-river-size", diameter + "px");
                        cell.style.setProperty("--surface-river-rotation", visual.rotationDegrees + "deg");
                        cell.style.setProperty("--surface-river-texture-size", "432px");
                        cell.style.setProperty("--surface-river-texture-position", visual.textureOffsetXInTiles * 54 + inset + "px "
                            + (visual.textureOffsetYInTiles * 54
                                + inset) + "px");
                    }
                    let roadVisual = null;
                    if (road !== null) {
                        roadVisual = OriginArtwork.decorateRoadCell(cell, coordinates, road, 54);
                    }
                    if (river === null && road === null) {
                        cell.append(GameImage.getWithItemTypeName("sand", 54, seed).element(), GameImage.getWithItemTypeName("grass", 54, seed).element());
                        if (!milestone && !(seed % 21)) {
                            cell.append(GameImage.getWithItemTypeName("tree", 54, seed).element());
                        }
                        if (!milestone && !(seed % 997)) {
                            cell.append(GameImage.getWithItemTypeName("big rock", 54, seed).element());
                        }
                        if (!(seed % 99)) {
                            cell.append(GameImage.getWithItemTypeName("cloud", 54, seed).element());
                        }
                    }
                    else if (roadVisual !== null) {
                        OriginArtwork.decorateRoadGrass(cell, seed, roadVisual, 54);
                    }
                    const crossing = SurfaceMap.crossingAt(coordinates, road, river);
                    if (crossing !== null) {
                        cell.classList.add("surface-road-crossing", "surface-road-crossing--" + crossing.kind);
                        if (crossing.bridgeAnchor) {
                            const bridge = GameImage.getWithItemTypeName("surface road bridge", 54, seed).element();
                            bridge.classList.add("surface-road-bridge");
                            bridge.style.transform = "rotate("
                                + crossing.rotationDegrees
                                + "deg)";
                            cell.append(bridge);
                        }
                    }
                    if (milestone) {
                        const milestone = GameImage.getWithItemTypeName("surface road milestone", 54, seed).element();
                        milestone.classList.add("surface-road-milestone");
                        cell.append(milestone);
                    }
                }
                else if (origin.areaId === 1) {
                    cell.append(GameImage.getWithItemTypeName("dungeon floor", 54, seed).element());
                }
                else if (origin.areaId === 3) {
                    cell.append(GameImage.getWithItemTypeName(HighlandMap.terrainAt(coordinates), 54, seed).element());
                    const decoration = HighlandMap.decorationAt(coordinates);
                    if (decoration !== null) {
                        cell.append(GameImage.getWithItemTypeName(decoration, 54, seed).element());
                    }
                }
                else {
                    if (ShopMap.isOutside(coordinates)) {
                        cell.classList.add("shop-outside");
                        cell.append(GameImage.getWithItemTypeName("shop outside grass", 54, seed).element());
                    }
                    else {
                        cell.append(GameImage.getWithItemTypeName("shop floor", 54, seed).element());
                    }
                }
                if (x === 0 && y === 0) {
                    const subject = GameImage.getWithItemTypeName(itemName, 54, seed).element();
                    subject.classList.add("origin-artwork-subject");
                    cell.append(subject);
                }
                artwork.append(cell);
            }
        }
        return artwork;
    }
    static decorateRoadCell(cell, coordinates, road, tileSize) {
        cell.classList.add("surface-road", "surface-road--" + road.kind, "surface-road-surface--" + road.surface);
        const visual = SurfaceMap.roadVisualAt(coordinates, road);
        const diameter = visual.diameterInTiles * tileSize;
        const inset = (diameter - tileSize) / 2;
        const textureSize = tileSize * visual.textureSizeInTiles;
        cell.style.setProperty("--surface-road-size", diameter + "px");
        cell.style.setProperty("--surface-road-offset-x", visual.offsetXInTiles * tileSize + "px");
        cell.style.setProperty("--surface-road-offset-y", visual.offsetYInTiles * tileSize + "px");
        cell.style.setProperty("--surface-road-rotation", visual.rotationDegrees + "deg");
        cell.style.setProperty("--surface-road-texture-size", textureSize + "px");
        cell.style.setProperty("--surface-road-texture-position", visual.textureOffsetXInTiles * tileSize + inset + "px "
            + (visual.textureOffsetYInTiles * tileSize + inset)
            + "px");
        if (road.kind === "path") {
            OriginArtwork.decoratePathPatches(cell, coordinates, road, tileSize, textureSize);
        }
        return visual;
    }
    static decoratePathPatches(cell, coordinates, road, tileSize, textureSize) {
        for (const patch of SurfaceMap.pathPatchVisualsAt(coordinates, road)) {
            const element = document.createElement("span");
            const diameter = patch.diameterInTiles * tileSize;
            const offsetX = patch.offsetXInTiles * tileSize;
            const offsetY = patch.offsetYInTiles * tileSize;
            const inset = (diameter - tileSize) / 2;
            element.className = "surface-path-patch";
            element.style.setProperty("--surface-path-patch-size", diameter + "px");
            element.style.setProperty("--surface-path-patch-left", offsetX + "px");
            element.style.setProperty("--surface-path-patch-top", offsetY + "px");
            element.style.setProperty("--surface-path-patch-opacity", String(patch.opacity));
            element.style.setProperty("--surface-path-texture-size", textureSize + "px");
            element.style.setProperty("--surface-path-texture-position", -coordinates.latitude * tileSize
                + inset - offsetX + "px "
                + (-coordinates.longitude * tileSize
                    + inset - offsetY) + "px");
            cell.append(element);
        }
    }
    static decorateRoadGrass(cell, seed, visual, tileSize) {
        if (visual.grassOpacity <= 0) {
            return;
        }
        const grass = GameImage.getWithItemTypeName("surface road grass", tileSize, seed).element();
        const dimension = visual.grassSizeInTiles * tileSize;
        const margin = -(dimension - tileSize) / 2;
        grass.classList.add("surface-road-grass");
        grass.style.width = dimension + "px";
        grass.style.height = dimension + "px";
        grass.style.marginLeft = margin + "px";
        grass.style.marginTop = margin + "px";
        grass.style.opacity = String(visual.grassOpacity);
        grass.style.transform = "rotate("
            + visual.grassRotationDegrees
            + "deg)";
        cell.append(grass);
    }
}
