import { MonsterDefinition } from "./MonsterDefinition.js";
import type { ItemOrigin } from "./Inventory.js";
import type { BattleSpellEffect } from "./BattleSpell.js";
export interface CardDefinition {
    id: string;
    itemName: string;
    title: string;
    damage: number;
    block: number;
    healing: number;
    origin: ItemOrigin | null;
    special?: BattleSpellEffect;
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
    playerEnchantments: PlayerEnchantments;
    modifiers: FightModifiers;
}
export interface PlayerEnchantments {
    damage: number;
    healing: number;
    block: number;
}
export interface FightModifiers {
    monsterFrozenRound: number;
    monsterActionsPerRound: number;
    monsterBlockDivisor: number;
    monsterHealingPoisoned: boolean;
    monsterDamageDivisor: number;
    playerKeepsBlock: boolean;
    playerLifeStealPercent: number;
    playerEchoCharges: number;
    monsterVulnerability: number;
}
export interface CombatEffect {
    type: "damage" | "healing" | "block" | "wait" | "defeated" | "special";
    actor: Combatant;
    target: Combatant;
    amount: number;
    blocked: number;
    shieldHits: ShieldHit[];
    special?: BattleSpellEffect | "freeze-skip" | "slow-skip";
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
    private static readonly HAND_SIZE;
    private static readonly ITEM_QUALITY;
    private static readonly CARD_TYPES;
    private readonly monster;
    private readonly fightSeed;
    private readonly seedState;
    private readonly selectedDeck;
    private drawPile;
    private bareFistCardIndex;
    private monsterHand;
    private state;
    private readonly playerEnchantments;
    constructor(monster: MonsterDefinition, inventory: Record<string, number>, seed: number, itemOrigins: Record<string, ItemOrigin[]>, playerHealth: number, playerEnchantments?: PlayerEnchantments);
    private generateMonsterHealth;
    getState(): CardGameState;
    getSelectedDeck(): CardDefinition[];
    static playerHealthForYarrow(yarrowQuantity: number): number;
    static itemCardEffects(itemName: string): {
        damage: number;
        block: number;
        healing: number;
    } | null;
    static itemCardSpecialEffect(itemName: string): BattleSpellEffect | null;
    playPlayerCard(cardId: string): CardPlayResolution | null;
    playMonsterCard(): CardPlayResolution | null;
    dealNextRound(): void;
    private resolveCard;
    private resolution;
    private applySpecialEffect;
    private modifiedCard;
    private skippedMonsterAction;
    private skippedMonsterResolution;
    private finishMonsterAction;
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
    private createBareFistCard;
    private enchant;
    private shuffle;
    private nextSequenceFraction;
}
//# sourceMappingURL=CardGame.d.ts.map