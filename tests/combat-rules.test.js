import assert from "node:assert/strict";
import test from "node:test";

import { CardGame } from "../js/CardGame.js";
import { MonsterDefinition } from "../js/MonsterDefinition.js";

const TRAINING_MONSTER = new MonsterDefinition(
    "training monster",
    50,
    5,
    3,
    3,
    5,
);

function requiredCardGame(itemName, seed = 12345) {
    return new CardGame(
        TRAINING_MONSTER,
        { [itemName]: 1 },
        seed,
        [itemName],
        {},
        50,
    );
}

function playRequiredCard(itemName) {
    const game = requiredCardGame(itemName);
    const card = game.getState().hand.find(value => value.itemName === itemName);
    assert.notEqual(card, undefined);
    const resolution = game.playPlayerCard(card.id);
    assert.notEqual(resolution, null);

    return { game, resolution };
}

test("weapon, potion, and shield cards keep their exact combat values", () => {
    const cardValues = [
        ["wooden shield", 0, 4, 0],
        ["reinforced shield", 0, 6, 0],
        ["healing potion", 0, 0, 10],
        ["poison potion", 10, 0, 0],
        ["iron-spiked club", 4, 0, 0],
        ["iron hand axe", 5, 0, 0],
        ["flanged mace", 6, 0, 0],
        ["bearded battle axe", 7, 0, 0],
        ["arming sword", 8, 0, 0],
        ["war hammer", 9, 0, 0],
        ["longsword", 10, 0, 0],
        ["two-handed battle axe", 11, 0, 0],
        ["poleaxe", 12, 0, 0],
        ["masterwork greatsword", 14, 0, 0],
        ["poisoned masterwork greatsword", 18, 0, 0],
        ["bone knife", 3, 0, 0],
        ["spiked cudgel", 4, 0, 0],
        ["iron dagger", 5, 0, 0],
        ["falchion", 6, 0, 0],
        ["morning star", 7, 0, 0],
        ["war pick", 8, 0, 0],
        ["heavy crossbow", 9, 0, 0],
        ["zweihander", 10, 0, 0],
        ["halberd", 11, 0, 0],
        ["executioner's axe", 12, 0, 0],
        ["estoc", 13, 0, 0],
        ["bec de corbin", 14, 0, 0],
        ["gothic mace", 15, 0, 0],
        ["runed longsword", 16, 0, 0],
        ["blacksteel glaive", 17, 0, 0],
        ["relic warhammer", 18, 0, 0],
        ["dragonbone axe", 19, 0, 0],
        ["royal claymore", 20, 0, 0],
        ["obsidian polearm", 21, 0, 0],
        ["dungeon-forged greatblade", 22, 0, 0],
    ];

    for (const [itemName, damage, block, healing] of cardValues) {
        const { resolution } = playRequiredCard(itemName);
        assert.deepEqual(
            {
                damage: resolution.card.damage,
                block: resolution.card.block,
                healing: resolution.card.healing,
            },
            { damage, block, healing },
            itemName,
        );
    }
});

test("three player and monster plays complete a round and reset for the next", () => {
    const passiveMonster = new MonsterDefinition(
        "round tester",
        50,
        0,
        3,
        3,
        5,
    );
    const game = new CardGame(passiveMonster, {}, 7654321, [], {}, 100);

    for (let play = 1; play <= 3; play++) {
        const playerState = game.getState();
        assert.equal(playerState.phase, "player");
        const playerResolution = game.playPlayerCard(playerState.hand[0].id);
        assert.notEqual(playerResolution, null);
        assert.equal(game.getState().phase, "monster");

        const monsterResolution = game.playMonsterCard();
        assert.notEqual(monsterResolution, null);
        assert.equal(monsterResolution.roundComplete, play === 3);
    }

    assert.equal(game.getState().phase, "dealing");
    game.dealNextRound();
    const nextRound = game.getState();
    assert.equal(nextRound.phase, "player");
    assert.equal(nextRound.round, 2);
    assert.equal(nextRound.playerPlayedCount, 0);
    assert.equal(nextRound.monsterPlayedCount, 0);
    assert.equal(nextRound.hand.length, 5);
});

