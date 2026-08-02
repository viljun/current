import { MonsterDefinition } from "./MonsterDefinition.js";
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
export interface ShieldCard {
    id: string;
    title: string;
    remainingBlock: number;
}
export type FightStatus = "playing" | "won" | "lost";
export type FightPhase = "player" | "monster" | "dealing" | "finished";
export type Combatant = "player" | "monster";
export interface CardGameState {
    monsterHealth: number;
    monsterMaxHealth: number;
    playerHealth: number;
    playerMaxHealth: number;
    playerShields: ShieldCard[];
    monsterShields: ShieldCard[];
    hand: CardDefinition[];
    monsterHandSize: number;
    status: FightStatus;
    phase: FightPhase;
    round: number;
    playerPlayedCount: number;
    monsterPlayedCount: number;
}
export interface CombatEffect {
    type: "damage" | "healing" | "block" | "wait" | "defeated";
    actor: Combatant;
    target: Combatant;
    amount: number;
    blocked: number;
    shieldHits: ShieldHit[];
}
export interface ShieldHit {
    id: string;
    absorbed: number;
    remainingBlock: number;
}
export interface CardPlayResolution {
    actor: Combatant;
    card: CardDefinition;
    effects: CombatEffect[];
    monsterDefeated: boolean;
    playerDefeated: boolean;
    roundComplete: boolean;
}
export declare class CardGame {
    private static readonly CARDS_PER_ROUND;
    private static readonly ITEM_QUALITY;
    private static readonly CARD_TYPES;
    private readonly monster;
    private readonly fightSeed;
    private readonly seedState;
    private readonly handSize;
    private drawPile;
    private passCardIndex;
    private monsterHand;
    private state;
    constructor(monster: MonsterDefinition, inventory: Record<string, number>, seed: number, requiredItemNames: string[], itemOrigins: Record<string, ItemOrigin[]>, playerHealth: number);
    private generateMonsterHealth;
    getState(): CardGameState;
    playPlayerCard(cardId: string): CardPlayResolution | null;
    playMonsterCard(): CardPlayResolution | null;
    dealNextRound(): void;
    private resolveCard;
    private resolution;
    private applyDamage;
    private applyHealing;
    private finishFight;
    private healthOf;
    private setHealth;
    private shieldsOf;
    private dealMonsterCards;
    private monsterCardItem;
    private monsterCard;
    private monsterCardOrigin;
    private monsterCardHash;
    private fightHash;
    private chooseMonsterCard;
    private monsterCardScore;
    private deterministicBias;
    private useAlternativeChoice;
    private totalShield;
    private buildDeck;
    private drawCards;
    private createPassCard;
    private ensureRequiredCards;
    private shuffle;
    private nextSequenceFraction;
}
//# sourceMappingURL=CardGame.d.ts.map