import { MonsterDefinition } from "./MonsterDefinition.js";
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

export interface TurnResolution {
    cards: CardDefinition[];
    monsterDamage: number;
    playerDamage: number;
    healing: number;
    block: number;
    monsterDefeated: boolean;
    playerDefeated: boolean;
}

export interface CardSelectionResult {
    selected: boolean;
    turnResolution: TurnResolution|null;
}

export class CardGame {
    private static readonly CARD_TYPES: Record<string, Omit<CardDefinition, "id"|"origin">> = {
        stick:     { itemName: "stick",     title: "Stick",     damage: 1, block: 0, healing: 0 },
        stone:     { itemName: "stone",     title: "Stone",     damage: 0, block: 2, healing: 0 },
        root:      { itemName: "root",      title: "Root",      damage: 0, block: 0, healing: 1 },
        hay:       { itemName: "hay",       title: "Hay",       damage: 0, block: 1, healing: 0 },
        "iron ore": { itemName: "iron ore", title: "Iron ore", damage: 1, block: 1, healing: 0 },
        iron:      { itemName: "iron",      title: "Iron",      damage: 0, block: 3, healing: 0 },
        club:      { itemName: "club",      title: "Club",      damage: 3, block: 0, healing: 0 },
        "stone axe": { itemName: "stone axe", title: "Stone axe", damage: 4, block: 0, healing: 0 },
        sword:     { itemName: "sword",     title: "Sword",     damage: 6, block: 0, healing: 0 },
        heart:     { itemName: "heart",     title: "Heart",     damage: 0, block: 0, healing: 3 },
    };

    private readonly monster: MonsterDefinition;
    private readonly seedState: { value: number };
    private drawPile: CardDefinition[];
    private discardPile: CardDefinition[] = [];
    private state: CardGameState;

    constructor(
        monster: MonsterDefinition,
        inventory: Record<string, number>,
        seed: number,
        requiredItemNames: string[],
        itemOrigins: Record<string, ItemOrigin[]>,
    ) {
        this.monster = monster;
        this.seedState = { value: seed || 1 };
        this.drawPile = this.buildDeck(inventory, itemOrigins);
        while (this.drawPile.length < 3) {
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
            playerHealth: 10,
            playerMaxHealth: 10,
            block: 0,
            monsterIntent: monster.attackPattern[0] ?? 0,
            hand: [],
            selectedCardIds: [],
            status: "playing",
            turn: 1,
        };
        this.drawCards(monster.handSize);
        this.ensureRequiredCards(requiredItemNames);
    }

    getState(): CardGameState {
        return {
            ...this.state,
            hand: [...this.state.hand],
            selectedCardIds: [...this.state.selectedCardIds],
        };
    }

    toggleCard(cardId: string): CardSelectionResult {
        if (this.state.status !== "playing") {
            return { selected: false, turnResolution: null };
        }
        if (!this.state.hand.some(card => card.id === cardId)) {
            return { selected: false, turnResolution: null };
        }

        const selectedIndex = this.state.selectedCardIds.indexOf(cardId);
        if (selectedIndex >= 0) {
            this.state.selectedCardIds.splice(selectedIndex, 1);

            return { selected: false, turnResolution: null };
        }
        this.state.selectedCardIds.push(cardId);
        if (this.state.selectedCardIds.length === 3) {
            return { selected: true, turnResolution: this.resolveTurn() };
        }

        return { selected: true, turnResolution: null };
    }

    private resolveTurn(): TurnResolution {
        const selectedCards = this.state.selectedCardIds
            .map(cardId => this.state.hand.find(card => card.id === cardId))
            .filter((card): card is CardDefinition => card !== undefined);
        const monsterHealthBefore = this.state.monsterHealth;
        const playerHealthBefore = this.state.playerHealth;
        const block = selectedCards.reduce((total, card) => total + card.block, 0);
        for (const card of selectedCards) {
            this.state.monsterHealth = Math.max(0, this.state.monsterHealth - card.damage);
            this.state.block += card.block;
            this.state.playerHealth = Math.min(
                this.state.playerMaxHealth,
                this.state.playerHealth + card.healing,
            );
        }
        const monsterDamage = monsterHealthBefore - this.state.monsterHealth;
        const healing = Math.max(0, this.state.playerHealth - playerHealthBefore);
        const playerHealthAfterCards = this.state.playerHealth;
        this.state.selectedCardIds = [];
        if (this.state.monsterHealth === 0) {
            this.state.status = "won";

            return {
                cards: [...selectedCards],
                monsterDamage: monsterDamage,
                playerDamage: 0,
                healing: healing,
                block: block,
                monsterDefeated: true,
                playerDefeated: false,
            };
        }
        const damage = Math.max(0, this.state.monsterIntent - this.state.block);
        this.state.playerHealth = Math.max(0, this.state.playerHealth - damage);
        if (this.state.playerHealth === 0) {
            this.state.status = "lost";

            return {
                cards: [...selectedCards],
                monsterDamage: monsterDamage,
                playerDamage: playerHealthAfterCards,
                healing: healing,
                block: block,
                monsterDefeated: false,
                playerDefeated: true,
            };
        }

        this.discardPile.push(...this.state.hand);
        this.state.hand = [];
        this.state.block = 0;
        this.state.turn++;
        this.state.monsterIntent = this.monster.attackPattern[
            (this.state.turn - 1) % this.monster.attackPattern.length
        ] ?? 0;
        this.drawCards(this.monster.handSize);

        return {
            cards: [...selectedCards],
            monsterDamage: monsterDamage,
            playerDamage: damage,
            healing: healing,
            block: block,
            monsterDefeated: false,
            playerDefeated: false,
        };
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
            const swapIndex = Math.floor(this.random() * (index + 1));
            [cards[index], cards[swapIndex]] = [cards[swapIndex]!, cards[index]!];
        }
    }

    private random(): number {
        let value = this.seedState.value | 0;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.seedState.value = value;

        return (value >>> 0) / 4_294_967_296;
    }
}
