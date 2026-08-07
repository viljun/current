import assert from "node:assert/strict";
import test from "node:test";

import { CardGame } from "../js/CardGame.js";
import { MonsterDefinition } from "../js/MonsterDefinition.js";

const INVENTORY = {
    stick: 3,
    stone: 3,
    root: 3,
    torch: 3,
    club: 3,
    "stone axe": 3,
    sword: 3,
    "wooden shield": 3,
    "reinforced shield": 3,
    "healing potion": 2,
    "poison potion": 2,
};

function fightTranscript(seed) {
    const monster = MonsterDefinition.get("crypt knight");
    assert.notEqual(monster, null);
    const game = new CardGame(
        monster,
        INVENTORY,
        seed,
        {},
        50,
    );
    const transcript = [{ state: game.getState() }];

    for (let step = 0; step < 80; step++) {
        const state = game.getState();
        if (state.status !== "playing") {
            break;
        }
        if (state.phase === "player") {
            const card = state.hand[
                (state.round + state.playerPlayedCount) % state.hand.length
            ];
            assert.notEqual(card, undefined);
            transcript.push({ resolution: game.playPlayerCard(card.id) });
        } else if (state.phase === "monster") {
            transcript.push({ resolution: game.playMonsterCard() });
        } else if (state.phase === "dealing") {
            game.dealNextRound();
            transcript.push({ state: game.getState() });
        }
    }
    transcript.push({ state: game.getState() });

    return transcript;
}

test("the same fight seed and actions produce an identical full transcript", () => {
    assert.deepEqual(fightTranscript(123456789), fightTranscript(123456789));
});

test("different fight seeds produce deterministic variation", () => {
    assert.notDeepEqual(fightTranscript(123456789), fightTranscript(987654321));
});

test("combat state snapshots cannot mutate the running fight", () => {
    const monster = MonsterDefinition.get("orc");
    assert.notEqual(monster, null);
    const game = new CardGame(monster, INVENTORY, 456789, {}, 30);
    const externalState = game.getState();
    const originalHealth = externalState.playerHealth;
    externalState.playerHealth = 0;
    externalState.hand.length = 0;
    externalState.playerShields.push({
        id: "external",
        title: "External",
        remainingBlock: 999,
    });

    const internalState = game.getState();
    assert.equal(internalState.playerHealth, originalHealth);
    assert.ok(internalState.hand.length > 0);
    assert.deepEqual(internalState.playerShields, []);
});
