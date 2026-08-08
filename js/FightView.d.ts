import { Coordinates } from "./Coordinates.js";
import { Inventory } from "./Inventory.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { Map } from "./Map.js";
export interface DefeatTip {
    id: string;
    text: string;
}
export declare function defeatTipsForInventory(quantities: Readonly<Record<string, number>>, defeatedMonsterName?: string | null): DefeatTip[];
export declare class FightView {
    private itemTakingSummary;
    private inventory;
    private coordinates;
    private map;
    private overlay;
    private game;
    private victoryApplied;
    private sourceElement;
    private dealtRound;
    private animating;
    private shownMonsterHealth;
    private shownPlayerHealth;
    private autoCloseTimer;
    private monsterName;
    constructor(itemTakingSummary: ItemTakingSummary, inventory: Inventory, coordinates: Coordinates, map: Map);
    open(): void;
    private renderMissingYarrow;
    private startGame;
    private render;
    private createPanelHeader;
    private createFightFloor;
    private fightFloorSeed;
    private createHand;
    private createMonsterHand;
    private createIdentity;
    private createFighterSeat;
    private createFighterDisplay;
    private createHealthDisplay;
    private createEnchantmentDisplay;
    private createModifierDisplay;
    private createCombatants;
    private createPortrait;
    private playPlayerCard;
    private playCardEffects;
    private chooseMonsterCardElement;
    private syncFightState;
    private syncShieldCards;
    private finishFight;
    private showDefeatAdvice;
    private createDefeatAdvice;
    private sweepBoardCards;
    private updateHealthMeter;
    private applyVictory;
    private close;
    private requestClose;
    private button;
    private turnStatus;
}
//# sourceMappingURL=FightView.d.ts.map