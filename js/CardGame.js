import { MonsterDefinition } from "./MonsterDefinition.js";
export class CardGame {
    constructor(monster, inventory, seed, requiredItemNames) {
        var _a;
        this.discardPile = [];
        this.monster = monster;
        this.seedState = { value: seed || 1 };
        this.drawPile = this.buildDeck(inventory);
        if (this.drawPile.length === 0) {
            this.drawPile.push({
                id: "scratch-0",
                itemName: "scratch",
                title: "Scratch",
                energy: 1,
                damage: 1,
                block: 0,
                healing: 0,
            });
        }
        this.shuffle(this.drawPile);
        this.state = {
            monsterHealth: monster.health,
            monsterMaxHealth: monster.health,
            playerHealth: 10,
            playerMaxHealth: 10,
            block: 0,
            energy: 3,
            monsterIntent: (_a = monster.attackPattern[0]) !== null && _a !== void 0 ? _a : 0,
            hand: [],
            status: "playing",
            turn: 1,
        };
        this.drawCards(monster.handSize);
        this.ensureRequiredCards(requiredItemNames);
    }
    getState() {
        return Object.assign(Object.assign({}, this.state), { hand: [...this.state.hand] });
    }
    playCard(cardId) {
        if (this.state.status !== "playing") {
            return false;
        }
        const index = this.state.hand.findIndex(card => card.id === cardId);
        const card = this.state.hand[index];
        if (card === undefined || card.energy > this.state.energy) {
            return false;
        }
        this.state.energy -= card.energy;
        this.state.monsterHealth = Math.max(0, this.state.monsterHealth - card.damage);
        this.state.block += card.block;
        this.state.playerHealth = Math.min(this.state.playerMaxHealth, this.state.playerHealth + card.healing);
        this.state.hand.splice(index, 1);
        this.discardPile.push(card);
        if (this.state.monsterHealth === 0) {
            this.state.status = "won";
        }
        return true;
    }
    endTurn() {
        var _a;
        if (this.state.status !== "playing") {
            return false;
        }
        const damage = Math.max(0, this.state.monsterIntent - this.state.block);
        this.state.playerHealth = Math.max(0, this.state.playerHealth - damage);
        if (this.state.playerHealth === 0) {
            this.state.status = "lost";
            return true;
        }
        this.discardPile.push(...this.state.hand);
        this.state.hand = [];
        this.state.block = 0;
        this.state.energy = 3;
        this.state.turn++;
        this.state.monsterIntent = (_a = this.monster.attackPattern[(this.state.turn - 1) % this.monster.attackPattern.length]) !== null && _a !== void 0 ? _a : 0;
        this.drawCards(this.monster.handSize);
        return true;
    }
    buildDeck(inventory) {
        const cards = [];
        for (const [itemName, quantity] of Object.entries(inventory)) {
            const cardType = CardGame.CARD_TYPES[itemName];
            if (cardType === undefined || quantity <= 0) {
                continue;
            }
            const copies = Math.min(Math.floor(quantity), 3);
            for (let copy = 0; copy < copies; copy++) {
                cards.push(Object.assign(Object.assign({}, cardType), { id: itemName + "-" + copy }));
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
            const swapIndex = Math.floor(this.random() * (index + 1));
            [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
        }
    }
    random() {
        let value = this.seedState.value | 0;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.seedState.value = value;
        return (value >>> 0) / 4294967296;
    }
}
CardGame.CARD_TYPES = {
    stick: { itemName: "stick", title: "Stick", energy: 1, damage: 1, block: 0, healing: 0 },
    stone: { itemName: "stone", title: "Stone", energy: 1, damage: 0, block: 2, healing: 0 },
    root: { itemName: "root", title: "Root", energy: 1, damage: 0, block: 0, healing: 1 },
    hay: { itemName: "hay", title: "Hay", energy: 1, damage: 0, block: 1, healing: 0 },
    "iron ore": { itemName: "iron ore", title: "Iron ore", energy: 1, damage: 1, block: 1, healing: 0 },
    iron: { itemName: "iron", title: "Iron", energy: 1, damage: 0, block: 3, healing: 0 },
    club: { itemName: "club", title: "Club", energy: 1, damage: 3, block: 0, healing: 0 },
    "stone axe": { itemName: "stone axe", title: "Stone axe", energy: 2, damage: 4, block: 0, healing: 0 },
    sword: { itemName: "sword", title: "Sword", energy: 2, damage: 6, block: 0, healing: 0 },
    heart: { itemName: "heart", title: "Heart", energy: 1, damage: 0, block: 0, healing: 3 },
};
