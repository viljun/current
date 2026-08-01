import { MonsterDefinition } from "./MonsterDefinition.js";
export class CardGame {
    constructor(monster, inventory, seed, requiredItemNames, itemOrigins, playerHealth) {
        this.discardPile = [];
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
            playerHealth: playerHealth,
            playerMaxHealth: playerHealth,
            block: 0,
            monsterBlock: 0,
            monsterIntent: this.getMonsterAction(0),
            hand: [],
            selectedCardIds: [],
            status: "playing",
            turn: 1,
        };
        this.drawCards(monster.handSize);
        this.ensureRequiredCards(requiredItemNames);
    }
    getState() {
        return Object.assign(Object.assign({}, this.state), { monsterIntent: Object.assign({}, this.state.monsterIntent), hand: [...this.state.hand], selectedCardIds: [...this.state.selectedCardIds] });
    }
    toggleCard(cardId) {
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
    resolveTurn() {
        const selectedCards = this.state.selectedCardIds
            .map(cardId => this.state.hand.find(card => card.id === cardId))
            .filter((card) => card !== undefined);
        const monsterHealthBefore = this.state.monsterHealth;
        const playerHealthBefore = this.state.playerHealth;
        const block = selectedCards.reduce((total, card) => total + card.block, 0);
        for (const card of selectedCards) {
            const blockedDamage = Math.min(this.state.monsterBlock, card.damage);
            this.state.monsterBlock -= blockedDamage;
            this.state.monsterHealth = Math.max(0, this.state.monsterHealth - (card.damage - blockedDamage));
            this.state.block += card.block;
            this.state.playerHealth = Math.min(this.state.playerMaxHealth, this.state.playerHealth + card.healing);
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
                monsterHealing: 0,
                monsterBlock: 0,
                monsterDefeated: true,
                playerDefeated: false,
            };
        }
        const action = this.state.monsterIntent;
        const damage = Math.max(0, action.damage - this.state.block);
        this.state.playerHealth = Math.max(0, this.state.playerHealth - damage);
        const monsterHealthBeforeHealing = this.state.monsterHealth;
        this.state.monsterHealth = Math.min(this.state.monsterMaxHealth, this.state.monsterHealth + action.healing);
        const monsterHealing = this.state.monsterHealth - monsterHealthBeforeHealing;
        this.state.monsterBlock = action.block;
        if (this.state.playerHealth === 0) {
            this.state.status = "lost";
            return {
                cards: [...selectedCards],
                monsterDamage: monsterDamage,
                playerDamage: playerHealthAfterCards,
                healing: healing,
                block: block,
                monsterHealing: monsterHealing,
                monsterBlock: action.block,
                monsterDefeated: false,
                playerDefeated: true,
            };
        }
        this.discardPile.push(...this.state.hand);
        this.state.hand = [];
        this.state.block = 0;
        this.state.turn++;
        this.state.monsterIntent = this.getMonsterAction(this.state.turn - 1);
        this.drawCards(this.monster.handSize);
        return {
            cards: [...selectedCards],
            monsterDamage: monsterDamage,
            playerDamage: damage,
            healing: healing,
            block: block,
            monsterHealing: monsterHealing,
            monsterBlock: action.block,
            monsterDefeated: false,
            playerDefeated: false,
        };
    }
    buildDeck(inventory, itemOrigins) {
        var _a, _b;
        const cards = [];
        for (const [itemName, quantity] of Object.entries(inventory)) {
            const cardType = CardGame.CARD_TYPES[itemName];
            if (cardType === undefined || quantity <= 0) {
                continue;
            }
            const copies = Math.min(Math.floor(quantity), 3);
            for (let copy = 0; copy < copies; copy++) {
                cards.push(Object.assign(Object.assign({}, cardType), { id: itemName + "-" + copy, origin: (_b = (_a = itemOrigins[itemName]) === null || _a === void 0 ? void 0 : _a[copy]) !== null && _b !== void 0 ? _b : null }));
            }
        }
        return cards;
    }
    drawCards(quantity) {
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
    ensureRequiredCards(requiredItemNames) {
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
    shuffle(cards) {
        for (let index = cards.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(this.nextSequenceFraction() * (index + 1));
            [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
        }
    }
    nextSequenceFraction() {
        let value = this.seedState.value | 0;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.seedState.value = value;
        return (value >>> 0) / 4294967296;
    }
    getMonsterAction(index) {
        const pattern = this.monster.actionPattern;
        const action = pattern[index % pattern.length];
        return action === undefined
            ? { damage: 0, block: 0, healing: 0 }
            : Object.assign({}, action);
    }
}
CardGame.CARD_TYPES = {
    stick: { itemName: "stick", title: "Stick", damage: 1, block: 0, healing: 0 },
    stone: { itemName: "stone", title: "Stone", damage: 0, block: 2, healing: 0 },
    root: { itemName: "root", title: "Root", damage: 0, block: 0, healing: 1 },
    hay: { itemName: "hay", title: "Hay", damage: 0, block: 1, healing: 0 },
    "iron ore": { itemName: "iron ore", title: "Iron ore", damage: 1, block: 1, healing: 0 },
    iron: { itemName: "iron", title: "Iron", damage: 0, block: 3, healing: 0 },
    club: { itemName: "club", title: "Club", damage: 3, block: 0, healing: 0 },
    "stone axe": { itemName: "stone axe", title: "Stone axe", damage: 4, block: 0, healing: 0 },
    sword: { itemName: "sword", title: "Sword", damage: 6, block: 0, healing: 0 },
    heart: { itemName: "heart", title: "Heart", damage: 0, block: 0, healing: 3 },
};