test("shields absorb monster damage before player health", () => {
    let checked = false;
    for (let seed = 1; seed <= 500 && !checked; seed++) {
        const game = requiredCardGame("wooden shield", seed);
        const shield = game.getState().hand.find(
            card => card.itemName === "wooden shield",
        );
        assert.notEqual(shield, undefined);
        game.playPlayerCard(shield.id);
        const healthBefore = game.getState().playerHealth;
        const resolution = game.playMonsterCard();
        assert.notEqual(resolution, null);
        if (resolution.card.damage <= 0) {
            continue;
        }

        const damageEffect = resolution.effects.find(
            effect => effect.type === "damage",
        );
        assert.notEqual(damageEffect, undefined);
        const expectedBlocked = Math.min(4, resolution.card.damage);
        assert.equal(damageEffect.blocked, expectedBlocked);
        assert.equal(
            game.getState().playerHealth,
            healthBefore - Math.max(0, resolution.card.damage - 4),
        );
        checked = true;
    }

    assert.equal(checked, true, "no deterministic damaging monster card found");
});

test("invalid card plays and out-of-phase actions do nothing", () => {
    const game = requiredCardGame("club");
    const initial = game.getState();
    assert.equal(game.playPlayerCard("missing-card"), null);
    assert.equal(game.playMonsterCard(), null);
    assert.deepEqual(game.getState(), initial);
    game.dealNextRound();
    assert.deepEqual(game.getState(), initial);
});

test("a full combat deck selects attack, block, healing, and overall strength", () => {
    const inventory = {
        "dungeon-forged greatblade": 3,
        "obsidian polearm": 3,
        "royal claymore": 3,
        "dragonbone axe": 3,
        "relic warhammer": 3,
        "reinforced shield": 3,
        "wooden shield": 3,
        "healing potion": 3,
        yarrow: 3,
        stick: 3,
        stone: 3,
    };
    const game = new CardGame(
        TRAINING_MONSTER,
        inventory,
        76543,
        [],
        {},
        50,
    );
    const deck = game.getSelectedDeck();

    assert.equal(deck.length, 19);
    assert.equal(new Set(deck.map(card => card.id)).size, 19);
    for (const itemName of [
        "dungeon-forged greatblade",
        "obsidian polearm",
        "royal claymore",
    ]) {
        assert.equal(
            deck.filter(card => card.itemName === itemName).length,
            3,
            itemName,
        );
    }
    assert.ok(deck.some(card => card.itemName === "dragonbone axe"));
    assert.equal(
        deck.filter(card => card.itemName === "reinforced shield").length,
        3,
    );
    assert.equal(
        deck.filter(card => card.itemName === "healing potion").length,
        3,
    );
    assert.equal(deck.some(card => card.itemName === "stick"), false);
    assert.equal(deck.some(card => card.itemName === "stone"), false);
});

test("every portable item can become a modest fight card", () => {
    const game = new CardGame(
        TRAINING_MONSTER,
        {
            coin: 1,
            hay: 1,
            hide: 1,
            "padded hide": 1,
            calendula: 1,
            "grave dust": 1,
            "ancient nail": 1,
            "dungeon moss": 1,
            chest: 1,
            "bone rat": 1,
            "dungeon dragon": 1,
            "weathered button": 1,
            "dungeon entrance": 1,
            "shop entrance": 1,
            "stairs up": 1,
            furnace: 1,
            "armorer's bench": 1,
            "bone carving": 1,
            "cat buying stick": 1,
        },
        86420,
        ["grave dust"],
        {},
        50,
    );
    const cards = new Map(
        game.getSelectedDeck().map(card => [card.itemName, card]),
    );
    const effect = itemName => {
        const card = cards.get(itemName);
        assert.notEqual(card, undefined, itemName);

        return [card.damage, card.block, card.healing];
    };

    assert.deepEqual(effect("coin"), [1, 0, 0]);
    assert.deepEqual(effect("hay"), [0, 1, 0]);
    assert.deepEqual(effect("hide"), [0, 2, 0]);
    assert.deepEqual(effect("padded hide"), [0, 3, 0]);
    assert.deepEqual(effect("calendula"), [0, 0, 2]);
    assert.deepEqual(effect("grave dust"), [1, 0, 0]);
    assert.deepEqual(effect("ancient nail"), [2, 0, 0]);
    assert.deepEqual(effect("dungeon moss"), [0, 0, 2]);
    assert.deepEqual(effect("chest"), [0, 3, 0]);
    assert.deepEqual(effect("bone rat"), [1, 0, 0]);
    assert.deepEqual(effect("dungeon dragon"), [7, 1, 0]);
    assert.deepEqual(effect("weathered button"), [1, 0, 0]);
    assert.equal(
        game.getState().hand.some(card => card.itemName === "grave dust"),
        true,
    );

    for (const itemName of [
        "dungeon entrance",
        "shop entrance",
        "stairs up",
        "furnace",
        "armorer's bench",
        "bone carving",
        "cat buying stick",
    ]) {
        assert.equal(cards.has(itemName), false, itemName);
    }
});

