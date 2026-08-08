import assert from "node:assert/strict";
import test from "node:test";

import { BattleSpell } from "../js/BattleSpell.js";
import { CardGame } from "../js/CardGame.js";
import { Coordinates } from "../js/Coordinates.js";
import { HighlandMap } from "../js/HighlandMap.js";
import { ItemTaking } from "../js/ItemTaking.js";
import { ItemType } from "../js/ItemType.js";
import { MonsterDefinition } from "../js/MonsterDefinition.js";

const TRAINING_MONSTER = new MonsterDefinition(
    "spell target",
    80,
    6,
    4,
    4,
    8,
);

function spellGame(itemName, otherItems = {}, seed = 314159) {
    return new CardGame(
        TRAINING_MONSTER,
        { [itemName]: 1, ...otherItems },
        seed,
        {},
        80,
    );
}

function play(game, itemName) {
    const card = game.getState().hand.find(
        candidate => candidate.itemName === itemName,
    );
    assert.notEqual(card, undefined, itemName + " was not dealt");
    const resolution = game.playPlayerCard(card.id);
    assert.notEqual(resolution, null);

    return resolution;
}

test("all ten Highland battle spells have complex existing-item recipes", () => {
    assert.equal(BattleSpell.DEFINITIONS.length, 10);
    assert.equal(
        new Set(BattleSpell.DEFINITIONS.map(spell => spell.effect)).size,
        10,
    );
    const definedItems = new Set([
        "coin", "healing potion", "dungeon moss", "black candle",
        "broken tile", "binding rope", "spider silk", "grave dust",
        "yarrow poultice", "war hammer", "ancient nail", "rusted chain",
        "cracked skull", "poison potion", "bat wing", "reinforced shield",
        "iron", "stone", "treasure", "hide", "yarrow",
        "runed longsword", "dungeon-forged greatblade",
    ]);

    for (const spell of BattleSpell.DEFINITIONS) {
        const changes = new ItemType(spell.itemName).prizes();
        assert.ok(changes.length >= 5, spell.itemName + " recipe is too simple");
        assert.equal(
            changes.every(change => change.quantity < 0),
            true,
            spell.itemName + " must consume only current materials",
        );
        assert.equal(
            changes.every(change => definedItems.has(change.itemType.name)),
            true,
            spell.itemName + " uses an unknown material",
        );
        assert.ok(
            changes.some(change =>
                change.itemType.name === "coin" && change.quantity <= -300
            ),
            spell.itemName + " needs no substantial coin payment",
        );
        const quantities = Object.fromEntries(changes.map(change => [
            change.itemType.name,
            -change.quantity,
        ]));
        assert.deepEqual(
            new ItemTaking(
                new ItemType(spell.itemName),
                { totalQuantities: quantities },
            ).summary().missing,
            [],
        );
    }
});

test("battle spell copies become cards while permanent spells do not", () => {
    const inventory = Object.fromEntries(
        BattleSpell.DEFINITIONS.map((spell, index) => [
            spell.itemName,
            index % 3 + 1,
        ]),
    );
    inventory["spell of force"] = 2;
    const game = new CardGame(
        TRAINING_MONSTER,
        inventory,
        271828,
        {},
        80,
    );
    const deck = game.getSelectedDeck();
    for (const spell of BattleSpell.DEFINITIONS) {
        assert.equal(
            deck.filter(card => card.itemName === spell.itemName).length,
            inventory[spell.itemName],
            spell.itemName,
        );
        assert.equal(
            CardGame.itemCardSpecialEffect(spell.itemName),
            spell.effect,
        );
    }
    assert.equal(deck.some(card => card.itemName === "spell of force"), false);
});

test("every battle spell applies its temporary deterministic modifier", () => {
    const checks = {
        freeze: (modifiers, state) =>
            modifiers.monsterFrozenRound === state.round,
        slow: state => state.monsterActionsPerRound === 1,
        sunder: state => state.monsterBlockDivisor === 2,
        curse: state => state.monsterHealingPoisoned,
        weaken: state => state.monsterDamageDivisor === 2,
        unravel: (_modifiers, state) => state.monsterShields.length === 0,
        stoneward: state => state.playerKeepsBlock,
        lifesteal: state => state.playerLifeStealPercent === 50,
        echo: state => state.playerEchoCharges === 1,
        doom: state => state.monsterVulnerability === 2,
    };
    for (const spell of BattleSpell.DEFINITIONS) {
        const game = spellGame(spell.itemName);
        const resolution = play(game, spell.itemName);
        assert.equal(
            resolution.effects.some(effect =>
                effect.type === "special" && effect.special === spell.effect
            ),
            true,
            spell.itemName,
        );
        const state = game.getState();
        assert.equal(checks[spell.effect](state.modifiers, state), true);
    }
});

test("freeze and slow remove the intended monster actions", () => {
    const frozen = spellGame("frostbind grimoire");
    play(frozen, "frostbind grimoire");
    assert.equal(frozen.playMonsterCard()?.card.itemName, "frozen turn");
    play(frozen, "bare fist");
    const secondFrozen = frozen.playMonsterCard();
    assert.equal(secondFrozen?.card.itemName, "frozen turn");
    assert.equal(secondFrozen?.roundComplete, true);

    const slowed = spellGame("mire of time grimoire");
    play(slowed, "mire of time grimoire");
    const firstMonsterAction = slowed.playMonsterCard();
    assert.notEqual(firstMonsterAction?.card.itemName, "slowed turn");
    play(slowed, "bare fist");
    const skipped = slowed.playMonsterCard();
    assert.equal(skipped?.card.itemName, "slowed turn");
    assert.equal(skipped?.roundComplete, true);
});

test("echo doubles the next item and Doom Mark adds attack damage", () => {
    const echo = spellGame("arcane echo grimoire", { club: 1 });
    play(echo, "arcane echo grimoire");
    echo.playMonsterCard();
    const echoedClub = play(echo, "club");
    assert.equal(echoedClub.card.damage, 6);
    assert.equal(echo.getState().modifiers.playerEchoCharges, 0);

    const doom = spellGame("doom mark grimoire", { club: 1 });
    play(doom, "doom mark grimoire");
    doom.playMonsterCard();
    const doomedClub = play(doom, "club");
    const damage = doomedClub.effects.find(effect => effect.type === "damage");
    assert.notEqual(damage, undefined);
    assert.equal(damage.amount + damage.blocked, 5);
});

test("all ten spellbooks occur on walkable Highland cells", () => {
    const found = new Set();
    for (let latitude = -450; latitude <= 450 && found.size < 10; latitude++) {
        for (
            let longitude = -450;
            longitude <= 450 && found.size < 10;
            longitude++
        ) {
            const coordinates = new Coordinates(latitude, longitude);
            const item = HighlandMap.itemAt(coordinates);
            if (
                item !== null
                && BattleSpell.isBattleSpell(item.name)
                && HighlandMap.allowsItemAt(coordinates, item)
            ) {
                found.add(item.name);
            }
        }
    }
    assert.deepEqual(
        [...found].sort(),
        BattleSpell.names().sort(),
    );
});
