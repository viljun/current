import { MonsterDefinition } from "./MonsterDefinition.js";
import type { ItemOrigin } from "./Inventory.js";
import { BattleSpell } from "./BattleSpell.js";
import type { BattleSpellEffect } from "./BattleSpell.js";

export interface CardDefinition {
    id: string;
    itemName: string;
    title: string;
    damage: number;
    block: number;
    healing: number;
    origin: ItemOrigin|null;
    special?: BattleSpellEffect;
}

export interface ShieldCard {
    id: string;
    title: string;
    remainingBlock: number;
}

export type FightStatus = "playing"|"won"|"lost";
export type FightPhase = "player"|"monster"|"dealing"|"finished";
export type Combatant = "player"|"monster";

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
    type: "damage"|"healing"|"block"|"wait"|"defeated"|"special";
    actor: Combatant;
    target: Combatant;
    amount: number;
    blocked: number;
    shieldHits: ShieldHit[];
    special?: BattleSpellEffect|"freeze-skip"|"slow-skip";
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

export class CardGame {
    private static readonly CARDS_PER_ROUND = 2;
    private static readonly HAND_SIZE = 4;
    private static readonly ITEM_QUALITY: Record<string, number> = {
        "bare fist": 1,
        "wooden shield": 4,
        "reinforced shield": 6,
        rat: 1.5,
        club: 3,
        "yarrow poultice": 3,
        orc: 3.5,
        "stone axe": 4,
        sword: 5,
        troll: 5.5,
    };
    private static readonly CARD_TYPES: Record<
        string,
        Omit<CardDefinition, "id"|"origin">
    > = {
        "bare fist": { itemName: "bare fist", title: "Bare Fist", damage: 1, block: 0, healing: 0 },
        "wooden shield": { itemName: "wooden shield", title: "Wooden shield", damage: 0, block: 4, healing: 0 },
        "reinforced shield": { itemName: "reinforced shield", title: "Reinforced shield", damage: 0, block: 6, healing: 0 },
        club:       { itemName: "club",       title: "Club",      damage: 3, block: 0, healing: 0 },
        "stone axe": { itemName: "stone axe", title: "Stone axe", damage: 4, block: 0, healing: 0 },
        sword:      { itemName: "sword",      title: "Sword",     damage: 6, block: 0, healing: 0 },
        "iron-spiked club": { itemName: "iron-spiked club", title: "Iron-spiked club", damage: 4, block: 0, healing: 0 },
        "iron hand axe": { itemName: "iron hand axe", title: "Iron hand axe", damage: 5, block: 0, healing: 0 },
        "flanged mace": { itemName: "flanged mace", title: "Flanged mace", damage: 6, block: 0, healing: 0 },
        "bearded battle axe": { itemName: "bearded battle axe", title: "Bearded battle axe", damage: 7, block: 0, healing: 0 },
        "arming sword": { itemName: "arming sword", title: "Arming sword", damage: 8, block: 0, healing: 0 },
        "war hammer": { itemName: "war hammer", title: "War hammer", damage: 9, block: 0, healing: 0 },
        longsword: { itemName: "longsword", title: "Longsword", damage: 10, block: 0, healing: 0 },
        "two-handed battle axe": { itemName: "two-handed battle axe", title: "Two-handed battle axe", damage: 11, block: 0, healing: 0 },
        poleaxe: { itemName: "poleaxe", title: "Poleaxe", damage: 12, block: 0, healing: 0 },
        "masterwork greatsword": { itemName: "masterwork greatsword", title: "Masterwork greatsword", damage: 14, block: 0, healing: 0 },
        "healing potion": { itemName: "healing potion", title: "Healing potion", damage: 0, block: 0, healing: 10 },
        "river feast": { itemName: "river feast", title: "River feast", damage: 0, block: 0, healing: 7 },
        "poison potion": { itemName: "poison potion", title: "Poison potion", damage: 10, block: 0, healing: 0 },
        "poisoned masterwork greatsword": { itemName: "poisoned masterwork greatsword", title: "Poisoned masterwork greatsword", damage: 18, block: 0, healing: 0 },
        "bone knife": { itemName: "bone knife", title: "Bone knife", damage: 3, block: 0, healing: 0 },
        "spiked cudgel": { itemName: "spiked cudgel", title: "Spiked cudgel", damage: 4, block: 0, healing: 0 },
        "iron dagger": { itemName: "iron dagger", title: "Iron dagger", damage: 5, block: 0, healing: 0 },
        falchion: { itemName: "falchion", title: "Falchion", damage: 6, block: 0, healing: 0 },
        "morning star": { itemName: "morning star", title: "Morning star", damage: 7, block: 0, healing: 0 },
        "war pick": { itemName: "war pick", title: "War pick", damage: 8, block: 0, healing: 0 },
        "heavy crossbow": { itemName: "heavy crossbow", title: "Heavy crossbow", damage: 9, block: 0, healing: 0 },
        zweihander: { itemName: "zweihander", title: "Zweihander", damage: 10, block: 0, healing: 0 },
        halberd: { itemName: "halberd", title: "Halberd", damage: 11, block: 0, healing: 0 },
        "executioner's axe": { itemName: "executioner's axe", title: "Executioner's axe", damage: 12, block: 0, healing: 0 },
        estoc: { itemName: "estoc", title: "Estoc", damage: 13, block: 0, healing: 0 },
        "bec de corbin": { itemName: "bec de corbin", title: "Bec de corbin", damage: 14, block: 0, healing: 0 },
        "gothic mace": { itemName: "gothic mace", title: "Gothic mace", damage: 15, block: 0, healing: 0 },
        "runed longsword": { itemName: "runed longsword", title: "Runed longsword", damage: 16, block: 0, healing: 0 },
        "blacksteel glaive": { itemName: "blacksteel glaive", title: "Blacksteel glaive", damage: 17, block: 0, healing: 0 },
        "relic warhammer": { itemName: "relic warhammer", title: "Relic warhammer", damage: 18, block: 0, healing: 0 },
        "dragonbone axe": { itemName: "dragonbone axe", title: "Dragonbone axe", damage: 19, block: 0, healing: 0 },
        "royal claymore": { itemName: "royal claymore", title: "Royal claymore", damage: 20, block: 0, healing: 0 },
        "obsidian polearm": { itemName: "obsidian polearm", title: "Obsidian polearm", damage: 21, block: 0, healing: 0 },
        "dungeon-forged greatblade": { itemName: "dungeon-forged greatblade", title: "Dungeon-forged greatblade", damage: 22, block: 0, healing: 0 },
        "yarrow poultice": { itemName: "yarrow poultice", title: "Yarrow poultice", damage: 0, block: 0, healing: 3 },
        rat:        { itemName: "rat",        title: "Rat",       damage: 2, block: 0, healing: 0 },
        orc:        { itemName: "orc",        title: "Orc",       damage: 4, block: 2, healing: 0 },
        troll:      { itemName: "troll",      title: "Troll",     damage: 7, block: 2, healing: 0 },
        ...BattleSpell.DEFINITIONS.reduce<Record<
            string,
            Omit<CardDefinition, "id"|"origin">
        >>((cards, spell) => {
            cards[spell.itemName] = {
                itemName: spell.itemName,
                title: spell.title,
                damage: 0,
                block: 0,
                healing: 0,
                special: spell.effect,
            };

            return cards;
        }, {}),
    };

