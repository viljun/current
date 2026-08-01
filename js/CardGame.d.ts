import { MonsterDefinition } from "./MonsterDefinition.js";
export interface CardDefinition {
    id: string;
    itemName: string;
    title: string;
    damage: number;
    block: number;
    healing: number;
}
export type FightStatus = "playing" | "won" | "lost";
export interface CardGameState {
    monsterHealth: number;
    monsterMaxHealth: number;
    playerHealth: number;
    playerMaxHealth: number;
    block: number;
    monsterIntent: number;
    hand: CardDefinition[];
    selectedCardIds: string[];
    status: FightStatus;
    turn: number;
}
export declare class CardGame {
    private static readonly CARD_TYPES;
    private readonly monster;
    private readonly seedState;
    private drawPile;
    private discardPile;
    private state;
    constructor(monster: MonsterDefinition, inventory: Record<string, number>, seed: number, requiredItemNames: string[]);
    getState(): CardGameState;
    toggleCard(cardId: string): boolean;
    private resolveTurn;
    private buildDeck;
    private drawCards;
    private ensureRequiredCards;
    private shuffle;
    private random;
}
//# sourceMappingURL=CardGame.d.ts.map