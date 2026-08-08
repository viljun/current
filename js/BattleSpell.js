/**
 * Highland battle spells. Their books are inventory items and fight cards;
 * their combat state is deliberately temporary and is never persisted.
 */
export class BattleSpell {
    static get(itemName) {
        var _a;
        return (_a = BattleSpell.DEFINITIONS.find(definition => definition.itemName === itemName)) !== null && _a !== void 0 ? _a : null;
    }
    static forEffect(effect) {
        const definition = BattleSpell.DEFINITIONS.find(candidate => candidate.effect === effect);
        if (definition === undefined) {
            throw new Error("Unknown battle spell effect: " + effect);
        }
        return definition;
    }
    static names() {
        return BattleSpell.DEFINITIONS.map(definition => definition.itemName);
    }
    static isBattleSpell(itemName) {
        return BattleSpell.get(itemName) !== null;
    }
}
BattleSpell.DEFINITIONS = [
    {
        itemName: "frostbind grimoire",
        title: "Frostbind",
        effect: "freeze",
        icon: "❄",
        shortLabel: "Freeze",
        description: "The opponent skips every remaining action this round.",
        ingredients: [
            { itemName: "healing potion", quantity: 1 },
            { itemName: "dungeon moss", quantity: 3 },
            { itemName: "black candle", quantity: 1 },
            { itemName: "broken tile", quantity: 2 },
            { itemName: "coin", quantity: 300 },
        ],
    },
    {
        itemName: "mire of time grimoire",
        title: "Mire of Time",
        effect: "slow",
        icon: "⌛",
        shortLabel: "Slow",
        description: "The opponent gets only one action per round for the rest of the fight.",
        ingredients: [
            { itemName: "binding rope", quantity: 3 },
            { itemName: "spider silk", quantity: 4 },
            { itemName: "grave dust", quantity: 2 },
            { itemName: "yarrow poultice", quantity: 2 },
            { itemName: "coin", quantity: 350 },
        ],
    },
    {
        itemName: "ward sunder grimoire",
        title: "Ward Sunder",
        effect: "sunder",
        icon: "◈",
        shortLabel: "½ block",
        description: "Halves all current and future opponent block for the rest of the fight. Further casts halve it again.",
        ingredients: [
            { itemName: "war hammer", quantity: 1 },
            { itemName: "ancient nail", quantity: 4 },
            { itemName: "rusted chain", quantity: 3 },
            { itemName: "cracked skull", quantity: 1 },
            { itemName: "coin", quantity: 450 },
        ],
    },
    {
        itemName: "withering curse grimoire",
        title: "Withering Curse",
        effect: "curse",
        icon: "☠",
        shortLabel: "Corrupt heal",
        description: "Opponent healing becomes poison damage for the rest of the fight.",
        ingredients: [
            { itemName: "poison potion", quantity: 2 },
            { itemName: "grave dust", quantity: 4 },
            { itemName: "black candle", quantity: 2 },
            { itemName: "bat wing", quantity: 3 },
            { itemName: "coin", quantity: 500 },
        ],
    },
    {
        itemName: "feeblemind grimoire",
        title: "Feeblemind",
        effect: "weaken",
        icon: "↘",
        shortLabel: "½ attack",
        description: "Halves all opponent attack values for the rest of the fight. Further casts halve them again.",
        ingredients: [
            { itemName: "healing potion", quantity: 1 },
            { itemName: "dungeon moss", quantity: 4 },
            { itemName: "bat wing", quantity: 3 },
            { itemName: "grave dust", quantity: 2 },
            { itemName: "coin", quantity: 400 },
        ],
    },
    {
        itemName: "unravel grimoire",
        title: "Unravel",
        effect: "unravel",
        icon: "✦",
        shortLabel: "Break block",
        description: "Immediately destroys all block the opponent has built.",
        ingredients: [
            { itemName: "reinforced shield", quantity: 1 },
            { itemName: "rusted chain", quantity: 4 },
            { itemName: "ancient nail", quantity: 4 },
            { itemName: "iron", quantity: 8 },
            { itemName: "coin", quantity: 425 },
        ],
    },
    {
        itemName: "stone covenant grimoire",
        title: "Stone Covenant",
        effect: "stoneward",
        icon: "⬟",
        shortLabel: "Keep block",
        description: "Your unused block carries into later rounds for the rest of the fight.",
        ingredients: [
            { itemName: "reinforced shield", quantity: 1 },
            { itemName: "stone", quantity: 12 },
            { itemName: "broken tile", quantity: 5 },
            { itemName: "iron", quantity: 6 },
            { itemName: "treasure", quantity: 1 },
            { itemName: "coin", quantity: 550 },
        ],
    },
    {
        itemName: "crimson covenant grimoire",
        title: "Crimson Covenant",
        effect: "lifesteal",
        icon: "♥",
        shortLabel: "Life-steal",
        description: "Your attacks heal half the health damage they deal. A second cast raises this to full healing.",
        ingredients: [
            { itemName: "healing potion", quantity: 2 },
            { itemName: "poison potion", quantity: 1 },
            { itemName: "hide", quantity: 5 },
            { itemName: "bat wing", quantity: 4 },
            { itemName: "yarrow", quantity: 5 },
            { itemName: "coin", quantity: 600 },
        ],
    },
    {
        itemName: "arcane echo grimoire",
        title: "Arcane Echo",
        effect: "echo",
        icon: "Ⅱ",
        shortLabel: "Echo next",
        description: "The next non-spell item you play resolves twice.",
        ingredients: [
            { itemName: "runed longsword", quantity: 1 },
            { itemName: "black candle", quantity: 3 },
            { itemName: "grave dust", quantity: 5 },
            { itemName: "treasure", quantity: 2 },
            { itemName: "coin", quantity: 750 },
        ],
    },
    {
        itemName: "doom mark grimoire",
        title: "Doom Mark",
        effect: "doom",
        icon: "✥",
        shortLabel: "+2 damage",
        description: "Every attack you play deals 2 extra damage to the opponent. Doom Marks stack.",
        ingredients: [
            { itemName: "dungeon-forged greatblade", quantity: 1 },
            { itemName: "cracked skull", quantity: 3 },
            { itemName: "black candle", quantity: 3 },
            { itemName: "poison potion", quantity: 2 },
            { itemName: "treasure", quantity: 3 },
            { itemName: "coin", quantity: 1000 },
        ],
    },
];