    private readonly monster: MonsterDefinition;
    private readonly fightSeed: number;
    private readonly seedState: { value: number };
    private readonly selectedDeck: CardDefinition[];
    private drawPile: CardDefinition[];
    private bareFistCardIndex = 0;
    private monsterHand: CardDefinition[] = [];
    private state: CardGameState;
    private readonly playerEnchantments: PlayerEnchantments;

    constructor(
        monster: MonsterDefinition,
        inventory: Record<string, number>,
        seed: number,
        itemOrigins: Record<string, ItemOrigin[]>,
        playerHealth: number,
        playerEnchantments: PlayerEnchantments = {
            damage: 0,
            healing: 0,
            block: 0,
        },
    ) {
        this.monster = monster;
        this.fightSeed = seed || 1;
        this.seedState = { value: this.fightSeed };
        this.playerEnchantments = {
            damage: Math.max(0, Math.floor(playerEnchantments.damage)),
            healing: Math.max(0, Math.floor(playerEnchantments.healing)),
            block: Math.max(0, Math.floor(playerEnchantments.block)),
        };
        this.selectedDeck = this.buildDeck(
            inventory,
            itemOrigins,
        );
        this.drawPile = this.selectedDeck.map(card => ({ ...card }));
        this.shuffle(this.drawPile);
        const monsterHealth = this.generateMonsterHealth();
        this.state = {
            monsterHealth,
            monsterMaxHealth: monsterHealth,
            playerHealth,
            playerMaxHealth: playerHealth,
            playerShields: [],
            monsterShields: [],
            hand: [],
            monsterHandSize: 0,
            status: "playing",
            phase: "player",
            round: 1,
            playerPlayedCount: 0,
            monsterPlayedCount: 0,
            playerEnchantments: { ...this.playerEnchantments },
            modifiers: {
                monsterFrozenRound: 0,
                monsterActionsPerRound: CardGame.CARDS_PER_ROUND,
                monsterBlockDivisor: 1,
                monsterHealingPoisoned: false,
                monsterDamageDivisor: 1,
                playerKeepsBlock: false,
                playerLifeStealPercent: 0,
                playerEchoCharges: 0,
                monsterVulnerability: 0,
            },
        };
        this.drawCards(CardGame.HAND_SIZE);
        this.dealMonsterCards();
    }

