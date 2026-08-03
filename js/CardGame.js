import { MonsterDefinition } from "./MonsterDefinition.js";
import { ItemType } from "./ItemType.js";
export class CardGame {
    constructor(monster, inventory, seed, requiredItemNames, itemOrigins, playerHealth) {
        this.reusablePlayedCards = [];
        this.passCardIndex = 0;
        this.monsterHand = [];
        this.monster = monster;
        this.fightSeed = seed || 1;
        this.seedState = { value: this.fightSeed };
        this.handSize = monster.handSize;
        this.selectedDeck = this.buildDeck(inventory, itemOrigins, requiredItemNames);
        this.drawPile = this.selectedDeck.map(card => (Object.assign({}, card)));
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
        };
        this.drawCards(this.handSize);
        this.ensureRequiredCards(requiredItemNames);
        this.dealMonsterCards();
    }
    generateMonsterHealth() {
        const maximumHealth = Math.max(50, this.monster.health + 12);
        const choices = Array.from({ length: maximumHealth }, (_, index) => {
            const health = index + 1;
            return {
                health,
                weight: Math.max(1, Math.round(100000 * Math.pow(.72, Math.abs(health - this.monster.health)))),
            };
        });
        const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
        let roll = this.fightHash("monster-health") % totalWeight;
        for (const choice of choices) {
            if (roll < choice.weight) {
                return choice.health;
            }
            roll -= choice.weight;
        }
        return this.monster.health;
    }
    getState() {
        return Object.assign(Object.assign({}, this.state), { playerShields: this.state.playerShields.map(shield => (Object.assign({}, shield))), monsterShields: this.state.monsterShields.map(shield => (Object.assign({}, shield))), hand: this.state.hand.map(card => (Object.assign({}, card))) });
    }
    getSelectedDeck() {
        return this.selectedDeck.map(card => (Object.assign({}, card)));
    }
    static playerHealthForYarrow(yarrowQuantity) {
        return Math.max(0, Math.floor(yarrowQuantity));
    }
    playPlayerCard(cardId) {
        if (this.state.status !== "playing" || this.state.phase !== "player") {
            return null;
        }
        const cardIndex = this.state.hand.findIndex(card => card.id === cardId);
        const card = this.state.hand[cardIndex];
        if (card === undefined) {
            return null;
        }
        this.state.hand.splice(cardIndex, 1);
        if (card.reusable) {
            this.reusablePlayedCards.push(card);
        }
        this.state.playerPlayedCount++;
        const resolution = this.resolveCard("player", card);
        if (this.state.status === "playing") {
            this.state.phase = "monster";
        }
        return resolution;
    }
    playMonsterCard() {
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
            if (this.state.playerPlayedCount === CardGame.CARDS_PER_ROUND
                && this.state.monsterPlayedCount === CardGame.CARDS_PER_ROUND) {
                this.state.phase = "dealing";
                resolution.roundComplete = true;
            }
            else {
                this.state.phase = "player";
            }
        }
        return resolution;
    }
    dealNextRound() {
        if (this.state.status !== "playing" || this.state.phase !== "dealing") {
            return;
        }
        this.drawPile.push(...this.state.hand.filter(card => card.itemName !== "pass"), ...this.reusablePlayedCards);
        this.reusablePlayedCards = [];
        this.shuffle(this.drawPile);
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
    resolveCard(actor, card) {
        const effects = [];
        const target = actor === "player" ? "monster" : "player";
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
    resolution(actor, card, effects) {
        return {
            actor,
            card: Object.assign({}, card),
            effects,
            monsterDefeated: this.state.status === "won",
            playerDefeated: this.state.status === "lost",
            roundComplete: false,
        };
    }
    applyDamage(target, damage) {
        const shields = this.shieldsOf(target);
        let remainingDamage = damage;
        let blocked = 0;
        const shieldHits = [];
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
    applyHealing(actor, healing) {
        const healthBefore = this.healthOf(actor);
        const maximum = actor === "player"
            ? this.state.playerMaxHealth
            : this.state.monsterMaxHealth;
        this.setHealth(actor, Math.min(maximum, healthBefore + healing));
        return this.healthOf(actor) - healthBefore;
    }
    finishFight(defeated) {
        this.state.status = defeated === "monster" ? "won" : "lost";
        this.state.phase = "finished";
    }
    healthOf(combatant) {
        return combatant === "player"
            ? this.state.playerHealth
            : this.state.monsterHealth;
    }
    setHealth(combatant, health) {
        if (combatant === "player") {
            this.state.playerHealth = health;
        }
        else {
            this.state.monsterHealth = health;
        }
    }
    shieldsOf(combatant) {
        return combatant === "player"
            ? this.state.playerShields
            : this.state.monsterShields;
    }
    dealMonsterCards() {
        this.monsterHand = [];
        const cardRange = this.monster.maximumCards - this.monster.minimumCards + 1;
        const cardCount = this.monster.minimumCards
            + this.monsterCardHash("card-count") % cardRange;
        for (let index = 0; index < cardCount; index++) {
            const itemName = this.monsterCardItem(index);
            this.monsterHand.push(this.monsterCard(itemName, index));
        }
        this.state.monsterHandSize = this.monsterHand.length;
    }
    monsterCardItem(index) {
        const choices = Object.entries(CardGame.ITEM_QUALITY).map(([itemName, quality]) => ({
            itemName,
            weight: Math.max(1, Math.round(10000 * Math.pow(.42, Math.abs(quality - this.monster.cardStrength)))),
        }));
        const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
        let roll = this.monsterCardHash("card-item:" + index) % totalWeight;
        for (const choice of choices) {
            if (roll < choice.weight) {
                return choice.itemName;
            }
            roll -= choice.weight;
        }
        return "pass";
    }
    monsterCard(itemName, index) {
        var _a;
        const cardType = (_a = CardGame.CARD_TYPES[itemName]) !== null && _a !== void 0 ? _a : CardGame.CARD_TYPES.pass;
        return Object.assign(Object.assign({ id: "monster-" + this.state.round + "-" + index }, cardType), { reusable: false, origin: itemName === "pass"
                ? null
                : this.monsterCardOrigin(itemName, index) });
    }
    monsterCardOrigin(itemName, index) {
        const latitudeHash = this.monsterCardHash(itemName + ":latitude:" + index);
        const longitudeHash = this.monsterCardHash(itemName + ":longitude:" + index);
        return {
            latitude: 10000 + latitudeHash % 900000,
            longitude: 10000 + longitudeHash % 900000,
            areaId: 1,
        };
    }
    monsterCardHash(text) {
        return this.fightHash(text, this.state.round);
    }
    fightHash(text, round = 0) {
        let hash = this.fightSeed ^ Math.imul(round, 65537);
        for (let index = 0; index < text.length; index++) {
            hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
        }
        hash ^= hash >>> 16;
        return hash >>> 0;
    }
    chooseMonsterCard() {
        var _a;
        if (this.monsterHand.length === 0) {
            return null;
        }
        const lethalCards = this.monsterHand.filter(card => {
            return Math.max(0, card.damage - this.totalShield("player"))
                >= this.state.playerHealth;
        });
        const candidates = lethalCards.length > 0 ? lethalCards : this.monsterHand;
        const ranked = [...candidates].sort((first, second) => this.monsterCardScore(second) - this.monsterCardScore(first));
        const best = (_a = ranked[0]) !== null && _a !== void 0 ? _a : null;
        const alternative = ranked[1];
        if (lethalCards.length === 0
            && best !== null
            && alternative !== undefined
            && this.monsterCardScore(alternative)
                >= Math.max(0, this.monsterCardScore(best) * 0.35)
            && this.useAlternativeChoice()) {
            return alternative;
        }
        return best;
    }
    monsterCardScore(card) {
        const playerShield = this.totalShield("player");
        const effectiveDamage = Math.min(this.state.playerHealth, Math.max(0, card.damage - playerShield));
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
        if (card.damage > 0 && effectiveDamage === 0)
            score -= 3;
        if (card.healing > 0 && effectiveHealing === 0)
            score -= 4;
        if (card.block > 0 && effectiveBlock === 0)
            score -= 2;
        return score + this.deterministicBias(card.id);
    }
    deterministicBias(cardId) {
        let hash = this.fightSeed ^ (this.state.round * 1009)
            ^ (this.state.monsterPlayedCount * 9173);
        for (let index = 0; index < cardId.length; index++) {
            hash = Math.imul(hash ^ cardId.charCodeAt(index), 16777619);
        }
        hash ^= hash >>> 16;
        return ((hash >>> 0) % 401) / 100 - 2;
    }
    useAlternativeChoice() {
        let value = this.fightSeed ^ Math.imul(this.state.round, 7919)
            ^ Math.imul(this.state.monsterPlayedCount, 104729);
        value ^= value >>> 15;
        value = Math.imul(value, 2246822519);
        value ^= value >>> 13;
        return (value >>> 0) % 4 === 0;
    }
    totalShield(combatant) {
        return this.shieldsOf(combatant).reduce((total, shield) => total + shield.remainingBlock, 0);
    }
    buildDeck(inventory, itemOrigins, requiredItemNames) {
        var _a, _b, _c;
        const cards = [];
        const inventoryEntries = Object.entries(inventory).sort(([first], [second]) => first < second ? -1 : first > second ? 1 : 0);
        for (const [itemName, quantity] of inventoryEntries) {
            const cardType = (_a = CardGame.CARD_TYPES[itemName]) !== null && _a !== void 0 ? _a : this.portableCardType(itemName);
            if (cardType === undefined || quantity <= 0) {
                continue;
            }
            const copies = Math.min(Math.floor(quantity), 3);
            for (let copy = 0; copy < copies; copy++) {
                cards.push(Object.assign(Object.assign({}, cardType), { id: itemName + "-" + copy, reusable: CardGame.REUSABLE_ITEMS.has(itemName), origin: (_c = (_b = itemOrigins[itemName]) === null || _b === void 0 ? void 0 : _b[copy]) !== null && _c !== void 0 ? _c : null }));
            }
        }
        return this.selectBalancedDeck(cards, requiredItemNames);
    }
    portableCardType(itemName) {
        var _a;
        if (!new ItemType(itemName).isPortableFightItem()) {
            return undefined;
        }
        const monster = MonsterDefinition.get(itemName);
        const effects = monster === null
            ? (_a = CardGame.PORTABLE_CARD_EFFECTS[itemName]) !== null && _a !== void 0 ? _a : [1, 0, 0]
            : [
                Math.max(1, Math.min(7, Math.round(monster.cardStrength))),
                monster.cardStrength >= 3 ? 1 : 0,
                0,
            ];
        return {
            itemName,
            title: itemName.charAt(0).toUpperCase() + itemName.slice(1),
            damage: effects[0],
            block: effects[1],
            healing: effects[2],
        };
    }
    selectBalancedDeck(cards, requiredItemNames) {
        const selected = [];
        const selectedIds = new Set();
        const roleCounts = {
            attack: 0,
            block: 0,
            healing: 0,
            overall: 0,
        };
        const addCard = (card, role) => {
            if (selectedIds.has(card.id)) {
                return;
            }
            selected.push(card);
            selectedIds.add(card.id);
            roleCounts[role]++;
        };
        const takeBest = (candidates, role, limit, score) => {
            const sorted = [...candidates].sort((first, second) => score(second) - score(first)
                || this.totalCardValue(second) - this.totalCardValue(first)
                || (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));
            for (const card of sorted) {
                if (roleCounts[role] >= limit) {
                    break;
                }
                addCard(card, role);
            }
        };
        const requiredNames = [...new Set(requiredItemNames)].sort();
        for (const itemName of requiredNames) {
            const card = cards.find(candidate => candidate.itemName === itemName);
            if (card === undefined) {
                continue;
            }
            const role = card.damage > 0
                ? "attack"
                : card.block > 0
                    ? "block"
                    : card.healing > 0
                        ? "healing"
                        : "overall";
            addCard(card, role);
        }
        takeBest(cards.filter(card => card.damage > 0), "attack", CardGame.ATTACK_CARD_LIMIT, card => card.damage);
        takeBest(cards.filter(card => card.block > 0), "block", CardGame.BLOCK_CARD_LIMIT, card => card.block);
        takeBest(cards.filter(card => card.healing > 0), "healing", CardGame.HEALING_CARD_LIMIT, card => card.healing);
        takeBest(cards, "overall", CardGame.OVERALL_CARD_LIMIT, card => this.totalCardValue(card));
        const targetSize = CardGame.ATTACK_CARD_LIMIT
            + CardGame.BLOCK_CARD_LIMIT
            + CardGame.HEALING_CARD_LIMIT
            + CardGame.OVERALL_CARD_LIMIT;
        const remaining = cards
            .filter(card => !selectedIds.has(card.id))
            .sort((first, second) => this.totalCardValue(second) - this.totalCardValue(first)
            || (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));
        for (const card of remaining) {
            if (selected.length >= targetSize) {
                break;
            }
            selected.push(card);
        }
        while (selected.length < targetSize) {
            selected.push(this.createPassCard());
        }
        return selected;
    }
    totalCardValue(card) {
        return card.damage + card.block + card.healing;
    }
    drawCards(quantity) {
        var _a;
        while (this.state.hand.length < quantity) {
            this.state.hand.push((_a = this.drawPile.pop()) !== null && _a !== void 0 ? _a : this.createPassCard());
        }
    }
    createPassCard() {
        return Object.assign(Object.assign({ id: "pass-" + this.passCardIndex++ }, CardGame.CARD_TYPES.pass), { reusable: false, origin: null });
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
                if (replacedCard.itemName !== "pass") {
                    this.drawPile.push(replacedCard);
                }
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
}
CardGame.CARDS_PER_ROUND = 3;
CardGame.ATTACK_CARD_LIMIT = 10;
CardGame.BLOCK_CARD_LIMIT = 3;
CardGame.HEALING_CARD_LIMIT = 3;
CardGame.OVERALL_CARD_LIMIT = 3;
CardGame.REUSABLE_ITEMS = new Set([
    "wooden shield",
    "reinforced shield",
    "club",
    "stone axe",
    "sword",
    "iron-spiked club",
    "iron hand axe",
    "flanged mace",
    "bearded battle axe",
    "arming sword",
    "war hammer",
    "longsword",
    "two-handed battle axe",
    "poleaxe",
    "masterwork greatsword",
    "poisoned masterwork greatsword",
    "bone knife",
    "spiked cudgel",
    "iron dagger",
    "falchion",
    "morning star",
    "war pick",
    "heavy crossbow",
    "zweihander",
    "halberd",
    "executioner's axe",
    "estoc",
    "bec de corbin",
    "gothic mace",
    "runed longsword",
    "blacksteel glaive",
    "relic warhammer",
    "dragonbone axe",
    "royal claymore",
    "obsidian polearm",
    "dungeon-forged greatblade",
]);
CardGame.PORTABLE_CARD_EFFECTS = {
    coin: [1, 0, 0],
    hay: [0, 1, 0],
    hide: [0, 2, 0],
    iron: [2, 1, 0],
    "padded hide": [0, 3, 0],
    crucible: [1, 2, 0],
    chest: [0, 3, 0],
    treasure: [2, 1, 0],
    calendula: [0, 0, 2],
    chamomile: [0, 0, 2],
    lavender: [0, 0, 2],
    "red poppy": [0, 0, 2],
    cornflower: [0, 0, 2],
    bones: [1, 0, 0],
    "cracked skull": [2, 0, 0],
    "rusted chain": [0, 2, 0],
    "grave dust": [1, 0, 0],
    "bat wing": [0, 0, 1],
    "spider silk": [0, 1, 0],
    "black candle": [0, 0, 1],
    "ancient nail": [2, 0, 0],
    "broken tile": [2, 0, 0],
    "dungeon moss": [0, 0, 2],
};
CardGame.ITEM_QUALITY = {
    pass: 0,
    "wooden shield": 4,
    "reinforced shield": 6,
    stick: 1,
    root: 1,
    stone: 1.5,
    rat: 1.5,
    torch: 2,
    "iron ore": 2,
    club: 3,
    yarrow: 3,
    orc: 3.5,
    "stone axe": 4,
    sword: 5,
    troll: 5.5,
};
CardGame.CARD_TYPES = {
    pass: { itemName: "pass", title: "Pass", damage: 0, block: 0, healing: 0 },
    "wooden shield": { itemName: "wooden shield", title: "Wooden shield", damage: 0, block: 4, healing: 0 },
    "reinforced shield": { itemName: "reinforced shield", title: "Reinforced shield", damage: 0, block: 6, healing: 0 },
    stick: { itemName: "stick", title: "Stick", damage: 1, block: 0, healing: 0 },
    stone: { itemName: "stone", title: "Stone", damage: 1, block: 0, healing: 0 },
    root: { itemName: "root", title: "Root", damage: 0, block: 0, healing: 1 },
    torch: { itemName: "torch", title: "Torch", damage: 2, block: 1, healing: 0 },
    "iron ore": { itemName: "iron ore", title: "Iron ore", damage: 1, block: 1, healing: 0 },
    club: { itemName: "club", title: "Club", damage: 3, block: 0, healing: 0 },
    "stone axe": { itemName: "stone axe", title: "Stone axe", damage: 4, block: 0, healing: 0 },
    sword: { itemName: "sword", title: "Sword", damage: 6, block: 0, healing: 0 },
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
    yarrow: { itemName: "yarrow", title: "Yarrow", damage: 0, block: 0, healing: 3 },
    rat: { itemName: "rat", title: "Rat", damage: 2, block: 0, healing: 0 },
    orc: { itemName: "orc", title: "Orc", damage: 4, block: 2, healing: 0 },
    troll: { itemName: "troll", title: "Troll", damage: 7, block: 2, healing: 0 },
};