test("extra weak materials replace passes without removing existing equipment", () => {
    const baseInventory = {
        club: 1,
        "stone axe": 1,
        sword: 1,
        torch: 2,
        "wooden shield": 1,
        yarrow: 3,
    };
    const baseGame = new CardGame(
        TRAINING_MONSTER,
        baseInventory,
        24680,
        ["torch"],
        {},
        20,
    );
    const gatheredGame = new CardGame(
        TRAINING_MONSTER,
        {
            ...baseInventory,
            stick: 3,
            stone: 3,
            root: 3,
            "iron ore": 3,
        },
        24680,
        ["torch"],
        {},
        20,
    );
    const baseDeck = baseGame.getSelectedDeck();
    const gatheredDeck = gatheredGame.getSelectedDeck();
    const gatheredIds = new Set(gatheredDeck.map(card => card.id));

    assert.equal(baseDeck.length, 19);
    assert.equal(gatheredDeck.length, 19);
    assert.ok(
        gatheredDeck.filter(card => card.itemName === "pass").length
            < baseDeck.filter(card => card.itemName === "pass").length,
    );
    for (const card of baseDeck.filter(card => card.itemName !== "pass")) {
        assert.equal(gatheredIds.has(card.id), true, card.id);
    }
});

test("durable equipment returns in later rounds but potions do not", () => {
    const passiveMonster = new MonsterDefinition(
        "durability tester",
        50,
        0,
        3,
        3,
        5,
    );
    const equipmentGame = new CardGame(
        passiveMonster,
        { club: 1 },
        13579,
        ["club"],
        {},
        100,
    );
    let clubPlays = 0;
    for (let round = 0; round < 12 && clubPlays < 2; round++) {
        for (let play = 0; play < 3; play++) {
            const state = equipmentGame.getState();
            const card = state.hand.find(value => value.itemName === "club")
                ?? state.hand[0];
            assert.notEqual(card, undefined);
            if (card.itemName === "club") {
                clubPlays++;
            }
            equipmentGame.playPlayerCard(card.id);
            equipmentGame.playMonsterCard();
        }
        if (equipmentGame.getState().phase === "dealing") {
            equipmentGame.dealNextRound();
        }
    }
    assert.ok(clubPlays >= 2);

    const potionGame = new CardGame(
        passiveMonster,
        { "healing potion": 1 },
        97531,
        ["healing potion"],
        {},
        100,
    );
    const potion = potionGame.getState().hand.find(
        card => card.itemName === "healing potion",
    );
    assert.notEqual(potion, undefined);
    potionGame.playPlayerCard(potion.id);
    potionGame.playMonsterCard();
    for (let exchange = 0; exchange < 12; exchange++) {
        const state = potionGame.getState();
        if (state.phase === "dealing") {
            potionGame.dealNextRound();
            continue;
        }
        if (state.phase === "player") {
            assert.equal(
                state.hand.some(card => card.itemName === "healing potion"),
                false,
            );
            potionGame.playPlayerCard(state.hand[0].id);
        } else {
            potionGame.playMonsterCard();
        }
    }
});

test("player health is exactly the gathered yarrow quantity", () => {
    assert.equal(CardGame.playerHealthForYarrow(0), 0);
    assert.equal(CardGame.playerHealthForYarrow(1), 1);
    assert.equal(CardGame.playerHealthForYarrow(8), 8);
});