    private generateMonsterHealth(): number {
        const maximumHealth = Math.max(50, this.monster.health + 12);
        const choices = Array.from({ length: maximumHealth }, (_, index) => {
            const health = index + 1;
            return {
                health,
                weight: Math.max(
                    1,
                    Math.round(
                        100_000 * Math.pow(
                            .72,
                            Math.abs(health - this.monster.health),
                        ),
                    ),
                ),
            };
        });
        const totalWeight = choices.reduce(
            (total, choice) => total + choice.weight,
            0,
        );
        let roll = this.fightHash("monster-health") % totalWeight;
        for (const choice of choices) {
            if (roll < choice.weight) {
                return choice.health;
            }
            roll -= choice.weight;
        }

        return this.monster.health;
    }

    getState(): CardGameState {
        return {
            ...this.state,
            playerShields: this.state.playerShields.map(shield => ({ ...shield })),
            monsterShields: this.state.monsterShields.map(shield => ({ ...shield })),
            hand: this.state.hand.map(card => ({ ...card })),
            playerEnchantments: { ...this.state.playerEnchantments },
            modifiers: { ...this.state.modifiers },
        };
    }

    getSelectedDeck(): CardDefinition[] {
        return this.selectedDeck.map(card => ({ ...card }));
    }

    static playerHealthForYarrow(yarrowQuantity: number): number {
        return Math.max(0, Math.floor(yarrowQuantity));
    }

    static itemCardEffects(
        itemName: string,
    ): { damage: number; block: number; healing: number }|null {
        const known = CardGame.CARD_TYPES[itemName];
        if (known !== undefined) {
            return {
                damage: known.damage,
                block: known.block,
                healing: known.healing,
            };
        }

        return null;
    }

    static itemCardSpecialEffect(itemName: string): BattleSpellEffect|null {
        return BattleSpell.get(itemName)?.effect ?? null;
    }

