import { MonsterDefinition } from "./MonsterDefinition.js";
import type { MonsterAction } from "./MonsterDefinition.js";
import type { ItemOrigin } from "./Inventory.js";
export interface CardDefinition {
    id: string;
    itemName: string;
    title: string;
    damage: number;
    block: number;
    healing: number;
    origin: ItemOrigin | null;
}
export type FightStatus = "playing" | "won" | "lost";
export interface CardGameState {
    monsterHealth: number;
    monsterMaxHealth: number;
    playerHealth: number;
    playerMaxHealth: number;
    block: number;
    monsterBlock: number;
    monsterIntent: MonsterAction;
    hand: CardDefinition[];
    selectedCardIds: string[];
    status: FightStatus;
    turn: number;
}
export interface TurnResolution {
    cards: CardDefinition[];
    monsterDamage: number;
    playerDamage: number;
    healing: number;
    block: number;
    monsterHealing: number;
    monsterBlock: number;
    monsterDefeated: boolean;
    playerDefeated: boolean;
}
export interface CardSelectionResult {
    selected: boolean;
    turnResolution: TurnResolution | null;
}
export declare class CardGame {
    private static readonly CARD_TYPES;
    private readonly monster;
    private readonly seedState;
    private drawPile;
    private discardPile;
    private state;
    constructor(monster: MonsterDefinition, inventory: Record<string, number>, seed: number, requiredItemNames: string[], itemOrigins: Record<string, ItemOrigin[]>);
    getState(): CardGameState;
    toggleCard(cardId: string): CardSelectionResult;
    private resolveTurn;
    private buildDeck;
    private drawCards;
    private ensureRequiredCards;
    private shuffle;
    private nextSequenceFraction;
    private getMonsterAction;
}
//# sourceMappingURL=CardGame.d.ts.map