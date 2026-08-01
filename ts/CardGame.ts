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
    origin: ItemOrigin|null;
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
}

export interface CombatEffect {
    type: "damage"|"healing"|"block"|"wait"|"defeated";
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

export class CardGame {
    private static readonly CARDS_PER_ROUND = 3;
    private static readonly CARD_TYPES: Record<string, Omit<CardDefinition, "id"|"origin">> = {
        stick:      { itemName: "stick",      title: "Stick",     damage: 1, block: 0, healing: 0 },
        stone:      { itemName: "stone",      title: "Stone",     damage: 0, block: 2, healing: 0 },
        root:       { itemName: "root",       title: "Root",      damage: 0, block: 0, healing: 1 },
        hay:        { itemName: "hay",        title: "Hay",       damage: 0, block: 1, healing: 0 },
        "iron ore": { itemName: "iron ore",   title: "Iron ore",  damage: 1, block: 1, healing: 0 },
        iron:       { itemName: "iron",       title: "Iron",      damage: 0, block: 3, healing: 0 },
        club:       { itemName: "club",       title: "Club",      damage: 3, block: 0, healing: 0 },
        "stone axe": { itemName: "stone axe", title: "Stone axe", damage: 4, block: 0, healing: 0 },
        sword:      { itemName: "sword",      title: "Sword",     damage: 6, block: 0, healing: 0 },
        heart:      { itemName: "heart",      title: "Heart",     damage: 0, block: 0, healing: 3 },
    };

    private readonly monster: MonsterDefinition;
    private readonly fightSeed: number;
    private readonly seedState: { value: number };
    private readonly handSize: number;
    private drawPile: CardDefinition[];
    private discardPile: CardDefinition[] = [];
    private monsterActionIndex = 0;
    private monsterHand: CardDefinition[] = [];
    private state: CardGameState;

    constructor(
        monster: MonsterDefinition,
        inventory: Record<string, number>,
        seed: number,
        requiredItemNames: string[],
        itemOrigins: Record<string, ItemOrigin[]>,
        playerHealth: number,
    ) {
        this.monster = monster;
        this.fightSeed = seed || 1;
        this.seedState = { value: this.fightSeed };
        this.handSize = monster.handSize;
        this.drawPile = this.buildDeck(inventory, itemOrigins);
        while (this.drawPile.length < CardGame.CARDS_PER_ROUND) {
            this.drawPile.push({
                id: "scratch-" + this.drawPile.length,
                itemName: "scratch",
                title: "Scratch",
                damage: 1,
                block: 0,
                healing: 0,
                origin: null,
            });
        }
        this.shuffle(this.drawPile);
        this.state = {
            monsterHealth: monster.health,
            monsterMaxHealth: monster.health,
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
        };
        this.drawCards(this.handSize);
        this.ensureRequiredCards(requiredItemNames);
        this.dealMonsterCards();
    }

