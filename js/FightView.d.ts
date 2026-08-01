import { Coordinates } from "./Coordinates.js";
import { Inventory } from "./Inventory.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { Map } from "./Map.js";
export declare class FightView {
    private itemTakingSummary;
    private inventory;
    private coordinates;
    private map;
    private overlay;
    private game;
    private victoryApplied;
    private sourceElement;
    constructor(itemTakingSummary: ItemTakingSummary, inventory: Inventory, coordinates: Coordinates, map: Map);
    open(): void;
    private startGame;
    private render;
    private createHand;
    private applyVictory;
    private close;
    private requestClose;
    private statLine;
    private button;
    private capitalize;
}
//# sourceMappingURL=FightView.d.ts.map