    playPlayerCard(cardId: string): CardPlayResolution|null {
        if (this.state.status !== "playing" || this.state.phase !== "player") {
            return null;
        }
        const cardIndex = this.state.hand.findIndex(card => card.id === cardId);
        const card = this.state.hand[cardIndex];
        if (card === undefined) {
            return null;
        }
        this.state.hand.splice(cardIndex, 1);
        this.state.playerPlayedCount++;
        const resolution = this.resolveCard("player", card);
        if (this.state.status === "playing") {
            this.state.phase = "monster";
        }

        return resolution;
    }

    playMonsterCard(): CardPlayResolution|null {
        if (this.state.status !== "playing" || this.state.phase !== "monster") {
            return null;
        }
        const skipped = this.skippedMonsterAction();
        if (skipped !== null) {
            this.state.monsterPlayedCount++;
            const resolution = this.skippedMonsterResolution(skipped);
            this.finishMonsterAction(resolution);

            return resolution;
        }
        const card = this.chooseMonsterCard();
        if (card === null) {
            return null;
        }
        this.monsterHand.splice(this.monsterHand.indexOf(card), 1);
        this.state.monsterHandSize = this.monsterHand.length;
        this.state.monsterPlayedCount++;
        const resolution = this.resolveCard("monster", card);
        this.finishMonsterAction(resolution);

        return resolution;
    }

    dealNextRound(): void {
        if (this.state.status !== "playing" || this.state.phase !== "dealing") {
            return;
        }
        this.state.hand = [];
        if (!this.state.modifiers.playerKeepsBlock) {
            this.state.playerShields = [];
        }
        this.state.monsterShields = [];
        this.state.playerPlayedCount = 0;
        this.state.monsterPlayedCount = 0;
        this.state.round++;
        this.drawCards(CardGame.HAND_SIZE);
        this.dealMonsterCards();
        this.state.phase = "player";
    }

    private resolveCard(actor: Combatant, card: CardDefinition): CardPlayResolution {
        const effects: CombatEffect[] = [];
        const target: Combatant = actor === "player" ? "monster" : "player";
        const resolvedCard = this.modifiedCard(actor, card, true);

        if (resolvedCard.special !== undefined) {
            this.applySpecialEffect(resolvedCard.special, effects);
        }

        if (resolvedCard.damage > 0) {
            const vulnerability = actor === "player"
                ? this.state.modifiers.monsterVulnerability
                : 0;
            const damage = this.applyDamage(
                target,
                resolvedCard.damage + vulnerability,
            );
            effects.push({
                type: "damage",
                actor,
                target,
                amount: damage.healthDamage,
                blocked: damage.blocked,
                shieldHits: damage.shieldHits,
            });
            if (
                actor === "player"
                && damage.healthDamage > 0
                && this.state.modifiers.playerLifeStealPercent > 0
            ) {
                const healing = Math.max(
                    1,
                    Math.floor(
                        damage.healthDamage
                            * this.state.modifiers.playerLifeStealPercent
                            / 100,
                    ),
                );
                const healed = this.applyHealing("player", healing);
                if (healed > 0) {
                    effects.push({
                        type: "healing",
                        actor: "player",
                        target: "player",
                        amount: healed,
                        blocked: 0,
                        shieldHits: [],
                    });
                }
            }
            if (this.healthOf(target) === 0) {
                this.finishFight(target);
                effects.push({
                    type: "defeated",
                    actor,
                    target,
                    amount: 0,
                    blocked: 0,
                    shieldHits: [],
                });

                return this.resolution(actor, resolvedCard, effects);
            }
        }

        if (resolvedCard.healing > 0) {
            if (
                actor === "monster"
                && this.state.modifiers.monsterHealingPoisoned
            ) {
                const healthBefore = this.state.monsterHealth;
                this.state.monsterHealth = Math.max(
                    0,
                    this.state.monsterHealth - resolvedCard.healing,
                );
                effects.push({
                    type: "damage",
                    actor,
                    target: "monster",
                    amount: healthBefore - this.state.monsterHealth,
                    blocked: 0,
                    shieldHits: [],
                    special: "curse",
                });
                if (this.state.monsterHealth === 0) {
                    this.finishFight("monster");
                    effects.push({
                        type: "defeated",
                        actor: "player",
                        target: "monster",
                        amount: 0,
                        blocked: 0,
                        shieldHits: [],
                    });

                    return this.resolution(actor, resolvedCard, effects);
                }
            } else {
                const healed = this.applyHealing(actor, resolvedCard.healing);
                if (healed > 0) {
                    effects.push({
                        type: "healing",
                        actor,
                        target: actor,
                        amount: healed,
                        blocked: 0,
                        shieldHits: [],
                    });
                }
            }
        }

        if (resolvedCard.block > 0) {
            this.shieldsOf(actor).push({
                id: resolvedCard.id,
                title: resolvedCard.title,
                remainingBlock: resolvedCard.block,
            });
            effects.push({
                type: "block",
                actor,
                target: actor,
                amount: resolvedCard.block,
                blocked: 0,
                shieldHits: [],
            });
        }

        if (effects.length === 0) {
            effects.push({
                type: "wait",
                actor,
                target: actor,
                amount: 0,
                blocked: 0,
                shieldHits: [],
            });
        }

        return this.resolution(actor, resolvedCard, effects);
    }

