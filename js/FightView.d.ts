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
    private dealtTurn;
    private shownMonsterHealth;
    private shownPlayerHealth;
    constructor(itemTakingSummary: ItemTakingSummary, inventory: Inventory, coordinates: Coordinates, map: Map);
    open(): void;
    private startGame;
    private render;
    private createHand;
    private createCombatants;
    private createPortrait;
    private playTurnEffects;
    private applyVictory;
    private close;
    private requestClose;
    private statLine;
    private healthStatLine;
    private button;
    private capitalize;
    private describeMonsterIntent;
}
//# sourceMappingURL=FightView.d.ts.map