test("high-tier monsters can deterministically receive more than 50 health", () => {
    const dragon = MonsterDefinition.get("dungeon dragon");
    assert.notEqual(dragon, null);
    const healthValues = () => Array.from({ length: 200 }, (_, index) => {
        const game = new CardGame(dragon, {}, index + 1, [], {}, 100);

        return game.getState().monsterMaxHealth;
    });
    const firstRun = healthValues();
    const replay = healthValues();

    assert.ok(Math.max(...firstRun) > 50);
    assert.deepEqual(firstRun, replay);
});

function chooseUsefulCard(state) {
    const monsterBlock = state.monsterShields.reduce(
        (total, shield) => total + shield.remainingBlock,
        0,
    );
    const missingHealth = state.playerMaxHealth - state.playerHealth;
    const choices = state.hand.map(card => {
        const damage = Math.max(0, card.damage - monsterBlock);
        const healing = Math.min(card.healing, missingHealth);

        return {
            card,
            score: damage * 8 + healing * 5 + card.block * 4
                + (card.itemName === "pass" ? -100 : 0),
        };
    }).sort((first, second) => second.score - first.score);

    return choices[0].card;
}

function deterministicWinRate(monsterName, inventory, seedCount = 400) {
    const monster = MonsterDefinition.get(monsterName);
    assert.notEqual(monster, null);
    let victories = 0;
    for (let seed = 1; seed <= seedCount; seed++) {
        const game = new CardGame(
            monster,
            inventory,
            seed,
            ["torch"],
            {},
            CardGame.playerHealthForYarrow(inventory.yarrow ?? 0),
        );
        for (let step = 0; step < 500; step++) {
            const state = game.getState();
            if (state.status !== "playing") {
                break;
            }
            if (state.phase === "player") {
                game.playPlayerCard(chooseUsefulCard(state).id);
            } else if (state.phase === "monster") {
                game.playMonsterCard();
            } else {
                game.dealNextRound();
            }
        }
        if (game.getState().status === "won") {
            victories++;
        }
    }

    return victories / seedCount;
}

test("surface fights preserve a loss, recovery, and mastery progression", () => {
    const firstRat = deterministicWinRate("rat", {
        club: 1,
        torch: 1,
        yarrow: 1,
    });
    const preparedRat = deterministicWinRate("rat", {
        club: 1,
        "stone axe": 1,
        torch: 2,
        yarrow: 5,
    });
    const preparedOrc = deterministicWinRate("orc", {
        club: 1,
        "stone axe": 1,
        sword: 1,
        torch: 3,
        "wooden shield": 1,
        yarrow: 9,
    });
    const earlyTroll = deterministicWinRate("troll", {
        club: 1,
        "stone axe": 1,
        sword: 1,
        torch: 3,
        "wooden shield": 1,
        yarrow: 8,
    });
    const preparedTroll = deterministicWinRate("troll", {
        "iron-spiked club": 1,
        "iron hand axe": 1,
        "flanged mace": 1,
        "bearded battle axe": 1,
        "arming sword": 1,
        torch: 3,
        "reinforced shield": 1,
        yarrow: 13,
    });

    assert.ok(firstRat >= 0.05 && firstRat <= 0.25, firstRat);
    assert.ok(preparedRat >= 0.45 && preparedRat <= 0.80, preparedRat);
    assert.ok(preparedOrc >= 0.45 && preparedOrc <= 0.75, preparedOrc);
    assert.ok(earlyTroll <= 0.20, earlyTroll);
    assert.ok(preparedTroll >= 0.45 && preparedTroll <= 0.75, preparedTroll);
});

test("a short final gathering trip can turn the strongest fight around", () => {
    const weapons = [
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
        "poisoned masterwork greatsword",
    ];
    const lateInventory = Object.fromEntries(
        weapons.map(itemName => [itemName, 1]),
    );
    Object.assign(lateInventory, {
        "reinforced shield": 1,
        "healing potion": 1,
        "poison potion": 1,
        "grave dust": 3,
        yarrow: 25,
    });
    const initialAttempt = deterministicWinRate(
        "dungeon dragon",
        lateInventory,
        300,
    );
    const gatheredAttempt = deterministicWinRate(
        "dungeon dragon",
        { ...lateInventory, yarrow: 30 },
        300,
    );

    assert.ok(initialAttempt <= 0.25, initialAttempt);
    assert.ok(
        gatheredAttempt >= 0.30 && gatheredAttempt <= 0.70,
        gatheredAttempt,
    );
});