    private resolution(
        actor: Combatant,
        card: CardDefinition,
        effects: CombatEffect[],
    ): CardPlayResolution {
        return {
            actor,
            card: { ...card },
            effects,
            monsterDefeated: this.state.status === "won",
            playerDefeated: this.state.status === "lost",
            roundComplete: false,
        };
    }

    private applySpecialEffect(
        special: BattleSpellEffect,
        effects: CombatEffect[],
    ): void {
        let amount = 0;
        if (special === "freeze") {
            this.state.modifiers.monsterFrozenRound = this.state.round;
        } else if (special === "slow") {
            this.state.modifiers.monsterActionsPerRound = 1;
        } else if (special === "sunder") {
            this.state.modifiers.monsterBlockDivisor *= 2;
            const shields = this.state.monsterShields;
            const previous = this.totalShield("monster");
            for (const shield of shields) {
                shield.remainingBlock = Math.floor(shield.remainingBlock / 2);
            }
            this.state.monsterShields = shields.filter(
                shield => shield.remainingBlock > 0,
            );
            amount = previous - this.totalShield("monster");
        } else if (special === "curse") {
            this.state.modifiers.monsterHealingPoisoned = true;
        } else if (special === "weaken") {
            this.state.modifiers.monsterDamageDivisor *= 2;
        } else if (special === "unravel") {
            amount = this.totalShield("monster");
            this.state.monsterShields = [];
        } else if (special === "stoneward") {
            this.state.modifiers.playerKeepsBlock = true;
        } else if (special === "lifesteal") {
            this.state.modifiers.playerLifeStealPercent = Math.min(
                100,
                this.state.modifiers.playerLifeStealPercent + 50,
            );
        } else if (special === "echo") {
            this.state.modifiers.playerEchoCharges++;
        } else if (special === "doom") {
            this.state.modifiers.monsterVulnerability += 2;
        }
        effects.push({
            type: "special",
            actor: "player",
            target: ["stoneward", "lifesteal", "echo"].includes(special)
                ? "player"
                : "monster",
            amount,
            blocked: 0,
            shieldHits: [],
            special,
        });
    }

    private modifiedCard(
        actor: Combatant,
        card: CardDefinition,
        consumeEcho: boolean,
    ): CardDefinition {
        const modified = { ...card };
        if (actor === "monster") {
            modified.damage = Math.floor(
                modified.damage / this.state.modifiers.monsterDamageDivisor,
            );
            modified.block = Math.floor(
                modified.block / this.state.modifiers.monsterBlockDivisor,
            );

            return modified;
        }
        if (
            modified.special === undefined
            && this.state.modifiers.playerEchoCharges > 0
        ) {
            modified.damage *= 2;
            modified.block *= 2;
            modified.healing *= 2;
            if (consumeEcho) {
                this.state.modifiers.playerEchoCharges--;
            }
        }

        return modified;
    }

