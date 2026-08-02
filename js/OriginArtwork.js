import { Coordinates } from "./Coordinates.js";
import { Image as GameImage } from "./Image.js";
import { ShopMap } from "./ShopMap.js";
export class OriginArtwork {
    static create(itemName, origin, className) {
        const artwork = document.createElement("div");
        artwork.className = className + " origin-artwork";
        artwork.style.backgroundImage = origin.areaId === 0
            ? "url(images/seamless-sand-light-beach-square-texture-39125213.jpg)"
            : origin.areaId === 2
                ? "url(images/dirt2.png)"
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
                    cell.append(GameImage.getWithItemTypeName("sand", 54, seed).element(), GameImage.getWithItemTypeName("grass", 54, seed).element());
                    if (!(seed % 21)) {
                        cell.append(GameImage.getWithItemTypeName("tree", 54, seed).element());
                    }
                    if (!(seed % 997)) {
                        cell.append(GameImage.getWithItemTypeName("big rock", 54, seed).element());
                    }
                    if (!(seed % 99)) {
                        cell.append(GameImage.getWithItemTypeName("cloud", 54, seed).element());
                    }
                }
                else if (origin.areaId === 1) {
                    cell.append(GameImage.getWithItemTypeName("dungeon floor", 54, seed).element());
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
                    cell.append(GameImage.getWithItemTypeName(itemName, 54, seed).element());
                }
                artwork.append(cell);
            }
        }
        return artwork;
    }
}
