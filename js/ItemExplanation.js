import { CardGame } from "./CardGame.js";
import { BattleSpell } from "./BattleSpell.js";
import { ItemType } from "./ItemType.js";
import { View } from "./View.js";
export class ItemExplanation {
    static for(itemName, latitude, longitude, areaId) {
        return ItemExplanation.sectionsFor(itemName, latitude, longitude, areaId).map(section => section.heading + ": " + section.text).join("\n\n");
    }
    static sectionsFor(itemName, latitude, longitude, areaId) {
        const key = [
            itemName,
            ItemExplanation.numberKey(latitude),
            ItemExplanation.numberKey(longitude),
            areaId,
        ].join("|");
        const facts = ItemExplanation.factSections(itemName, key);
        const sections = [];
        const addSection = (heading, sentences) => {
            if (sentences.length > 0) {
                sections.push({
                    heading,
                    text: sentences.join(" "),
                });
            }
        };
        addSection("Catch", facts.catch);
        addSection("Make", facts.make);
        addSection("Use", facts.use);
        addSection("Fight", facts.fight);
        sections.push({
            heading: "Field note",
            text: ItemExplanation.fieldNoteFor(itemName, key),
        });
        return sections;
    }
    static element(itemName, latitude, longitude, areaId) {
        const container = document.createElement("div");
        container.className = "item-explanation";
        const sections = ItemExplanation.sectionsFor(itemName, latitude, longitude, areaId);
        const facts = sections.filter(section => section.heading !== "Field note");
        if (facts.length > 0) {
            const factList = document.createElement("dl");
            factList.className = "item-explanation-facts";
            for (const section of facts) {
                const heading = document.createElement("dt");
                heading.className = "item-explanation-heading";
                heading.textContent = section.heading;
                const text = document.createElement("dd");
                text.className = "item-explanation-text";
                text.textContent = section.text;
                factList.append(heading, text);
            }
            container.append(factList);
        }
        const fieldNote = sections.find(section => section.heading === "Field note");
        if (fieldNote !== undefined) {
            const note = document.createElement("footer");
            note.className = "item-explanation-note";
            const quote = document.createElement("q");
            quote.textContent = fieldNote.text;
            note.append(quote);
            container.append(note);
        }
        return container;
    }
    static displayName(itemName) {
        const names = {
            "magician selling force spell": "Force magician",
            "magician selling mending spell": "Mending magician",
            "magician selling warding spell": "Warding magician",
            "spell of force": "Spell of Force",
            "spell of mending": "Spell of Mending",
            "spell of warding": "Spell of Warding",
            "highland gate": "Highland gate",
        };
        if (names[itemName] !== undefined) {
            return names[itemName];
        }
        const battleSpell = BattleSpell.get(itemName);
        if (battleSpell !== null) {
            return battleSpell.title;
        }
        return itemName.charAt(0).toUpperCase() + itemName.slice(1);
    }
    static categoryFor(itemName) {
        const itemType = new ItemType(itemName);
        if (itemType.isMonster()) {
            return "Monster";
        }
        if (itemName.startsWith("magician selling ")) {
            return "Spell merchant";
        }
        if (itemName.startsWith("spell of ")) {
            return "Permanent enchantment";
        }
        if (BattleSpell.isBattleSpell(itemName)) {
            return "Battle spell";
        }
        if (itemName === "highland gate") {
            return "Realm entrance";
        }
        if (itemName === "campfire") {
            return "Cooking fire";
        }
        if (ItemType.isRiverFish(itemName)) {
            return "River fish";
        }
        if (itemName === "river feast") {
            return "Cooked healing item";
        }
        if (itemName === "coin") {
            return "Currency";
        }
        if (itemName === "yarrow") {
            return "Medicinal plant";
        }
        if (itemName === "binding rope") {
            return "Capture tool";
        }
        if (itemName === "worm") {
            return "Fishing bait";
        }
        const crafted = itemType.prizes().some(change => change.quantity < 0);
        const effects = CardGame.itemCardEffects(itemName);
        if (effects !== null) {
            if (effects.healing > 0) {
                return crafted ? "Crafted healing item" : "Healing item";
            }
            if (effects.block > effects.damage) {
                return crafted ? "Crafted shield" : "Shield";
            }
            if (effects.damage >= 3) {
                return crafted ? "Crafted weapon" : "Weapon";
            }
            return crafted ? "Crafted combat item" : "Combat item";
        }
        if (ItemExplanation.craftingUses(itemName).length > 0) {
            return "Crafting material";
        }
        if (crafted) {
            return "Crafted item";
        }
        return "Item";
    }
    static factSections(itemName, key) {
        const itemType = new ItemType(itemName);
        const changes = itemType.prizes();
        const expenses = changes.filter(change => change.quantity < 0);
        const rewards = changes.filter(change => change.quantity > 0);
        const sections = {
            make: [],
            catch: [],
            use: [],
            fight: [],
        };
        if (itemName.startsWith("magician selling ")) {
            sections.use.push("Buy this magician's spell with coins. Its bonus is permanent.");
        }
        else if (ItemType.isRiverFish(itemName)) {
            sections.catch.push(ItemExplanation.pick(ItemExplanation.FISH_CATCH_FACTS, key, "fish-catch"));
        }
        else if (itemType.isMonster()) {
            if (expenses.length > 0) {
                sections.fight.push(ItemExplanation.fact(ItemExplanation.MONSTER_COST_FACTS, key, "monster-cost", [["items", ItemExplanation.changesText(expenses)]]));
            }
            if (rewards.length > 0) {
                sections.fight.push(ItemExplanation.fact(ItemExplanation.MONSTER_REWARD_FACTS, key, "monster-reward", [["items", ItemExplanation.changesText(rewards)]]));
            }
        }
        else if (expenses.length > 0 && rewards.length > 0) {
            sections.make.push(ItemExplanation.fact(ItemExplanation.TRANSFORMATION_FACTS, key, "transformation", [
                ["cost", ItemExplanation.changesText(expenses)],
                ["reward", ItemExplanation.changesText(rewards)],
            ]));
        }
        else if (expenses.length > 0) {
            sections.make.push(ItemExplanation.fact(ItemExplanation.CRAFTING_COST_FACTS, key, "crafting-cost", [["items", ItemExplanation.changesText(expenses)]]));
        }
        else if (rewards.length > 0) {
            sections.make.push(ItemExplanation.fact(ItemExplanation.COLLECTION_REWARD_FACTS, key, "collection-reward", [["items", ItemExplanation.changesText(rewards)]]));
        }
        const craftingUses = ItemExplanation.craftingUses(itemName);
        if (craftingUses.length > 0) {
            sections.use.push(ItemExplanation.fact(ItemExplanation.CRAFTING_USE_FACTS, key, "crafting-use", [[
                    "uses",
                    ItemExplanation.namesText(craftingUses, "recipe", name => "the " + name + " recipe"),
                ]]));
        }
        if (itemName === "worm") {
            sections.use.push(ItemExplanation.pick(ItemExplanation.WORM_USE_FACTS, key, "worm-use"));
        }
        const fightUses = ItemExplanation.fightUses(itemName);
        if (fightUses.length > 0) {
            sections.fight.push(ItemExplanation.fact(ItemExplanation.FIGHT_USE_FACTS, key, "fight-use", [[
                    "uses",
                    ItemExplanation.namesText(fightUses, "monster", name => View.getQuantityText(name, 1)),
                ]]));
        }
        if (itemName === "coin") {
            sections.use.push(ItemExplanation.pick(ItemExplanation.COIN_FACTS, key, "coin"));
        }
        if (itemName === "yarrow") {
            sections.fight.push(ItemExplanation.pick(ItemExplanation.YARROW_FACTS, key, "yarrow"));
        }
        const permanentBonuses = {
            "spell of force": "Permanently adds 1 damage to every attack you play.",
            "spell of mending": "Permanently adds 1 healing to every healing item you play.",
            "spell of warding": "Permanently adds 1 block to every shield you play.",
        };
        const permanentBonus = permanentBonuses[itemName];
        if (permanentBonus !== undefined) {
            sections.fight.push(permanentBonus);
        }
        const battleSpell = BattleSpell.get(itemName);
        if (battleSpell !== null) {
            sections.fight.push(battleSpell.description);
        }
        if (itemName === "highland gate") {
            sections.use.push("Enter it to reach the rugged highlands and their ancient castles.");
        }
        const effects = CardGame.itemCardEffects(itemName);
        if (effects !== null) {
            const values = [];
            if (effects.damage > 0) {
                values.push(effects.damage + " damage");
            }
            if (effects.block > 0) {
                values.push(effects.block + " block");
            }
            if (effects.healing > 0) {
                values.push(effects.healing + " healing");
            }
            if (values.length > 0) {
                sections.fight.push(ItemExplanation.fact(ItemExplanation.COMBAT_EFFECT_FACTS, key, "combat-effects", [["values", ItemExplanation.list(values)]]));
            }
        }
        return sections;
    }
    static fieldNoteFor(itemName, key) {
        var _a;
        const exactNotes = ItemExplanation.ITEM_FIELD_NOTES[itemName];
        if (exactNotes !== undefined) {
            const craftingUses = ItemExplanation.craftingUses(itemName);
            if (craftingUses.length === 0) {
                return ItemExplanation.pick(exactNotes, key, "field-note");
            }
            const recipe = ItemExplanation.pick(craftingUses, key, "field-note-recipe");
            return ItemExplanation.pick([
                ...exactNotes,
                "The " + recipe + " recipe has reserved a place for this "
                    + itemName + ".",
                "Set the " + itemName + " beside the " + recipe
                    + " materials and it finally looks intentional.",
                "This " + itemName + " is one missing piece of the "
                    + recipe + " recipe.",
            ], key, "field-note");
        }
        const battleSpell = BattleSpell.get(itemName);
        if (battleSpell !== null) {
            const effectPhrases = {
                freeze: "stop an opponent before the round finishes",
                slow: "make an opponent perform at a more scholarly pace",
                sunder: "teach enemy armour the mathematical meaning of half",
                curse: "turn enemy healing into a deeply regrettable drink",
                weaken: "reduce enemy attacks without reducing their complaints",
                unravel: "remove every layer of enemy block at once",
                stoneward: "make unused block remember the next round",
                lifesteal: "return part of every wound as borrowed health",
                echo: "make the next ordinary item repeat itself",
                doom: "add two points of bad news to every attack",
            };
            return ItemExplanation.pick([
                "The " + battleSpell.title
                    + " grimoire's margins explain how to "
                    + effectPhrases[battleSpell.effect] + ".",
                "Even while closed, the " + battleSpell.title
                    + " grimoire looks ready to "
                    + effectPhrases[battleSpell.effect] + ".",
                "The clasp on the " + battleSpell.title
                    + " grimoire is mostly there to keep its "
                    + battleSpell.shortLabel.toLowerCase()
                    + " lesson indoors.",
            ], key, "battle-spell-field-note");
        }
        const buyingPrefix = "cat buying ";
        const sellingPrefix = "cat selling ";
        if (itemName.startsWith(buyingPrefix)
            || itemName.startsWith(sellingPrefix)) {
            const buying = itemName.startsWith(buyingPrefix);
            const merchandise = itemName.slice(buying ? buyingPrefix.length : sellingPrefix.length);
            return ItemExplanation.pick([
                "The merchant's whiskers move whenever the price of "
                    + merchandise + " changes.",
                buying
                    ? "This cat inspects " + merchandise
                        + " as though purchasing a minor kingdom."
                    : "This cat presents " + merchandise
                        + " as though selling a minor kingdom.",
            ], key, "merchant-field-note");
        }
        if (itemName.startsWith("magician selling ")) {
            return ItemExplanation.pick([
                "The magician prices permanent enchantments by power, rarity, and penmanship.",
                "A permanent spell includes no receipt and considerably more confidence.",
            ], key, "magician-field-note");
        }
        const itemType = new ItemType(itemName);
        if (itemType.isMonster()) {
            return ItemExplanation.monsterFieldNote(itemName, key);
        }
        const effects = CardGame.itemCardEffects(itemName);
        if (effects !== null && effects.healing > 0) {
            return ItemExplanation.pick([
                "The " + itemName + " restores " + effects.healing
                    + " health, which makes its smell tactically irrelevant.",
                "Keep the " + itemName + " within reach before "
                    + effects.healing + " healing becomes an urgent calculation.",
                "The " + itemName + " looks humble until it returns "
                    + effects.healing + " missing health.",
            ], key, "healing-field-note");
        }
        if (effects !== null && effects.block > effects.damage) {
            return ItemExplanation.pick([
                "The " + itemName + " places " + effects.block
                    + " block between its owner and an avoidable scar.",
                "Every mark on the " + itemName + " is evidence that "
                    + effects.block + " block stood in the right place.",
                "Keep the " + itemName + " facing outward; its "
                    + effects.block + " block works poorly behind you.",
            ], key, "defence-field-note");
        }
        if (effects !== null && effects.damage > 0) {
            return ItemExplanation.weaponFieldNote(itemName, effects.damage, key);
        }
        const craftingUses = ItemExplanation.craftingUses(itemName);
        if (craftingUses.length > 0) {
            const firstRecipe = (_a = craftingUses[0]) !== null && _a !== void 0 ? _a : "future equipment";
            return ItemExplanation.pick([
                "The " + firstRecipe + " recipe already has plans for this "
                    + itemName + ".",
                "Keep the " + itemName + " dry; the " + firstRecipe
                    + " recipe is waiting for it.",
                "This " + itemName + " stops looking like clutter beside the "
                    + firstRecipe + " recipe.",
            ], key, "material-field-note");
        }
        const changes = itemType.prizes();
        const rewards = changes.filter(change => change.quantity > 0);
        if (rewards.length > 0) {
            return ItemExplanation.pick([
                "The " + itemName + " is the practical route to "
                    + ItemExplanation.changesText(rewards) + ".",
                "Use the " + itemName + " correctly and it leaves "
                    + ItemExplanation.changesText(rewards) + " behind.",
            ], key, "reward-field-note");
        }
        return ItemExplanation.pick([
            "The " + itemName
                + " is exactly what its name promises, an uncommon courtesy here.",
            "No scholar has improved the " + itemName
                + " by renaming it, though several have tried.",
        ], key, "named-field-note");
    }
    static weaponFieldNote(itemName, damage, key) {
        const family = itemName.includes("crossbow")
            ? [
                "The " + itemName + " delivers " + damage
                    + " damage at the far end of a carefully wound string.",
                "Keep the " + itemName
                    + " pointed away while persuading its string to lock.",
                "A loaded " + itemName
                    + " makes distance feel like a particularly good invention.",
            ]
            : /axe|poleaxe/.test(itemName)
                ? [
                    "The edge of the " + itemName + " turns a committed swing into "
                        + damage + " damage.",
                    "An axe head should remain tighter than the wielder's grip on the plan.",
                    "The " + itemName
                        + " is equally offended by armour, timber, and careless toes.",
                ]
                : /hammer|mace|cudgel|club|morning star/.test(itemName)
                    ? [
                        "The " + itemName + " produces " + damage
                            + " damage without requiring a sharpened explanation.",
                        "A heavy head lets the " + itemName
                            + " settle arguments through armour.",
                        "Check the handle before the " + itemName
                            + " attempts to become a thrown weapon.",
                    ]
                    : /halberd|glaive|polearm/.test(itemName)
                        ? [
                            "The long shaft of the " + itemName
                                + " keeps its " + damage + " damage politely farther away.",
                            "Reach is the " + itemName
                                + "'s method of letting the monster make the first mistake.",
                            "Carry the " + itemName
                                + " horizontally only when friendship is no longer needed.",
                        ]
                        : /knife|dagger|estoc|war pick/.test(itemName)
                            ? [
                                "The narrow point of the " + itemName
                                    + " concentrates its " + damage + " damage where armour objects most.",
                                "A small point gives the " + itemName
                                    + " very specific opinions about gaps in armour.",
                                "The " + itemName
                                    + " is compact enough to hide and sharp enough to discourage it.",
                            ]
                            : [
                                "The edge of the " + itemName + " accounts for all "
                                    + damage + " points of its unfriendly reputation.",
                                "Keep the " + itemName
                                    + " oiled, sharpened, and outside your own boots.",
                                "The " + itemName
                                    + " works best when its edge reaches the monster before the speech does.",
                            ];
        return ItemExplanation.pick(family, key, "weapon-field-note");
    }
    static monsterFieldNote(itemName, key) {
        const creature = View.getQuantityText(itemName, 1);
        const namedCreature = creature.charAt(0).toUpperCase()
            + creature.slice(1);
        const notes = /rat/.test(itemName)
            ? [
                namedCreature + " can smell unattended food through several poor decisions.",
                "Count fingers after binding " + creature
                    + "; rats regard arithmetic as a snack.",
            ]
            : /spider/.test(itemName)
                ? [
                    namedCreature + " considers eight legs the minimum sensible equipment.",
                    "Bind " + creature
                        + " before discussing ownership of the surrounding web.",
                ]
                : /bat|banshee/.test(itemName)
                    ? [
                        namedCreature + " navigates darkness better than you navigate doorways.",
                        "The loudest part of " + creature
                            + " generally arrives before the rest.",
                    ]
                    : /skeleton|wight|ghoul|lich|bone|crypt/.test(itemName)
                        ? [
                            namedCreature + " has exceeded the usual limits of a working skeleton.",
                            "Binding " + creature
                                + " is easier once every bone agrees on a direction.",
                        ]
                        : /orc|goblin/.test(itemName)
                            ? [
                                namedCreature + " respects a strong knot more than a lengthy introduction.",
                                "Secure both hands of " + creature
                                    + " before admiring any captured weaponry.",
                            ]
                            : /troll|ogre|minotaur|colossus/.test(itemName)
                                ? [
                                    namedCreature + " requires more rope chiefly because there is more monster.",
                                    "If " + creature
                                        + " appears securely tied, inspect the knot from considerably farther away.",
                                ]
                                : /dragon|basilisk|vampire/.test(itemName)
                                    ? [
                                        namedCreature + " is rare because most witnesses choose distance over cataloguing.",
                                        "Capture " + creature
                                            + " only after confirming which end supplies the legendary danger.",
                                    ]
                                    : [
                                        namedCreature + " becomes portable only after the binding rope wins the argument.",
                                        "A captured " + itemName
                                            + " is still " + creature + ", merely with clearer travel arrangements.",
                                    ];
        return ItemExplanation.pick(notes, key, "monster-field-note");
    }
    static fact(templates, key, channel, replacements) {
        let result = ItemExplanation.pick(templates, key, channel);
        for (const [name, value] of replacements) {
            result = result.split("{" + name + "}").join(value);
        }
        return result;
    }
    static craftingUses(itemName) {
        return ItemType.CRAFTING_ACTIONS.filter(action => new ItemType(action).prizes().some(change => change.quantity < 0 && change.itemType.name === itemName));
    }
    static fightUses(itemName) {
        return ItemExplanation.MONSTERS.filter(monster => new ItemType(monster).prizes().some(change => change.quantity < 0 && change.itemType.name === itemName));
    }
    static changesText(changes) {
        return ItemExplanation.list(changes.map(change => View.getQuantityText(change.itemType.name, Math.abs(change.quantity))));
    }
    static namesText(names, remainderName, format) {
        const shown = names.slice(0, 3).map(format);
        if (names.length > shown.length) {
            const remainder = names.length - shown.length;
            shown.push(remainder + " more " + remainderName
                + (remainder === 1 ? "" : "s"));
        }
        return ItemExplanation.list(shown);
    }
    static list(values) {
        var _a;
        if (values.length < 2) {
            return (_a = values[0]) !== null && _a !== void 0 ? _a : "";
        }
        return values.slice(0, -1).join(", ") + " and "
            + values[values.length - 1];
    }
    static pick(values, key, channel) {
        var _a, _b;
        return (_b = (_a = values[ItemExplanation.hash(key, channel) % values.length]) !== null && _a !== void 0 ? _a : values[0]) !== null && _b !== void 0 ? _b : "";
    }
    static hash(key, channel) {
        const text = key + "\u241f" + channel;
        let hash = 2166136261;
        for (let index = 0; index < text.length; index++) {
            hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b) >>> 0;
        hash ^= hash >>> 16;
        return hash >>> 0;
    }
    static numberKey(value) {
        return Object.is(value, -0) ? "0" : String(value);
    }
}
ItemExplanation.MONSTERS = [
    "rat", "orc", "troll", "bone rat", "cave bat", "giant spider",
    "plague beetle", "crypt hound", "skeletal guard",
    "dungeon scavenger", "goblin cutthroat", "tomb robber",
    "cave crawler", "ghoul", "wight", "cultist", "armored skeleton",
    "brood spider", "cave troll", "dungeon orc", "plague bearer",
    "stone sentinel", "crypt knight", "banshee", "necromancer",
    "ogre jailer", "basilisk", "minotaur", "vampire", "lich",
    "bone colossus", "abyssal knight", "dungeon dragon",
];
ItemExplanation.MONSTER_COST_FACTS = [
    "A successful capture uses {items} to bind it.",
    "Capturing it consumes {items}, but only when you succeed.",
    "If you capture it, {items} stay behind as its restraints.",
    "Bring {items}; a successful capture consumes them.",
    "Keeping it safely bound after capture uses {items}.",
    "Expect to leave {items} securing it when you succeed.",
    "The capture consumes {items} only after victory.",
    "You use {items} to restrain it once it is subdued.",
];
ItemExplanation.MONSTER_REWARD_FACTS = [
    "Capture it to keep the monster and take {items}.",
    "A successful capture lets you keep it and claim {items}.",
    "Subdue it to keep the monster and collect {items}.",
    "Once captured, it stays with you and yields {items}.",
    "Success adds the monster and {items} to your inventory.",
    "The captured monster comes with {items}.",
    "Keep it after victory and take {items}.",
    "Bring it under control to keep it and collect {items}.",
];
ItemExplanation.TRANSFORMATION_FACTS = [
    "Use it to turn {cost} into {reward}.",
    "It consumes {cost} and produces {reward}.",
    "This action converts {cost} into {reward}.",
    "Spend {cost} here to receive {reward}.",
    "Using it exchanges {cost} for {reward}.",
    "It transforms {cost} into {reward}.",
    "Provide {cost}, and it yields {reward}.",
    "Its practical exchange is {cost} for {reward}.",
];
ItemExplanation.CRAFTING_COST_FACTS = [
    "Craft it with {items}.",
    "Its recipe requires {items}.",
    "Making it consumes {items}.",
    "To craft it, gather {items}.",
    "You need {items} to make it.",
    "Combine {items} to craft it.",
    "The crafting cost is {items}.",
    "Set aside {items} before making it.",
];
ItemExplanation.FISH_CATCH_FACTS = [
    "Catch it with a worm. The bait is consumed when you land the fish.",
    "A worm is required as bait and is used up when the fish is caught.",
    "Bring a worm to catch it. Landing the fish consumes the bait.",
    "Catching it costs one worm; apparently fish insist on being bribed.",
    "Use a worm as bait. It is consumed once this fish is safely caught.",
    "One worm is needed to catch it and is gone when the fish is landed.",
    "Bait the catch with a worm. Success adds the fish and uses the worm.",
    "You need one worm to catch it. The fish keeps the bait.",
];
ItemExplanation.WORM_USE_FACTS = [
    "Use it as bait. Catching any river fish consumes one worm.",
    "One worm catches one river fish, after the fish accepts the arrangement.",
    "Bring it to a river as bait. Each successful catch uses one worm.",
    "It is fishing bait: catching any river fish consumes one.",
    "Save it for the river. Every fish you catch uses one worm.",
    "A river fish requires one worm as bait, and the worm is consumed.",
];
ItemExplanation.COLLECTION_REWARD_FACTS = [
    "Collecting it yields {items}.",
    "Taking it adds {items} to your inventory.",
    "Pick it up to receive {items}.",
    "It provides {items} when collected.",
    "Collection rewards you with {items}.",
    "Gathering it produces {items}.",
    "Take it and you gain {items}.",
    "Its collectible reward is {items}.",
];
ItemExplanation.CRAFTING_USE_FACTS = [
    "Recipes that use it include {uses}.",
    "Keep it for recipes such as {uses}.",
    "Crafting plans that require it include {uses}.",
    "You will need it when following {uses}.",
    "It serves as an ingredient for {uses}.",
    "Among its crafting uses are {uses}.",
    "Save it for {uses}.",
    "The recipe book calls for it in {uses}.",
    "It has a place in the recipes for {uses}.",
    "Useful destinations for it include {uses}.",
];
ItemExplanation.FIGHT_USE_FACTS = [
    "Captures that consume it include {uses}.",
    "Keep it ready when attempting to capture {uses}.",
    "You spend it after successfully subduing {uses}.",
    "Capture attempts that require it include {uses}.",
    "It remains behind when you successfully capture {uses}.",
    "Carry it before attempting to capture {uses}.",
    "Capture preparations use it for {uses}.",
    "It leaves your inventory only after you capture {uses}.",
];
ItemExplanation.COIN_FACTS = [
    "Vendor cats accept it as payment.",
    "It pays for purchases from vendor cats.",
    "Merchant cats sell their goods for it.",
    "Keep it handy when dealing with vendor cats.",
    "This is the currency accepted by cat merchants.",
    "Vendor cats recognize it as perfectly spendable money.",
];
ItemExplanation.YARROW_FACTS = [
    "Every carried yarrow gives exactly 1 starting health.",
    "Each yarrow in your inventory adds 1 starting health in fights.",
    "Carry one to raise your starting fight health by 1.",
    "Your starting health increases by 1 for every yarrow carried.",
    "Each carried plant contributes 1 point of starting health.",
    "One yarrow means 1 additional starting health in battle.",
];
ItemExplanation.COMBAT_EFFECT_FACTS = [
    "It provides {values} in fights.",
    "Using it in battle grants {values}.",
    "In combat, it delivers {values}.",
    "On the battlefield, it supplies {values}.",
    "It gives {values} when used.",
    "Use it for {values}.",
    "In a fight, this item offers {values}.",
    "It contributes {values} during combat.",
];
ItemExplanation.ITEM_FIELD_NOTES = {
    stick: [
        "Straight enough for a club; crooked enough to look handmade.",
        "A stick becomes equipment the moment somebody ties something dangerous to it.",
        "Check both ends for splinters before choosing the heroic end.",
    ],
    root: [
        "A good root binds a handle tightly and releases the soil reluctantly.",
        "Twisted roots make excellent lashings after they stop pretending to be snakes.",
        "The useful part grew underground, apparently to avoid being collected.",
    ],
    stone: [
        "A stone axe begins with a stone that has been given sharper ambitions.",
        "Choose a stone with a clean edge and no sentimental attachment to the ground.",
        "It is primitive engineering in its most dependable and throwable form.",
    ],
    hay: [
        "Dry hay binds rope, feeds flame, and enters more recipes than dignity permits.",
        "Keep the hay dry unless the intended recipe is disappointing porridge.",
        "A handful of hay is mostly empty space with excellent career prospects.",
    ],
    "iron ore": [
        "The iron is inside; the furnace handles the awkward introduction.",
        "Iron ore is a sword before several hot and extremely persuasive conversations.",
        "The useful metal is hiding in stone and requires a furnace to admit it.",
    ],
    iron: [
        "Smelted iron has stopped being geology and started considering weapons.",
        "Every iron weapon begins here, before the hammering becomes personal.",
        "The furnace removed the stone; the blacksmith removes the remaining excuses.",
    ],
    yarrow: [
        "Yarrow smells medicinal, which is how plants warn you about the taste.",
        "Its pale flower crown is easier to recognize than its future poultice.",
        "Carry it for sturdier health or mix it with hay when optimism needs assistance.",
    ],
    hide: [
        "Hide becomes armour after enough scraping, stitching, and selective forgetting.",
        "The rough side remembers the monster; the smooth side prefers not to discuss it.",
        "A patient armorer can turn this into padding instead of an unpleasant rug.",
    ],
    coin: [
        "A coin is a tiny metal permission slip accepted by merchant cats.",
        "Cats claim not to hear coins, yet arrive before the second one lands.",
        "Its two faces disagree on everything except purchasing power.",
    ],
    worm: [
        "The fish considers this less bait than a binding agreement.",
        "One worm catches one fish, although only the fish enjoys the arrangement.",
        "Put it on a hook and avoid explaining the broader fishing strategy.",
    ],
    torch: [
        "A torch makes darkness retreat while announcing your location to everything else.",
        "Keep the burning end above the hand; tradition is unusually firm on this point.",
        "Its light reveals corridors, treasure, and occasionally regrettable architecture.",
    ],
    "binding rope": [
        "Binding rope turns a defeated monster into a safely portable disagreement.",
        "Test every knot before the captured monster develops an opinion about it.",
        "Two bundles of hay become rope after enough twisting and optimism.",
    ],
    crucible: [
        "Built to survive molten iron and unreasonable optimism.",
        "A crucible holds the part of smithing that ordinary bowls wisely refuse.",
        "If it glows, use tongs; if the tongs glow, reconsider the afternoon.",
    ],
    furnace: [
        "The furnace persuades iron ore to abandon its rocky disguise.",
        "Its preferred ingredients are ore, heat, and a crucible that knows its duty.",
        "Stand near enough to smelt iron and far enough to retain your eyebrows.",
    ],
    campfire: [
        "Five river fish enter the recipe; one surprisingly respectable feast leaves it.",
        "The hay lights the fire, while the fish provide the complicated smells.",
        "A campfire is a kitchen whose roof has been sensibly omitted.",
    ],
    chest: [
        "A chest is a wooden promise that may contain coins or several smaller disappointments.",
        "The hinges know what is inside and remain professionally silent.",
        "Open the lid from the end least likely to contain teeth.",
    ],
    treasure: [
        "Treasure is clutter that has successfully negotiated a higher price.",
        "Its chief practical property is making nearby merchant cats attentive.",
        "The shine is optional; the twenty coins are the persuasive part.",
    ],
    "wooden shield": [
        "Every dent proves the shield stood in the correct unpleasant place.",
        "Several planks become courage once fitted with a handle.",
        "Keep the wooden side between your ribs and the monster's strongest opinion.",
    ],
    "reinforced shield": [
        "Iron reinforcement lets the shield disagree with heavier weapons.",
        "The wooden core catches the blow; the iron rim prevents an early retirement.",
        "It is a wooden shield wearing the sensible amount of metal.",
    ],
    "padded hide": [
        "Padded hide turns sharp blows into broad, slightly more survivable complaints.",
        "The stitching matters most exactly where the monster hopes it does not.",
        "It is softer than iron and considerably harder than exposed ribs.",
    ],
    "yarrow poultice": [
        "The healer calls it a poultice; the nose calls it wet hay with authority.",
        "Press the yarrow against the injury and keep the heroic speech brief.",
        "It looks like garden debris until three points of healing say otherwise.",
    ],
    "healing potion": [
        "A healing potion is yarrow that completed several advanced examinations.",
        "Drink before your health reaches the dramatic portion of the story.",
        "The colour promises medicine; the taste submits supporting evidence.",
    ],
    "poison potion": [
        "The skull on the bottle is not the apothecary's signature.",
        "Poison works best when the opponent drinks more of it than you do.",
        "Store it well away from healing potions and adventurous cooks.",
    ],
    "river feast": [
        "Five fish and one fire have produced seven points of edible encouragement.",
        "The river provided the ingredients; the hay smoke provides the seasoning.",
        "It heals remarkably well for a meal assembled beside a bridge.",
    ],
    bones: [
        "Bones are the dungeon's preferred material for tools, warnings, and poor decoration.",
        "Clean bones carve better, though the former owner rarely offers instructions.",
        "A bone knife is already visible here to anyone with a sharp enough imagination.",
    ],
    "cracked skull": [
        "The crack improves drainage but has ended most of the skull's earlier functions.",
        "It is darker than fresh bone and considerably worse at keeping secrets.",
        "Skull crushing can still find useful work for what remains.",
    ],
    "rusted chain": [
        "Rust has weakened the chain but made every link look more experienced.",
        "The links may be reforged once the furnace stops laughing at them.",
        "Shake it once for loose rust and twice for anything living inside.",
    ],
    "grave dust": [
        "Grave dust is ordinary dust with unusually specific paperwork.",
        "Distillation extracts the useful poison and leaves the haunting mostly intact.",
        "Avoid sneezing grave dust near any ritual that has already begun glowing.",
    ],
    "bat wing": [
        "A bat wing is excellent leather after several very small tailoring decisions.",
        "The membrane tans well and flies poorly without the rest of the bat.",
        "Wing tanning turns this fragile scrap into something armour can respect.",
    ],
    "spider silk": [
        "Spider silk is stronger than it looks and stickier than the label suggests.",
        "Silk binding begins after removing the spider from the negotiations.",
        "Pull slowly; somewhere nearby, a spider may still consider this attached.",
    ],
    "black candle": [
        "A black candle provides light with the bedside manner of a curse.",
        "The wax can be reclaimed once the ominous dripping becomes impractical.",
        "Its flame is ordinary; the shadows are responsible for their own behaviour.",
    ],
    "ancient nail": [
        "The nail is old, bent, and still convinced every problem is made of wood.",
        "Reforging removes the rust while preserving its unreasonable determination.",
        "Its square shank belongs to a door that has probably become archaeology.",
    ],
    "broken tile": [
        "A broken tile already has one sharp edge and ambitions for several more.",
        "Tile knapping turns ruined flooring into an unexpectedly serious tool.",
        "The missing half remains part of a floor with a new ventilation problem.",
    ],
    "dungeon moss": [
        "Dungeon moss grows without sunlight and with far too much confidence.",
        "Brew it before the damp green smell begins furnishing the backpack.",
        "Its colour suggests health; its preferred habitat suggests caution.",
    ],
    "gloamcap mushroom": [
        "A gloamcap is easiest to identify by the colour and the immediate second thoughts.",
        "Mix several carefully; licking one is not an accepted shortcut.",
        "The cap contains poison and the stem contains plausible deniability.",
    ],
    "mushroom mixing": [
        "Mushroom mixing is cookery performed under stricter legal definitions.",
        "Use equal parts gloamcap and caution; only one belongs in the bottle.",
        "A proper poison mixture should never resemble tonight's soup.",
    ],
    "armorer's bench": [
        "The bench holds armour still while the hammer improves its manners.",
        "Every scratch marks a shield that left stronger than it arrived.",
        "Keep fingers outside the part currently described as the workpiece.",
    ],
    "bone carving": [
        "Bone carving is the art of giving a skeleton one final pointed purpose.",
        "Carve away from the thumb and toward the future bone knife.",
    ],
    "skull crushing": [
        "Skull crushing recycles old heads into newer and less philosophical equipment.",
        "The process is delicate only until the first hammer blow.",
    ],
    "chain smelting": [
        "Chain smelting gives every rusted link one last chance to become iron again.",
        "The furnace forgets the chain but remembers the metal.",
    ],
    "dust distilling": [
        "Dust distilling separates useful poison from centuries of unpleasant atmosphere.",
        "Seal the flask before the grave dust remembers how to travel.",
    ],
    "wing tanning": [
        "Wing tanning turns bat membrane into leather without improving the smell.",
        "Stretch the wing flat; flight is no longer part of the specification.",
    ],
    "silk binding": [
        "Silk binding makes spider thread cooperate without inviting the spider.",
        "Tension is essential, especially the non-eight-legged kind.",
    ],
    "candle reclaiming": [
        "Candle reclaiming rescues useful wax from its dramatic black career.",
        "Remove the wick before the reclaimed candle resumes brooding.",
    ],
    "nail reforging": [
        "Nail reforging straightens ancient iron and several centuries of stubbornness.",
        "Heat first, hammer second, and question the tetanus never.",
    ],
    "tile knapping": [
        "Tile knapping proves that yesterday's floor can become tomorrow's sharp edge.",
        "Strike the broken tile where the fracture already looks ambitious.",
    ],
    "moss brewing": [
        "Moss brewing concentrates damp greenery into something almost medicinal.",
        "Boil until the dungeon smell becomes an apothecary smell.",
    ],
    calendula: [
        "Calendula's orange petals look cheerful enough to conceal serious healing work.",
        "The flower resembles a tiny sun and behaves better in a medicine pouch.",
    ],
    chamomile: [
        "Chamomile smells calm because it has never met the monster requiring it.",
        "The small white flowers are gentler than most things found on an adventure.",
    ],
    lavender: [
        "Lavender makes a medicine pouch smell briefly more civilized.",
        "Its purple flower spikes are easier to find than peace and quiet.",
    ],
    "red poppy": [
        "A red poppy is delicate, conspicuous, and surprisingly committed to medicine.",
        "The petals bruise easily, so let the monster handle the bruising instead.",
    ],
    cornflower: [
        "Cornflower blue is the colour painters choose after losing the actual flower.",
        "Its bright blue crown is small enough to miss and useful enough to regret missing.",
    ],
    "river trout": [
        "A river trout distrusts hooks but remains fatally curious about worms.",
        "Its speckled back hides in moving water better than it hides on a campfire.",
    ],
    "silver perch": [
        "Silver perch flash like dropped coins and spend considerably less well.",
        "The fins are sharp; the finished river feast is not.",
    ],
    "northern pike": [
        "A northern pike is mostly appetite arranged behind teeth.",
        "Remove the hook from the pike only after negotiating with the teeth.",
    ],
    "common carp": [
        "The common carp objects to the name and expresses this by being difficult to hold.",
        "Its broad scales survive mud, rivers, and unflattering recipes.",
    ],
    "river eel": [
        "A river eel is a fish designed by somebody unwilling to draw fins.",
        "Hold firmly; the eel has not agreed to become dinner.",
    ],
    "dungeon entrance": [
        "Cold air rises from below carrying the dungeon's least reassuring invitation.",
        "The stairs descend farther than the daylight is willing to follow.",
    ],
    "shop entrance": [
        "The doorway smells faintly of timber, coin, and merchant-cat arithmetic.",
        "Prices begin on the other side; dignity remains optional.",
    ],
    "stairs up": [
        "Up is the direction with fewer crypts and marginally better weather.",
        "These steps have carried heroes, merchants, and several hurried survivors.",
    ],
    "highland gate": [
        "The gate opens toward mountains that consider roads a personal weakness.",
        "Beyond it, the castles are enormous and the magicians invoice by the miracle.",
    ],
    "spell of force": [
        "Force magic teaches every attack to arrive with one additional objection.",
        "The enchantment is permanent, so even humble clubs remember the lesson.",
    ],
    "spell of mending": [
        "Mending magic persuades every healing item to try one point harder.",
        "The enchantment improves future medicine without improving its taste.",
    ],
    "spell of warding": [
        "Warding magic adds one invisible layer to every visible shield.",
        "The enchantment is permanent; incoming weapons receive no refund.",
    ],
};