    private skippedMonsterAction(): "freeze-skip"|"slow-skip"|null {
        if (this.state.modifiers.monsterFrozenRound === this.state.round) {
            return "freeze-skip";
        }
        if (
            this.state.modifiers.monsterActionsPerRound === 1
            && this.state.monsterPlayedCount >= 1
        ) {
            return "slow-skip";
        }

        return null;
    }

    private skippedMonsterResolution(
        special: "freeze-skip"|"slow-skip",
    ): CardPlayResolution {
        const title = special === "freeze-skip" ? "Frozen" : "Slowed";
        const card: CardDefinition = {
            id: "monster-skip-" + this.state.round + "-"
                + this.state.monsterPlayedCount,
            itemName: special === "freeze-skip" ? "frozen turn" : "slowed turn",
            title,
            damage: 0,
            block: 0,
            healing: 0,
            origin: null,
        };

        return this.resolution("monster", card, [{
            type: "special",
            actor: "monster",
            target: "monster",
            amount: 0,
            blocked: 0,
            shieldHits: [],
            special,
        }]);
    }

    private finishMonsterAction(resolution: CardPlayResolution): void {
        if (this.state.status !== "playing") {
            return;
        }
        if (
            this.state.playerPlayedCount === CardGame.CARDS_PER_ROUND
            && this.state.monsterPlayedCount === CardGame.CARDS_PER_ROUND
        ) {
            this.state.phase = "dealing";
            resolution.roundComplete = true;
        } else {
            this.state.phase = "player";
        }
    }

    private applyDamage(
        target: Combatant,
        damage: number,
    ): { healthDamage: number; blocked: number; shieldHits: ShieldHit[] } {
        const shields = this.shieldsOf(target);
        let remainingDamage = damage;
        let blocked = 0;
        const shieldHits: ShieldHit[] = [];
        while (remainingDamage > 0 && shields.length > 0) {
            const shield = shields[0];
            if (shield === undefined) {
                break;
            }
            const absorbed = Math.min(shield.remainingBlock, remainingDamage);
            shield.remainingBlock -= absorbed;
            remainingDamage -= absorbed;
            blocked += absorbed;
            shieldHits.push({
                id: shield.id,
                absorbed,
                remainingBlock: shield.remainingBlock,
            });
            if (shield.remainingBlock === 0) {
                shields.shift();
            }
        }

        const healthBefore = this.healthOf(target);
        this.setHealth(target, Math.max(0, healthBefore - remainingDamage));

        return {
            healthDamage: healthBefore - this.healthOf(target),
            blocked,
            shieldHits,
        };
    }

    private applyHealing(actor: Combatant, healing: number): number {
        const healthBefore = this.healthOf(actor);
        const maximum = actor === "player"
            ? this.state.playerMaxHealth
            : this.state.monsterMaxHealth;
        this.setHealth(actor, Math.min(maximum, healthBefore + healing));

        return this.healthOf(actor) - healthBefore;
    }

    private finishFight(defeated: Combatant): void {
        this.state.status = defeated === "monster" ? "won" : "lost";
        this.state.phase = "finished";
    }

    private healthOf(combatant: Combatant): number {
        return combatant === "player"
            ? this.state.playerHealth
            : this.state.monsterHealth;
    }

    private setHealth(combatant: Combatant, health: number): void {
        if (combatant === "player") {
            this.state.playerHealth = health;
        } else {
            this.state.monsterHealth = health;
        }
    }

    private shieldsOf(combatant: Combatant): ShieldCard[] {
        return combatant === "player"
            ? this.state.playerShields
            : this.state.monsterShields;
    }