    getState(): CardGameState {
        return {
            ...this.state,
            playerShields: this.state.playerShields.map(shield => ({ ...shield })),
            monsterShields: this.state.monsterShields.map(shield => ({ ...shield })),
            hand: this.state.hand.map(card => ({ ...card })),
        };
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
        this.discardPile.push(card);
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
        const card = this.chooseMonsterCard();
        if (card === null) {
            return null;
        }
        this.monsterHand.splice(this.monsterHand.indexOf(card), 1);
        this.state.monsterHandSize = this.monsterHand.length;
        this.state.monsterPlayedCount++;
        const resolution = this.resolveCard("monster", card);
        if (this.state.status === "playing") {
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

        return resolution;
    }

    dealNextRound(): void {
        if (this.state.status !== "playing" || this.state.phase !== "dealing") {
            return;
        }
        this.discardPile.push(...this.state.hand);
        this.state.hand = [];
        this.state.playerShields = [];
        this.state.monsterShields = [];
        this.state.playerPlayedCount = 0;
        this.state.monsterPlayedCount = 0;
        this.state.round++;
        this.drawCards(this.handSize);
        this.dealMonsterCards();
        this.state.phase = "player";
    }

    private resolveCard(actor: Combatant, card: CardDefinition): CardPlayResolution {
        const effects: CombatEffect[] = [];
        const target: Combatant = actor === "player" ? "monster" : "player";

        if (card.damage > 0) {
            const damage = this.applyDamage(target, card.damage);
            effects.push({
                type: "damage",
                actor,
                target,
                amount: damage.healthDamage,
                blocked: damage.blocked,
                shieldHits: damage.shieldHits,
            });
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

                return this.resolution(actor, card, effects);
            }
        }

        if (card.healing > 0) {
            const healed = this.applyHealing(actor, card.healing);
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

        if (card.block > 0) {
            this.shieldsOf(actor).push({
                id: card.id,
                title: card.title,
                remainingBlock: card.block,
            });
            effects.push({
                type: "block",
                actor,
                target: actor,
                amount: card.block,
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

        return this.resolution(actor, card, effects);
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
        for (let index = 0; index < this.monster.actionPattern.length; index++) {
            const action = this.getMonsterAction(this.monsterActionIndex++);
            this.monsterHand.push(this.monsterCard(action, this.monsterActionIndex));
        }
        this.state.monsterHandSize = this.monsterHand.length;
    }

    private monsterCard(action: MonsterAction, index: number): CardDefinition {
        const itemName = this.monsterCardItem(action, index);
        return {
            id: "monster-" + this.state.round + "-" + index,
            itemName,
            title: itemName.charAt(0).toUpperCase() + itemName.slice(1),
            damage: action.damage,
            block: action.block,
            healing: action.healing,
            origin: this.monsterCardOrigin(itemName, index),
        };
    }

    private monsterCardItem(action: MonsterAction, index: number): string {
        let choices: string[];
        if (action.damage > 0 && action.block > 0) {
            choices = ["iron ore", "stone axe", "iron"];
        } else if (action.damage > 0 && action.healing > 0) {
            choices = ["heart", "root", "club"];
        } else if (action.damage > 0) {
            choices = ["stick", "club", "stone axe", "sword", "iron ore"];
        } else if (action.block > 0 && action.healing > 0) {
            choices = ["iron", "heart", "stone"];
        } else if (action.block > 0) {
            choices = ["stone", "hay", "iron", "iron ore"];
        } else if (action.healing > 0) {
            choices = ["root", "heart"];
        } else {
            choices = ["hay", "root", "stone"];
        }
        const choiceIndex = this.monsterCardHash(
            choices.join(",") + ":" + index,
        ) % choices.length;

        return choices[choiceIndex] ?? "stick";
    }

    private monsterCardOrigin(itemName: string, index: number): ItemOrigin {
        const latitudeHash = this.monsterCardHash(itemName + ":latitude:" + index);
        const longitudeHash = this.monsterCardHash(itemName + ":longitude:" + index);

        return {
            latitude: 10_000 + latitudeHash % 900_000,
            longitude: 10_000 + longitudeHash % 900_000,
            depth: 1,
        };
    }

    private monsterCardHash(text: string): number {
        let hash = this.fightSeed ^ Math.imul(this.state.round, 65_537);
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
            return Math.max(0, card.damage - this.totalShield("player"))
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
        const playerShield = this.totalShield("player");
        const effectiveDamage = Math.min(
            this.state.playerHealth,
            Math.max(0, card.damage - playerShield),
        );
        const missingHealth = this.state.monsterMaxHealth - this.state.monsterHealth;
        const effectiveHealing = Math.min(missingHealth, card.healing);
        const likelyPlayerDamage = this.state.hand
            .map(playerCard => playerCard.damage)
            .sort((first, second) => second - first)
            .slice(0, CardGame.CARDS_PER_ROUND - this.state.playerPlayedCount)
            .reduce((total, damage) => total + damage, 0);
        const effectiveBlock = Math.min(card.block, likelyPlayerDamage);
        const dangerMultiplier = this.state.monsterHealth <= this.state.monsterMaxHealth / 3
            ? 1.7
            : 1;
        let score = effectiveDamage * 5
            + effectiveHealing * 3 * dangerMultiplier
            + effectiveBlock * 2.5 * dangerMultiplier;
        if (card.damage > 0 && effectiveDamage === 0) score -= 3;
        if (card.healing > 0 && effectiveHealing === 0) score -= 4;
        if (card.block > 0 && effectiveBlock === 0) score -= 2;

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
        for (const [itemName, quantity] of Object.entries(inventory)) {
            const cardType = CardGame.CARD_TYPES[itemName];
            if (cardType === undefined || quantity <= 0) {
                continue;
            }
            const copies = Math.min(Math.floor(quantity), 3);
            for (let copy = 0; copy < copies; copy++) {
                cards.push({
                    ...cardType,
                    id: itemName + "-" + copy,
                    origin: itemOrigins[itemName]?.[copy] ?? null,
                });
            }
        }

        return cards;
    }

    private drawCards(quantity: number): void {
        while (this.state.hand.length < quantity) {
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) {
                    break;
                }
                this.drawPile = this.discardPile.splice(0);
                this.shuffle(this.drawPile);
            }
            const card = this.drawPile.pop();
            if (card !== undefined) {
                this.state.hand.push(card);
            }
        }
    }

    private ensureRequiredCards(requiredItemNames: string[]): void {
        for (const itemName of requiredItemNames) {
            if (this.state.hand.some(card => card.itemName === itemName)) {
                continue;
            }
            const index = this.drawPile.findIndex(card => card.itemName === itemName);
            if (index < 0) {
                continue;
            }
            const requiredCard = this.drawPile.splice(index, 1)[0];
            const replacedCard = this.state.hand.pop();
            if (requiredCard !== undefined) {
                this.state.hand.push(requiredCard);
            }
            if (replacedCard !== undefined) {
                this.drawPile.push(replacedCard);
            }
        }
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

    private getMonsterAction(index: number): MonsterAction {
        const pattern = this.monster.actionPattern;
        const action = pattern[index % pattern.length];

        return action === undefined
            ? { damage: 0, block: 0, healing: 0 }
            : { ...action };
    }
}
