import { CardGame } from "./CardGame.js";
import { BattleSpell } from "./BattleSpell.js";
import { ItemType } from "./ItemType.js";
import type { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { View } from "./View.js";

export interface ItemExplanationSection {
    heading: "Make"|"Catch"|"Use"|"Fight"|"Field note";
    text: string;
}

interface ItemFactSections {
    make: string[];
    catch: string[];
    use: string[];
    fight: string[];
}

export class ItemExplanation {
    private static readonly MONSTERS = [
        "rat", "orc", "troll", "bone rat", "cave bat", "giant spider",
        "plague beetle", "crypt hound", "skeletal guard",
        "dungeon scavenger", "goblin cutthroat", "tomb robber",
        "cave crawler", "ghoul", "wight", "cultist", "armored skeleton",
        "brood spider", "cave troll", "dungeon orc", "plague bearer",
        "stone sentinel", "crypt knight", "banshee", "necromancer",
        "ogre jailer", "basilisk", "minotaur", "vampire", "lich",
        "bone colossus", "abyssal knight", "dungeon dragon",
    ];
    private static readonly MONSTER_COST_FACTS = [
        "A successful capture uses {items} to bind it.",
        "Capturing it consumes {items}, but only when you succeed.",
        "If you capture it, {items} stay behind as its restraints.",
        "Bring {items}; a successful capture consumes them.",
        "Keeping it safely bound after capture uses {items}.",
        "Expect to leave {items} securing it when you succeed.",
        "The capture consumes {items} only after victory.",
        "You use {items} to restrain it once it is subdued.",
    ];
    private static readonly MONSTER_REWARD_FACTS = [
        "Capture it to keep the monster and take {items}.",
        "A successful capture lets you keep it and claim {items}.",
        "Subdue it to keep the monster and collect {items}.",
        "Once captured, it stays with you and yields {items}.",
        "Success adds the monster and {items} to your inventory.",
        "The captured monster comes with {items}.",
        "Keep it after victory and take {items}.",
        "Bring it under control to keep it and collect {items}.",
    ];
    private static readonly TRANSFORMATION_FACTS = [
        "Use it to turn {cost} into {reward}.",
        "It consumes {cost} and produces {reward}.",
        "This action converts {cost} into {reward}.",
        "Spend {cost} here to receive {reward}.",
        "Using it exchanges {cost} for {reward}.",
        "It transforms {cost} into {reward}.",
        "Provide {cost}, and it yields {reward}.",
        "Its practical exchange is {cost} for {reward}.",
    ];
    private static readonly CRAFTING_COST_FACTS = [
        "Craft it with {items}.",
        "Its recipe requires {items}.",
        "Making it consumes {items}.",
        "To craft it, gather {items}.",
        "You need {items} to make it.",
        "Combine {items} to craft it.",
        "The crafting cost is {items}.",
        "Set aside {items} before making it.",
    ];
    private static readonly FISH_CATCH_FACTS = [
        "Catch it with a worm. The bait is consumed when you land the fish.",
        "A worm is required as bait and is used up when the fish is caught.",
        "Bring a worm to catch it. Landing the fish consumes the bait.",
        "Catching it costs one worm; apparently fish insist on being bribed.",
        "Use a worm as bait. It is consumed once this fish is safely caught.",
        "One worm is needed to catch it and is gone when the fish is landed.",
        "Bait the catch with a worm. Success adds the fish and uses the worm.",
        "You need one worm to catch it. The fish keeps the bait.",
    ];
    private static readonly WORM_USE_FACTS = [
        "Use it as bait. Catching any river fish consumes one worm.",
        "One worm catches one river fish, after the fish accepts the arrangement.",
        "Bring it to a river as bait. Each successful catch uses one worm.",
        "It is fishing bait: catching any river fish consumes one.",
        "Save it for the river. Every fish you catch uses one worm.",
        "A river fish requires one worm as bait, and the worm is consumed.",
    ];
    private static readonly COLLECTION_REWARD_FACTS = [
        "Collecting it yields {items}.",
        "Taking it adds {items} to your inventory.",
        "Pick it up to receive {items}.",
        "It provides {items} when collected.",
        "Collection rewards you with {items}.",
        "Gathering it produces {items}.",
        "Take it and you gain {items}.",
        "Its collectible reward is {items}.",
    ];
    private static readonly CRAFTING_USE_FACTS = [
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
    private static readonly FIGHT_USE_FACTS = [
        "Captures that consume it include {uses}.",
        "Keep it ready when attempting to capture {uses}.",
        "You spend it after successfully subduing {uses}.",
        "Capture attempts that require it include {uses}.",
        "It remains behind when you successfully capture {uses}.",
        "Carry it before attempting to capture {uses}.",
        "Capture preparations use it for {uses}.",
        "It leaves your inventory only after you capture {uses}.",
    ];
    private static readonly COIN_FACTS = [
        "Vendor cats accept it as payment.",
        "It pays for purchases from vendor cats.",
        "Merchant cats sell their goods for it.",
        "Keep it handy when dealing with vendor cats.",
        "This is the currency accepted by cat merchants.",
        "Vendor cats recognize it as perfectly spendable money.",
    ];
    private static readonly YARROW_FACTS = [
        "Every carried yarrow gives exactly 1 starting health.",
        "Each yarrow in your inventory adds 1 starting health in fights.",
        "Carry one to raise your starting fight health by 1.",
        "Your starting health increases by 1 for every yarrow carried.",
        "Each carried plant contributes 1 point of starting health.",
        "One yarrow means 1 additional starting health in battle.",
    ];
    private static readonly COMBAT_EFFECT_FACTS = [
        "It provides {values} in fights.",
        "Using it in battle grants {values}.",
        "In combat, it delivers {values}.",
        "On the battlefield, it supplies {values}.",
        "It gives {values} when used.",
        "Use it for {values}.",
        "In a fight, this item offers {values}.",
        "It contributes {values} during combat.",
    ];
    private static readonly GENERAL_JOKES = [
        "Keep it; recipes develop sudden opinions when ingredients are missing.",
        "It weighs less than regret and is usually more useful.",
        "The guild calls it equipment; the backpack calls it another tenant.",
        "Do not lick it unless the tactical situation has become extremely specific.",
        "It is fully compatible with pockets, panic, and questionable planning.",
        "Discarding it now is the traditional way to need it thirty seconds later.",
        "A merchant cat would value it carefully, then sit on the paperwork.",
        "Its warranty excludes dragons, weather, and ordinary use.",
        "Somebody once called it useless and immediately needed three.",
        "It has passed the kingdom's strict test of being better than empty hands.",
        "Carry it proudly, or at least without poking yourself.",
        "The royal academy classifies it as Probably Important.",
        "It occupies exactly one more corner of the bag than expected.",
        "Nobody has written a ballad about it, which keeps the price reasonable.",
        "A seasoned explorer keeps one nearby and declines to explain why.",
        "It is unlikely to save the kingdom alone, but teamwork remains fashionable.",
        "The instruction manual was lost, so common sense has been promoted.",
        "It pairs well with preparation and a bag that still closes.",
        "The quartermaster recommends keeping it away from the lunch.",
        "Its greatest talent may become obvious five minutes after discarding it.",
        "Even the dungeon cannot decide whether this is treasure or clutter.",
        "A careful adventurer calls it useful; a careless one calls it missing.",
    ];
    private static readonly WEAPON_JOKES = [
        "Point the ambitious end away from your own boots.",
        "It turns difficult negotiations into much shorter negotiations.",
        "The blacksmith recommends courage; the weapon recommends swinging.",
        "Excellent for monsters and for making bushes feel nervous.",
        "Its diplomatic setting has regrettably rusted shut.",
        "A firm grip is advised; heroic shouting remains optional.",
        "It cannot solve every problem, but it can alarm most of them.",
        "The blade has no sense of humour, so you must provide both.",
        "Best paired with footwork and a convincing lack of panic.",
        "Monsters consistently rate it one star and rather too pointy.",
        "It is reusable, unlike most battle speeches.",
        "The armourer's technical term is a strongly worded object.",
        "Swing only after checking which side contains your companions.",
        "It makes an excellent argument and a terrible walking stick.",
        "The forge guarantees menace, though accuracy remains your department.",
        "Its care instructions begin with Do Not Drop On Foot.",
        "A monster may dispute its craftsmanship, usually very briefly.",
        "The edge is keen; the wielder should attempt something similar.",
        "No enchanted glow is included, only honest mechanical persuasion.",
        "Use with both hands if the name sounds heavier than your breakfast.",
        "The weapon has trained extensively by lying near a blacksmith.",
        "It works best when the dangerous end reaches the monster first.",
    ];
    private static readonly DEFENCE_JOKES = [
        "Hide behind it with dignity; the dignity is purely decorative.",
        "It is cheaper than explaining an axe-shaped dent to a healer.",
        "Hold it between yourself and anything expressing murderous enthusiasm.",
        "Its principal ingredient is the word no, spoken physically.",
        "A shield is portable architecture for people with urgent appointments.",
        "Monsters dislike this one simple plank-based argument.",
        "It blocks damage and most unsolicited eye contact.",
        "For best results, face the frightening side toward the frightening thing.",
        "It converts incoming heroism tests into manageable bruises.",
        "The front is whichever side the monster should hit.",
        "Carry it proudly; crouching behind it is also officially acceptable.",
        "Its defensive philosophy is simple: be elsewhere, behind this.",
        "A dent means it has successfully attended a meeting on your behalf.",
        "It cannot stop bad decisions, but it can soften their consequences.",
        "The armourer's warranty covers arrows but not dramatic posing.",
        "Place between ribs and danger in whichever order seems urgent.",
    ];
    private static readonly HEALING_JOKES = [
        "The healer calls it medicine; the tongue calls it lawn.",
        "It tastes like responsibility but works considerably better.",
        "Apply before becoming a heroic historical footnote.",
        "Side effects may include surviving long enough to complain.",
        "Keep it near the top of the backpack, above the decorative rocks.",
        "It is not bravery, but bravery is delighted to have it nearby.",
        "The flavour says shrubbery; the result says continue adventuring.",
        "Recommended whenever your health resembles an unpopular opinion.",
        "Use before the healer starts measuring you for a memorial plaque.",
        "Its medicinal dignity survives even the first cautious sniff.",
        "The recipe contains no miracles, merely plants doing competent work.",
        "A sensible hero applies it before attempting another speech.",
        "It restores health without asking how you misplaced it.",
        "The apothecary recommends swallowing pride separately.",
        "Keep away from monsters, who already have enough advantages.",
        "Survival may taste earthy; this is considered a fair exchange.",
    ];
    private static readonly MATERIAL_JOKES = [
        "It looks like clutter right until a recipe demands exactly this.",
        "Crafting masters call it a component; everyone else calls it pocket debris.",
        "Store it somewhere memorable, unlike the last seven components.",
        "It possesses the rare power of becoming something less inconvenient.",
        "Alone it is humble; near a workbench it becomes dangerously employable.",
        "The correct quantity is always one more than you threw away.",
        "It is raw potential wearing an extremely unconvincing disguise.",
        "A proper artisan sees possibilities; a cat sees something to knock over.",
        "The workshop has a shelf for this, although nobody remembers which shelf.",
        "Its current form is merely an awkward stage in a better recipe.",
        "Gather enough humble ingredients and the blacksmith becomes interested.",
        "The crafting guild prefers the term essential future component.",
        "It waits patiently for a recipe to give it purpose and better posture.",
        "A full backpack is simply a workshop that has not happened yet.",
        "The material looks ordinary because potential dislikes showing off.",
        "Save it now and feel unreasonably prepared later.",
    ];
    private static readonly FINAL_ASIDES = [
        "Plan accordingly.", "Your backpack has been warned.",
        "This is considered progress.", "Try to look professional.",
        "The dungeon will pretend not to be impressed.", "Use responsibly-ish.",
        "No prophecy is required.", "That is the entire sensible plan.",
        "Keep the receipt.", "Adventure remains a poorly regulated industry.",
        "Results improve dramatically when actually carried.", "Simple, by local standards.",
        "The guild accepts no liability for creative interpretation.",
        "This advice has survived at least two expeditions.",
        "Act before the dungeon revises the situation.",
        "A prepared backpack is a quieter backpack.",
        "The monsters have not been consulted.",
        "Use the information while it is still convenient.",
        "That concludes the useful portion of the lecture.",
        "Some assembly, courage, or running may be required.",
        "The quartermaster considers the matter settled.",
        "No decorative prophecy is necessary.",
        "The sensible route remains available for a limited time.",
        "Proceed with the confidence of someone who checked the recipe.",
    ];

    static for(
        itemName: string,
        latitude: number,
        longitude: number,
        areaId: number,
    ): string {
        return ItemExplanation.sectionsFor(
            itemName,
            latitude,
            longitude,
            areaId,
        ).map(section => section.heading + ": " + section.text).join("\n\n");
    }

    static sectionsFor(
        itemName: string,
        latitude: number,
        longitude: number,
        areaId: number,
    ): ItemExplanationSection[] {
        const key = [
            itemName,
            ItemExplanation.numberKey(latitude),
            ItemExplanation.numberKey(longitude),
            areaId,
        ].join("|");
        const facts = ItemExplanation.factSections(itemName, key);
        const effects = CardGame.itemCardEffects(itemName);
        const jokes = effects !== null && effects.healing > 0
            ? ItemExplanation.HEALING_JOKES
            : effects !== null && effects.block > effects.damage
                ? ItemExplanation.DEFENCE_JOKES
                : effects !== null && effects.damage >= 3
                    ? ItemExplanation.WEAPON_JOKES
                    : ItemExplanation.craftingUses(itemName).length > 0
                        ? ItemExplanation.MATERIAL_JOKES
                        : ItemExplanation.GENERAL_JOKES;
        const sections: ItemExplanationSection[] = [];
        const addSection = (
            heading: ItemExplanationSection["heading"],
            sentences: string[],
        ): void => {
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
            text: [
                ItemExplanation.pick(jokes, key, "joke"),
                ItemExplanation.pick(
                    ItemExplanation.FINAL_ASIDES,
                    key,
                    "final-aside",
                ),
            ].join(" "),
        });

        return sections;
    }

    static element(
        itemName: string,
        latitude: number,
        longitude: number,
        areaId: number,
    ): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "item-explanation";
        const sections = ItemExplanation.sectionsFor(
            itemName,
            latitude,
            longitude,
            areaId,
        );
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
        const fieldNote = sections.find(
            section => section.heading === "Field note",
        );
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

    static displayName(itemName: string): string {
        const names: Readonly<Record<string, string>> = {
            "magician selling force spell": "Force magician",
            "magician selling mending spell": "Mending magician",
            "magician selling warding spell": "Warding magician",
            "spell of force": "Spell of Force",
            "spell of mending": "Spell of Mending",
            "spell of warding": "Spell of Warding",
            "highland gate": "Highland gate",
        };

        if (names[itemName] !== undefined) {
            return names[itemName]!;
        }
        const battleSpell = BattleSpell.get(itemName);
        if (battleSpell !== null) {
            return battleSpell.title;
        }

        return itemName.charAt(0).toUpperCase() + itemName.slice(1);
    }

    static categoryFor(itemName: string): string {
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

    private static factSections(itemName: string, key: string): ItemFactSections {
        const itemType = new ItemType(itemName);
        const changes = itemType.prizes();
        const expenses = changes.filter(change => change.quantity < 0);
        const rewards = changes.filter(change => change.quantity > 0);
        const sections: ItemFactSections = {
            make: [],
            catch: [],
            use: [],
            fight: [],
        };

        if (itemName.startsWith("magician selling ")) {
            sections.use.push(
                "Buy this magician's spell with coins. Its bonus is permanent.",
            );
        } else if (ItemType.isRiverFish(itemName)) {
            sections.catch.push(
                ItemExplanation.pick(
                    ItemExplanation.FISH_CATCH_FACTS,
                    key,
                    "fish-catch",
                ),
            );
        } else if (itemType.isMonster()) {
            if (expenses.length > 0) {
                sections.fight.push(
                    ItemExplanation.fact(
                        ItemExplanation.MONSTER_COST_FACTS,
                        key,
                        "monster-cost",
                        [["items", ItemExplanation.changesText(expenses)]],
                    ),
                );
            }
            if (rewards.length > 0) {
                sections.fight.push(
                    ItemExplanation.fact(
                        ItemExplanation.MONSTER_REWARD_FACTS,
                        key,
                        "monster-reward",
                        [["items", ItemExplanation.changesText(rewards)]],
                    ),
                );
            }
        } else if (expenses.length > 0 && rewards.length > 0) {
            sections.make.push(
                ItemExplanation.fact(
                    ItemExplanation.TRANSFORMATION_FACTS,
                    key,
                    "transformation",
                    [
                        ["cost", ItemExplanation.changesText(expenses)],
                        ["reward", ItemExplanation.changesText(rewards)],
                    ],
                ),
            );
        } else if (expenses.length > 0) {
            sections.make.push(
                ItemExplanation.fact(
                    ItemExplanation.CRAFTING_COST_FACTS,
                    key,
                    "crafting-cost",
                    [["items", ItemExplanation.changesText(expenses)]],
                ),
            );
        } else if (rewards.length > 0) {
            sections.make.push(
                ItemExplanation.fact(
                    ItemExplanation.COLLECTION_REWARD_FACTS,
                    key,
                    "collection-reward",
                    [["items", ItemExplanation.changesText(rewards)]],
                ),
            );
        }

        const craftingUses = ItemExplanation.craftingUses(itemName);
        if (craftingUses.length > 0) {
            sections.use.push(
                ItemExplanation.fact(
                    ItemExplanation.CRAFTING_USE_FACTS,
                    key,
                    "crafting-use",
                    [[
                        "uses",
                        ItemExplanation.namesText(
                            craftingUses,
                            "recipe",
                            name => "the " + name + " recipe",
                        ),
                    ]],
                ),
            );
        }
        if (itemName === "worm") {
            sections.use.push(
                ItemExplanation.pick(
                    ItemExplanation.WORM_USE_FACTS,
                    key,
                    "worm-use",
                ),
            );
        }
        const fightUses = ItemExplanation.fightUses(itemName);
        if (fightUses.length > 0) {
            sections.fight.push(
                ItemExplanation.fact(
                    ItemExplanation.FIGHT_USE_FACTS,
                    key,
                    "fight-use",
                    [[
                        "uses",
                        ItemExplanation.namesText(
                            fightUses,
                            "monster",
                            name => View.getQuantityText(name, 1),
                        ),
                    ]],
                ),
            );
        }
        if (itemName === "coin") {
            sections.use.push(ItemExplanation.pick(
                ItemExplanation.COIN_FACTS,
                key,
                "coin",
            ));
        }
        if (itemName === "yarrow") {
            sections.fight.push(ItemExplanation.pick(
                ItemExplanation.YARROW_FACTS,
                key,
                "yarrow",
            ));
        }
        const permanentBonuses: Readonly<Record<string, string>> = {
            "spell of force":
                "Permanently adds 1 damage to every attack you play.",
            "spell of mending":
                "Permanently adds 1 healing to every healing item you play.",
            "spell of warding":
                "Permanently adds 1 block to every shield you play.",
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
            sections.use.push(
                "Enter it to reach the rugged highlands and their ancient castles.",
            );
        }

        const effects = CardGame.itemCardEffects(itemName);
        if (effects !== null) {
            const values: string[] = [];
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
                sections.fight.push(
                    ItemExplanation.fact(
                        ItemExplanation.COMBAT_EFFECT_FACTS,
                        key,
                        "combat-effects",
                        [["values", ItemExplanation.list(values)]],
                    ),
                );
            }
        }

        return sections;
    }

    private static fact(
        templates: readonly string[],
        key: string,
        channel: string,
        replacements: readonly (readonly [string, string])[],
    ): string {
        let result = ItemExplanation.pick(templates, key, channel);
        for (const [name, value] of replacements) {
            result = result.split("{" + name + "}").join(value);
        }

        return result;
    }

    private static craftingUses(itemName: string): string[] {
        return ItemType.CRAFTING_ACTIONS.filter(action =>
            new ItemType(action).prizes().some(change =>
                change.quantity < 0 && change.itemType.name === itemName
            )
        );
    }

    private static fightUses(itemName: string): string[] {
        return ItemExplanation.MONSTERS.filter(monster =>
            new ItemType(monster).prizes().some(change =>
                change.quantity < 0 && change.itemType.name === itemName
            )
        );
    }

    private static changesText(changes: ItemTypeAndQuantity[]): string {
        return ItemExplanation.list(changes.map(change =>
            View.getQuantityText(
                change.itemType.name,
                Math.abs(change.quantity),
            )
        ));
    }

    private static namesText(
        names: string[],
        remainderName: string,
        format: (name: string) => string,
    ): string {
        const shown = names.slice(0, 3).map(format);
        if (names.length > shown.length) {
            const remainder = names.length - shown.length;
            shown.push(
                remainder + " more " + remainderName
                    + (remainder === 1 ? "" : "s"),
            );
        }

        return ItemExplanation.list(shown);
    }

    private static list(values: string[]): string {
        if (values.length < 2) {
            return values[0] ?? "";
        }

        return values.slice(0, -1).join(", ") + " and "
            + values[values.length - 1];
    }

    private static pick(
        values: readonly string[],
        key: string,
        channel: string,
    ): string {
        return values[ItemExplanation.hash(key, channel) % values.length]
            ?? values[0]
            ?? "";
    }

    private static hash(key: string, channel: string): number {
        const text = key + "\u241f" + channel;
        let hash = 2_166_136_261;
        for (let index = 0; index < text.length; index++) {
            hash = Math.imul(hash ^ text.charCodeAt(index), 16_777_619) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b) >>> 0;
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    private static numberKey(value: number): string {
        return Object.is(value, -0) ? "0" : String(value);
    }
}