    private dealMonsterCards(): void {
        this.monsterHand = [];
        for (let index = 0; index < CardGame.HAND_SIZE; index++) {
            const itemName = this.monsterCardItem(index);
            this.monsterHand.push(this.monsterCard(itemName, index));
        }
        this.state.monsterHandSize = this.monsterHand.length;
    }

    private monsterCardItem(index: number): string {
        const choices = Object.entries(CardGame.ITEM_QUALITY).map(
            ([itemName, quality]) => ({
                itemName,
                weight: Math.max(
                    1,
                    Math.round(
                        10_000 * Math.pow(
                            .42,
                            Math.abs(quality - this.monster.cardStrength),
                        ),
                    ),
                ),
            }),
        );
        const totalWeight = choices.reduce(
            (total, choice) => total + choice.weight,
            0,
        );
        let roll = this.monsterCardHash("card-item:" + index) % totalWeight;
        for (const choice of choices) {
            if (roll < choice.weight) {
                return choice.itemName;
            }
            roll -= choice.weight;
        }

        return "bare fist";
    }

    private monsterCard(itemName: string, index: number): CardDefinition {
        const cardType = CardGame.CARD_TYPES[itemName]
            ?? CardGame.CARD_TYPES["bare fist"]!;
        return {
            id: "monster-" + this.state.round + "-" + index,
            ...cardType,
            origin: itemName === "bare fist"
                ? null
                : this.monsterCardOrigin(itemName, index),
        };
    }

    private monsterCardOrigin(itemName: string, index: number): ItemOrigin {
        const latitudeHash = this.monsterCardHash(itemName + ":latitude:" + index);
        const longitudeHash = this.monsterCardHash(itemName + ":longitude:" + index);

        return {
            latitude: 10_000 + latitudeHash % 900_000,
            longitude: 10_000 + longitudeHash % 900_000,
            areaId: 1,
        };
    }

    private monsterCardHash(text: string): number {
        return this.fightHash(text, this.state.round);
    }

