import { Coordinates } from "./Coordinates.js";
import { Image as GameImage } from "./Image.js";
import type { ItemOrigin } from "./Inventory.js";

export class OriginArtwork {
    static create(itemName: string, origin: ItemOrigin, className: string): HTMLDivElement {
        const coordinates = new Coordinates(origin.latitude, origin.longitude);
        const seed = coordinates.getSeed();
        const artwork = document.createElement("div");
        artwork.className = className + " origin-artwork";
        artwork.style.backgroundImage = origin.depth === 0
            ? "url(images/seamless-sand-light-beach-square-texture-39125213.jpg)"
            : "url(images/dirt2.png)";

        if (origin.depth === 0) {
            artwork.append(
                GameImage.getWithItemTypeName("sand", 54, seed).element(),
                GameImage.getWithItemTypeName("grass", 54, seed).element(),
            );
            if (!(seed % 21)) {
                artwork.append(GameImage.getWithItemTypeName("tree", 54, seed).element());
            }
        } else {
            artwork.append(GameImage.getWithItemTypeName("dungeon floor", 54, seed).element());
        }
        artwork.append(GameImage.getWithItemTypeName(itemName, 54, seed).element());

        return artwork;
    }
}
