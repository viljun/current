import assert from "node:assert/strict";
import test from "node:test";

import { CardGame } from "../js/CardGame.js";
import { defeatTipsForInventory } from "../js/FightView.js";
import { MonsterDefinition } from "../js/MonsterDefinition.js";

const TRAINING_MONSTER = new MonsterDefinition(
    "training monster",
    50,
    5,
    3,
    3,
    5,
);

function singleCardGame(itemName, seed = 12345) {
    return new CardGame(
        TRAINING_MONSTER,
        { [itemName]: 1 },
        seed,
        {},
        50,
    );
}

function playSingleCard(itemName) {
    const game = singleCardGame(itemName);
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
        ["yarrow poultice", 0, 0, 3],
        ["healing potion", 0, 0, 10],
        ["river feast", 0, 0, 7],
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
        const { resolution } = playSingleCard(itemName);
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

test("permanent spells raise every matching player card value", () => {
    const game = new CardGame(
        TRAINING_MONSTER,
        {
            club: 1,
            "wooden shield": 1,
            "healing potion": 1,
            "spell of force": 4,
            "spell of mending": 3,
            "spell of warding": 2,
        },
        445566,
        {},
        50,
        {
            damage: 4,
            healing: 3,
            block: 2,
        },
    );
    const deck = game.getSelectedDeck();
    assert.equal(deck.find(card => card.itemName === "club")?.damage, 7);
    assert.equal(
        deck.find(card => card.itemName === "wooden shield")?.block,
        6,
    );
    assert.equal(
        deck.find(card => card.itemName === "healing potion")?.healing,
        13,
    );
    assert.equal(
        deck.some(card => card.itemName.startsWith("spell of ")),
        false,
    );
    assert.deepEqual(game.getState().playerEnchantments, {
        damage: 4,
        healing: 3,
        block: 2,
    });

    const fistGame = new CardGame(
        TRAINING_MONSTER,
        {},
        778899,
        {},
        50,
        { damage: 2, healing: 5, block: 7 },
    );
    assert.equal(
        fistGame.getState().hand.every(card =>
            card.itemName === "bare fist"
            && card.damage === 3
            && card.healing === 0
            && card.block === 0
        ),
        true,
    );
});

test("both sides receive four cards and play two before the next round", () => {
    const passiveMonster = new MonsterDefinition(
        "round tester",
        50,
        0,
        3,
        3,
        5,
    );
    const game = new CardGame(passiveMonster, {}, 7654321, {}, 100);

    assert.equal(game.getState().hand.length, 4);
    assert.equal(
        game.getState().hand.every(
            card => card.title === "Bare Fist" && card.damage === 1,
        ),
        true,
    );
    assert.equal(game.getState().monsterHandSize, 4);
    for (let play = 1; play <= 2; play++) {
        const playerState = game.getState();
        assert.equal(playerState.phase, "player");
        const playerResolution = game.playPlayerCard(playerState.hand[0].id);
        assert.notEqual(playerResolution, null);
        assert.equal(game.getState().phase, "monster");

        const monsterResolution = game.playMonsterCard();
        assert.notEqual(monsterResolution, null);
        assert.equal(monsterResolution.roundComplete, play === 2);
    }

    assert.equal(game.getState().phase, "dealing");
    game.dealNextRound();
    const nextRound = game.getState();
    assert.equal(nextRound.phase, "player");
    assert.equal(nextRound.round, 2);
    assert.equal(nextRound.playerPlayedCount, 0);
    assert.equal(nextRound.monsterPlayedCount, 0);
    assert.equal(nextRound.hand.length, 4);
    assert.equal(nextRound.monsterHandSize, 4);
});

test("shields absorb monster damage before player health", () => {
    let checked = false;
    for (let seed = 1; seed <= 500 && !checked; seed++) {
        const game = singleCardGame("wooden shield", seed);
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
    const game = singleCardGame("club");
    const initial = game.getState();
    assert.equal(game.playPlayerCard("missing-card"), null);
    assert.equal(game.playMonsterCard(), null);
    assert.deepEqual(game.getState(), initial);
    game.dealNextRound();
    assert.deepEqual(game.getState(), initial);
});

test("the combat deck includes every owned item that has a card", () => {
    const inventory = {
        "dungeon-forged greatblade": 5,
        "obsidian polearm": 3,
        "royal claymore": 3,
        "dragonbone axe": 3,
        "relic warhammer": 3,
        "reinforced shield": 3,
        "wooden shield": 3,
        "healing potion": 3,
        "yarrow poultice": 2,
        yarrow: 3,
        hay: 3,
        stick: 3,
        stone: 3,
    };
    const game = new CardGame(
        TRAINING_MONSTER,
        inventory,
        76543,
        {},
        50,
    );
    const deck = game.getSelectedDeck();
    const expectedCardCount = Object.entries(inventory).reduce(
        (total, [itemName, quantity]) =>
            total + (CardGame.itemCardEffects(itemName) === null ? 0 : quantity),
        0,
    );

    assert.equal(deck.length, expectedCardCount);
    assert.equal(new Set(deck.map(card => card.id)).size, expectedCardCount);
    for (const [itemName, quantity] of Object.entries(inventory)) {
        if (["yarrow", "hay", "stick", "stone"].includes(itemName)) {
            continue;
        }
        assert.equal(
            deck.filter(card => card.itemName === itemName).length,
            quantity,
            itemName,
        );
    }
    assert.equal(deck.some(card => card.itemName === "yarrow"), false);
    assert.equal(deck.some(card => card.itemName === "hay"), false);
    assert.equal(deck.some(card => card.itemName === "stick"), false);
    assert.equal(deck.some(card => card.itemName === "stone"), false);
});

test("portable inventory items without card definitions stay out of the deck", () => {
    const game = new CardGame(
        TRAINING_MONSTER,
        {
            coin: 1,
            hay: 1,
            calendula: 1,
            "grave dust": 1,
            "bone rat": 1,
            "weathered button": 1,
            stick: 1,
            torch: 1,
            rat: 1,
            yarrow: 1,
            "yarrow poultice": 1,
        },
        86420,
        {},
        50,
    );
    const itemNames = game.getSelectedDeck().map(card => card.itemName).sort();

    assert.deepEqual(
        itemNames,
        ["rat", "yarrow poultice"],
    );
    for (const rawMaterial of ["stick", "stone", "root", "iron ore"]) {
        assert.equal(CardGame.itemCardEffects(rawMaterial), null);
    }
    assert.equal(CardGame.itemCardEffects("yarrow"), null);
    assert.equal(CardGame.itemCardEffects("hay"), null);
    assert.equal(CardGame.itemCardEffects("torch"), null);
    assert.deepEqual(CardGame.itemCardEffects("yarrow poultice"), {
        damage: 0,
        block: 0,
        healing: 3,
    });
});

test("adding raw materials does not change the combat deck", () => {
    const baseInventory = {
        club: 1,
        "stone axe": 1,
        sword: 1,
        torch: 2,
        "wooden shield": 1,
        "yarrow poultice": 3,
    };
    const baseGame = new CardGame(
        TRAINING_MONSTER,
        baseInventory,
        24680,
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
        {},
        20,
    );
    const baseDeck = baseGame.getSelectedDeck();
    const gatheredDeck = gatheredGame.getSelectedDeck();
    const gatheredIds = new Set(gatheredDeck.map(card => card.id));

    assert.equal(baseDeck.length, 7);
    assert.equal(gatheredDeck.length, 7);
    assert.deepEqual([...gatheredIds].sort(), baseDeck.map(card => card.id).sort());
});

test("every revealed card is discarded after the round and inventory is unchanged", () => {
    const passiveMonster = new MonsterDefinition(
        "durability tester",
        50,
        0,
        3,
        3,
        5,
    );
    const inventory = {
        "wooden shield": 5,
        "reinforced shield": 3,
    };
    const inventoryBefore = structuredClone(inventory);
    const game = new CardGame(
        passiveMonster,
        inventory,
        13579,
        {},
        100,
    );
    const firstHandIds = game.getState().hand.map(card => card.id);
    for (let play = 0; play < 2; play++) {
        const card = game.getState().hand[0];
        assert.notEqual(card, undefined);
        game.playPlayerCard(card.id);
        game.playMonsterCard();
    }
    assert.equal(game.getState().phase, "dealing");
    game.dealNextRound();
    const secondHandIds = game.getState().hand.map(card => card.id);

    assert.equal(
        secondHandIds.some(cardId => firstHandIds.includes(cardId)),
        false,
    );
    assert.deepEqual(inventory, inventoryBefore);
});

test("player health is exactly the gathered yarrow quantity", () => {
    assert.equal(CardGame.playerHealthForYarrow(0), 0);
    assert.equal(CardGame.playerHealthForYarrow(1), 1);
    assert.equal(CardGame.playerHealthForYarrow(8), 8);
});

test("defeat advice prioritizes weaknesses and always includes deck guidance", () => {
    const weakDeckTips = defeatTipsForInventory({
        club: 5,
        yarrow: 2,
    });
    assert.deepEqual(
        weakDeckTips.slice(0, 3).map(tip => tip.id),
        ["deck", "health", "weapons"],
    );
    assert.equal(weakDeckTips.length, 11);
    assert.equal(
        weakDeckTips.find(tip => tip.id === "deck")?.text,
        "Avoid filling your deck with low-tier items. "
            + "A few strong items work better than a pile of weak ones.",
    );
    assert.equal(
        weakDeckTips.find(tip => tip.id === "retry")?.text,
        "The same choices always lead to the same result. "
            + "After a defeat, try different cards to find a winning sequence.",
    );
    assert.equal(
        weakDeckTips.find(tip => tip.id === "safe")?.text,
        "Defeat costs you nothing. You keep every item, so you can retry freely.",
    );
    assert.equal(
        weakDeckTips.find(tip => tip.id === "bare-fist")?.text,
        "“Bare Fist” appears when you run out of fight items. "
            + "Craft more useful equipment—your knuckles have done enough.",
    );

    const preparedTips = defeatTipsForInventory({
        "dungeon-forged greatblade": 1,
        "reinforced shield": 1,
        "healing potion": 1,
        "spell of force": 1,
        "spell of mending": 1,
        "spell of warding": 1,
        yarrow: 20,
    });
    assert.deepEqual(
        preparedTips.slice(0, 3).map(tip => tip.id),
        ["bare-fist", "deck", "weapons"],
    );

    const oneClubTips = defeatTipsForInventory({
        club: 1,
        rat: 2,
        "poison potion": 1,
        yarrow: 3,
    });
    assert.equal(
        oneClubTips.find(tip => tip.id === "more-clubs")?.text,
        "Craft more clubs to add more attacks to your deck. "
            + "One club only swings once per capture.",
    );
    assert.equal(
        defeatTipsForInventory({
            club: 1,
            "stone axe": 1,
            yarrow: 3,
        }).some(tip => tip.id === "more-clubs"),
        false,
    );
    assert.equal(
        defeatTipsForInventory({
            club: 2,
            yarrow: 3,
        }).some(tip => tip.id === "more-clubs"),
        false,
    );

    const firstRatTips = defeatTipsForInventory({
        club: 1,
        yarrow: 3,
    }, "rat");
    assert.equal(
        firstRatTips.find(tip => tip.id === "find-another-monster")?.text,
        "If this rat is too strong, find another rat. "
            + "The next one may be less fierce.",
    );
    assert.equal(firstRatTips[0]?.id, "find-another-monster");
    const experiencedRatTips = defeatTipsForInventory({
        club: 1,
        rat: 1,
        yarrow: 3,
    }, "rat");
    assert.equal(
        experiencedRatTips[experiencedRatTips.length - 1]?.id,
        "find-another-monster",
    );
    const firstOrcTips = defeatTipsForInventory({
        club: 1,
        yarrow: 3,
    }, "orc");
    assert.equal(
        firstOrcTips.find(tip => tip.id === "find-another-monster")?.text,
        "If this orc is too strong, find another orc. "
            + "The next one may be less fierce.",
    );
    assert.equal(firstOrcTips[0]?.id, "find-another-monster");
});

test("high-tier monsters can deterministically receive more than 50 health", () => {
    const dragon = MonsterDefinition.get("dungeon dragon");
    assert.notEqual(dragon, null);
    const healthValues = () => Array.from({ length: 200 }, (_, index) => {
        const game = new CardGame(dragon, {}, index + 1, {}, 100);

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
            score: damage * 8 + healing * 5 + card.block * 4,
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
        club: 2,
        "stone axe": 2,
        sword: 2,
        torch: 3,
        "wooden shield": 2,
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
    assert.ok(preparedTroll >= 0.50 && preparedTroll <= 0.75, preparedTroll);
});

test("a short final gathering trip still improves the strongest fight", () => {
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
        yarrow: 22,
    });
    const initialAttempt = deterministicWinRate(
        "dungeon dragon",
        lateInventory,
        300,
    );
    const gatheredAttempt = deterministicWinRate(
        "dungeon dragon",
        { ...lateInventory, yarrow: 25 },
        300,
    );

    assert.ok(
        initialAttempt >= 0.50 && initialAttempt <= 0.70,
        initialAttempt,
    );
    assert.ok(
        gatheredAttempt >= 0.60 && gatheredAttempt <= 0.80,
        gatheredAttempt,
    );
    assert.ok(gatheredAttempt >= initialAttempt + 0.05);
});