    private fightHash(text: string, round: number = 0): number {
        let hash = this.fightSeed ^ Math.imul(round, 65_537);
        for (let index = 0; index < text.length; index++) {
            hash = Math.imul(hash ^ text.charCodeAt(index), 16_777_619);
        }
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    private chooseMonsterCard(): CardDefinition|null {
        if (this.monsterHand.length === 0) {
            return null;
        }
        const lethalCards = this.monsterHand.filter(card => {
            const modified = this.modifiedCard("monster", card, false);
            return Math.max(0, modified.damage - this.totalShield("player"))
                >= this.state.playerHealth;
        });
        const candidates = lethalCards.length > 0 ? lethalCards : this.monsterHand;
        const ranked = [...candidates].sort(
            (first, second) =>
                this.monsterCardScore(second) - this.monsterCardScore(first),
        );
        const best = ranked[0] ?? null;
        const alternative = ranked[1];
        if (
            lethalCards.length === 0
            && best !== null
            && alternative !== undefined
            && this.monsterCardScore(alternative)
                >= Math.max(0, this.monsterCardScore(best) * 0.35)
            && this.useAlternativeChoice()
        ) {
            return alternative;
        }

        return best;
    }

    private monsterCardScore(card: CardDefinition): number {
        const modified = this.modifiedCard("monster", card, false);
        const playerShield = this.totalShield("player");
        const effectiveDamage = Math.min(
            this.state.playerHealth,
            Math.max(0, modified.damage - playerShield),
        );
        const missingHealth = this.state.monsterMaxHealth - this.state.monsterHealth;
        const effectiveHealing = this.state.modifiers.monsterHealingPoisoned
            ? -modified.healing
            : Math.min(missingHealth, modified.healing);
        const likelyPlayerDamage = this.state.hand
            .map(playerCard => {
                const modified = this.modifiedCard(
                    "player",
                    playerCard,
                    false,
                );

                return modified.damage > 0
                    ? modified.damage
                        + this.state.modifiers.monsterVulnerability
                    : 0;
            })
            .sort((first, second) => second - first)
            .slice(0, CardGame.CARDS_PER_ROUND - this.state.playerPlayedCount)
            .reduce((total, damage) => total + damage, 0);
        const effectiveBlock = Math.min(modified.block, likelyPlayerDamage);
        const dangerMultiplier = this.state.monsterHealth <= this.state.monsterMaxHealth / 3
            ? 1.7
            : 1;
        let score = effectiveDamage * 5
            + effectiveHealing * 3 * dangerMultiplier
            + effectiveBlock * 2.5 * dangerMultiplier;
        if (modified.damage > 0 && effectiveDamage === 0) score -= 3;
        if (modified.healing > 0 && effectiveHealing <= 0) score -= 4;
        if (modified.block > 0 && effectiveBlock === 0) score -= 2;

        return score + this.deterministicBias(card.id);
    }

    private deterministicBias(cardId: string): number {
        let hash = this.fightSeed ^ (this.state.round * 1_009)
            ^ (this.state.monsterPlayedCount * 9_173);
        for (let index = 0; index < cardId.length; index++) {
            hash = Math.imul(hash ^ cardId.charCodeAt(index), 16_777_619);
        }
        hash ^= hash >>> 16;

        return ((hash >>> 0) % 401) / 100 - 2;
    }

    private useAlternativeChoice(): boolean {
        let value = this.fightSeed ^ Math.imul(this.state.round, 7_919)
            ^ Math.imul(this.state.monsterPlayedCount, 104_729);
        value ^= value >>> 15;
        value = Math.imul(value, 2_246_822_519);
        value ^= value >>> 13;

        return (value >>> 0) % 4 === 0;
    }

    private totalShield(combatant: Combatant): number {
        return this.shieldsOf(combatant).reduce(
            (total, shield) => total + shield.remainingBlock,
            0,
        );
    }

    private buildDeck(
        inventory: Record<string, number>,
        itemOrigins: Record<string, ItemOrigin[]>,
    ): CardDefinition[] {
        const cards: CardDefinition[] = [];
        const inventoryEntries = Object.entries(inventory).sort(
            ([first], [second]) => first < second ? -1 : first > second ? 1 : 0,
        );
        for (const [itemName, quantity] of inventoryEntries) {
            const cardType = CardGame.CARD_TYPES[itemName];
            if (cardType === undefined || quantity <= 0) {
                continue;
            }
            const copies = Math.floor(quantity);
            for (let copy = 0; copy < copies; copy++) {
                cards.push({
                    ...this.enchant(cardType),
                    id: itemName + "-" + copy,
                    origin: itemOrigins[itemName]?.[copy] ?? null,
                });
            }
        }

        return cards;
    }

    private drawCards(quantity: number): void {
        while (this.state.hand.length < quantity) {
            this.state.hand.push(
                this.drawPile.pop() ?? this.createBareFistCard(),
            );
        }
    }

    private createBareFistCard(): CardDefinition {
        return {
            id: "bare-fist-" + this.bareFistCardIndex++,
            ...this.enchant(CardGame.CARD_TYPES["bare fist"]!),
            origin: null,
        };
    }

    private enchant(
        card: Omit<CardDefinition, "id"|"origin">,
    ): Omit<CardDefinition, "id"|"origin"> {
        return {
            ...card,
            damage: card.damage > 0
                ? card.damage + this.playerEnchantments.damage
                : 0,
            healing: card.healing > 0
                ? card.healing + this.playerEnchantments.healing
                : 0,
            block: card.block > 0
                ? card.block + this.playerEnchantments.block
                : 0,
        };
    }

    private shuffle(cards: CardDefinition[]): void {
        for (let index = cards.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(this.nextSequenceFraction() * (index + 1));
            [cards[index], cards[swapIndex]] = [cards[swapIndex]!, cards[index]!];
        }
    }

    private nextSequenceFraction(): number {
        let value = this.seedState.value | 0;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.seedState.value = value;

        return (value >>> 0) / 4_294_967_296;
    }

}
