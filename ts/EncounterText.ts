export interface EncounterIdentity {
    name: string;
    description: string;
}

export class EncounterText {
    private static readonly CAT_NAME_ROOTS = [
        "Meow", "Mew", "Purr", "Whisk", "Marm", "Mog", "Tibb", "Bisc",
        "Mittens", "Pounce", "Floof", "Scrumb", "Nibb", "Paw", "Fuzz",
        "Claw", "Tab", "Snuff", "Plume", "Crump", "Wobble", "Tumble",
        "Pickle", "Truffle",
    ];
    private static readonly CAT_NAME_ENDINGS = [
        "", "", "bert", "belle", "ington", "ifer", "ald", "ella", "wick", "kins",
        "frey", "ina", "sworth", "ip", "ulus", "ette", "well", "by",
        "ford", "bean", "bottom", "face", "boots", "whisk", "paws", "snout",
    ];
    private static readonly CAT_TITLES = [
        "", "", "", "Sir ", "Lady ", "Baron ", "Dame ", "Professor ",
        "Captain ", "Doctor ", "Count ", "Madam ", "Brother ", "Sister ",
        "Inspector ", "Archduke ",
    ];
    private static readonly CAT_COATS = [
        "beautiful tortoiseshell", "moon-pale", "luxuriously muddy",
        "ginger-striped", "smoke-grey", "velvet-black", "cream-whiskered",
        "one-socked tabby", "rain-dappled", "magnificently fluffy",
        "slightly moth-eaten", "copper-eyed", "snow-pawed", "round-faced",
        "fiercely groomed", "three-coloured", "dusty-booted",
        "exceptionally ordinary", "lantern-eyed", "thunderously purring",
        "pocket-sized", "broad-whiskered", "silky-eared", "freckle-nosed",
    ];
    private static readonly CAT_MOODS = [
        "cheerful", "suspiciously polite", "heroically patient",
        "mildly scandalized", "deeply entrepreneurial", "soft-spoken",
        "unreasonably dignified", "warm-hearted", "fussily honest",
        "magnificently smug", "sleepy but attentive", "wildly optimistic",
        "solemnly mischievous", "practical", "incurably curious",
        "delightfully peculiar", "shrewd", "absurdly confident",
        "whisker-twirling", "professionally mysterious",
    ];
    private static readonly CAT_QUIRKS = [
        "keeps every receipt under the left paw",
        "believes haggling is a form of opera",
        "has never forgiven a dishonest turnip",
        "purrs whenever the arithmetic becomes dangerous",
        "accepts compliments in at least seven dialects",
        "can smell a bargain through a stone wall",
        "insists all negotiations begin with a tiny bow",
        "once audited a king and found him three buttons short",
        "wears an invisible hat on important market days",
        "judges character entirely by shoelaces",
        "claims the moon still owes three coins",
        "keeps a ceremonial sardine for legal emergencies",
        "has memorized the price of everything except naps",
        "refuses to discuss the wheel of cheese incident",
        "collects heroic ballads with obvious accounting errors",
        "considers every empty box prime real estate",
        "once won a staring contest against a gargoyle",
        "meows in italics when deeply impressed",
        "can balance a ledger on one whisker",
        "maintains a tiny museum of suspicious spoons",
        "is writing a memoir entitled Nine Excellent Lives",
        "has strong opinions about the correct length of string",
        "always leaves room in the budget for cream",
        "suspects every broom of having a secret",
        "knows exactly when the baker drops the first bun",
        "has declared the counter an independent kingdom",
        "offers terrible advice with wonderful confidence",
        "takes payment seriously and gravity as a suggestion",
        "once sold silence to a very talkative monk",
        "will not trade during an eclipse without extra biscuits",
    ];
    private static readonly CAT_TRADE_CLAIMS = [
        "calls {item} the backbone of civilization",
        "keeps {item} in the Extremely Important ledger",
        "has a daring commercial theory involving {item}",
        "claims the local economy runs entirely on {item}",
        "regards {item} as safer than royal promises",
        "has predicted a fashionable future for {item}",
        "can discuss {item} until nearby candles burn out",
        "has appointed {item} official treasure of the week",
        "insists every sensible household needs emergency {item}",
        "quietly rates {item} above both gold and common sense",
        "has written a surprisingly moving poem about {item}",
        "is cornering the kingdom's market in {item}",
    ];
    private static readonly CAT_BUYING_LINES = [
        "is collecting {item} for reasons marked confidential",
        "offers coin for {item} with unnerving enthusiasm",
        "is buying {item} before the neighbours notice",
        "needs {item} for a perfectly legitimate whisker project",
        "seeks {item} on behalf of an unnamed duke",
        "is rescuing unwanted {item} from less tasteful owners",
        "has opened a highly selective {item} acquisition office",
        "will inspect your {item} with one raised eyebrow",
    ];
    private static readonly CAT_SELLING_LINES = [
        "sells {item} with a solemn lifetime guarantee lasting until teatime",
        "offers what may be the kingdom's finest {item}",
        "is reluctantly parting with some allegedly legendary {item}",
        "sells {item} from a stockroom nobody has ever located",
        "has priced this {item} after consulting three pigeons",
        "presents {item} as though unveiling a royal heirloom",
        "offers certified pre-admired {item}",
        "sells {item} and a completely free look of approval",
    ];
    private static readonly MAGICIAN_NAMES = [
        "Aldren", "Merrow", "Ysabet", "Corvin", "Elowen", "Tavric",
        "Orris", "Sabine", "Galen", "Maelis", "Bramwell", "Nimue",
    ];
    private static readonly MAGICIAN_NOTES = [
        "keeps every promise in the margins of an older promise",
        "tests each enchantment on a particularly patient teaspoon",
        "claims permanent magic should come with permanent receipts",
        "has crossed three kingdoms to avoid one overdue library book",
        "can identify a counterfeit prophecy by smell",
        "insists the castle chose this room for its excellent draught",
        "prices spells by usefulness, rarity, and quality of handwriting",
        "refuses to enchant anything that has recently insulted a goose",
    ];

    private static readonly CREATURE_NAME_ROOTS = [
        "Eek", "Grim", "Gloom", "Nib", "Skrit", "Murk", "Bog", "Crag",
        "Gnash", "Skrum", "Wretch", "Thud", "Mord", "Bram", "Clatter",
        "Hiss", "Croak", "Fang", "Rattle", "Soot", "Grist", "Blight",
        "Snarl", "Dread", "Wibble", "Grumble", "Spite", "Crumble",
    ];
    private static readonly CREATURE_NAME_ENDINGS = [
        "", "ek", "wick", "tooth", "claw", "snout", "bones", "bert",
        "ula", "grim", "wort", "foot", "fang", "belly", "beard", "face",
        "kins", "mire", "gloom", "scratch", "bucket", "whistle", "rump",
        " the Third",
    ];
    private static readonly CREATURE_TITLES = [
        "", "", "", "", "Old ", "Young ", "Captain ", "Doctor ",
        "Brother ", "Sister ", "Baron ", "Professor ", "Saint ",
        "Uncle ", "Auntie ", "Formerly-King ",
    ];
    private static readonly CREATURE_ADJECTIVES = [
        "battle-scarred", "bad-tempered", "oddly beautiful", "mud-caked",
        "lantern-eyed", "crooked-toothed", "mossy", "iron-jawed",
        "deeply offended", "suspiciously fragrant", "half-armoured",
        "ancient-looking", "freshly bewildered", "magnificently dreadful",
        "rain-soaked", "broad-shouldered", "whisper-quiet", "scar-nosed",
        "lopsided", "terribly formal", "dusty", "fiercely punctual",
        "nightmarishly cheerful", "well-read", "mushroom-scented",
        "unreasonably majestic", "grim", "wild-haired", "sharp-eared",
        "questionably enchanted", "stone-faced", "cloak-wrapped",
    ];
    private static readonly CREATURE_HABITS = [
        "apologizes to doors after kicking them",
        "counts every footstep and distrusts prime numbers",
        "keeps trophies from battles it almost attended",
        "practises terrifying speeches in a tiny voice",
        "has sworn revenge upon an entirely innocent wheelbarrow",
        "collects spoons but denies it under oath",
        "writes poetry only on stolen invoices",
        "believes helmets are a conspiracy by hatters",
        "has been banned from three bridges and one respectable puddle",
        "challenges echoes and usually loses",
        "carries emergency cheese for tactical purposes",
        "claims to have invented the threatening pause",
        "is feared by doors, cupboards, and one particular goose",
        "never attacks before finishing a dramatic sigh",
        "polishes one boot and lets the other learn humility",
        "has mistaken this dungeon for a promising career",
        "can open any lock except the one on its lunchbox",
        "keeps a diary in somebody else's handwriting",
        "insists this is all part of a much cleverer ambush",
        "once frightened a statue into remaining perfectly still",
        "wears battle scars in alphabetical order",
        "has rehearsed its victory dance far too early",
        "suspects the walls are gossiping",
        "owes a small but awkward debt to a cat",
        "only roars when the acoustics are flattering",
        "was voted Most Likely to Guard the Wrong Door",
        "can smell courage and yesterday's onions",
        "brings a packed lunch to every haunting",
        "maintains that capes improve all strategic decisions",
        "has a surprisingly nuanced opinion of soup",
        "sleeps with one eye open and the other on holiday",
        "refuses to fight on an empty compliment",
        "believes subtlety means carrying a smaller axe",
        "is composing a strongly worded letter to destiny",
        "has never met a lever it did not pull immediately",
        "calls every defeat an extended reconnaissance mission",
    ];
    private static readonly CREATURE_POSSESSIONS = [
        "a bent teaspoon", "three counterfeit prophecies",
        "the dungeon's least convincing map", "a pebble named Bernard",
        "an expired dragon licence", "a sock of mysterious authority",
        "seven keys and no useful locks", "a very private turnip",
        "the last clean handkerchief underground", "a ceremonial lunchbox",
        "one heroic button", "a portrait of an unknown chicken",
        "a coupon for half a curse", "an aggressively ordinary brick",
        "a tiny flag reading Probably Victory", "somebody else's autobiography",
        "a jar of premium darkness", "a whistle only bats can criticize",
        "a crown made from questionable cutlery", "an emergency moustache",
    ];
    private static readonly CREATURE_REPUTATIONS = [
        "champion of the Incorrect Corridor",
        "terror of the unattended pantry",
        "regional finalist in competitive brooding",
        "unofficial mayor of this particular shadow",
        "keeper of the loudly forbidden cupboard",
        "last known winner of the dungeon spelling bee",
        "bane of sandwiches left unguarded",
        "self-appointed inspector of adventurers",
        "legend of the Tuesday night watch",
        "former understudy to a much larger villain",
        "defender of a treasure nobody wants",
        "three-time runner-up in sinister laughter",
        "nightmare of nervous locksmiths",
        "pride of the subterranean debating society",
        "sole member of the Ancient Order of Me",
        "high custodian of damp paperwork",
        "most improved menace of last winter",
        "owner of the dungeon's second-best glare",
        "prophet of an extremely minor inconvenience",
        "undefeated champion of standing very still",
    ];

    static for(
        itemName: string,
        latitude: number,
        longitude: number,
    ): EncounterIdentity {
        const identityKey = [
            itemName,
            EncounterText.numberKey(latitude),
            EncounterText.numberKey(longitude),
        ].join("|");

        if (itemName.startsWith("cat buying ")
            || itemName.startsWith("cat selling ")
        ) {
            return EncounterText.cat(itemName, identityKey);
        }
        if (itemName.startsWith("magician selling ")) {
            return EncounterText.magician(itemName, identityKey);
        }

        return EncounterText.creature(itemName, identityKey);
    }

    static monsterLabel(itemName: string, generatedName: string): string {
        const article = /^[aeiou]/i.test(itemName) ? "an" : "a";

        return generatedName + ", " + article + " " + itemName;
    }

    private static cat(itemName: string, identityKey: string): EncounterIdentity {
        const name = EncounterText.generatedName(
            identityKey,
            "cat-name",
            EncounterText.CAT_TITLES,
            EncounterText.CAT_NAME_ROOTS,
            EncounterText.CAT_NAME_ENDINGS,
        );
        const coat = EncounterText.pick(
            EncounterText.CAT_COATS,
            identityKey,
            "cat-coat",
        );
        const mood = EncounterText.pick(
            EncounterText.CAT_MOODS,
            identityKey,
            "cat-mood",
        );
        const quirk = EncounterText.pick(
            EncounterText.CAT_QUIRKS,
            identityKey,
            "cat-quirk",
        );
        const buying = itemName.startsWith("cat buying ");
        const item = itemName.slice(
            (buying ? "cat buying " : "cat selling ").length,
        );
        const tradeLine = EncounterText.fillItem(
            EncounterText.pick(
                buying
                    ? EncounterText.CAT_BUYING_LINES
                    : EncounterText.CAT_SELLING_LINES,
                identityKey,
                "cat-trade-line",
            ),
            item,
        );
        const claim = EncounterText.fillItem(
            EncounterText.pick(
                EncounterText.CAT_TRADE_CLAIMS,
                identityKey,
                "cat-trade-claim",
            ),
            item,
        );
        const catPhrase = EncounterText.withIndefiniteArticle(
            mood + " " + coat + " cat",
        );
        const coatCatPhrase = EncounterText.withIndefiniteArticle(
            coat + " cat",
        );
        const templates = [
            "{name}, {catPhrase} who {quirk}, {tradeLine}.",
            "Meet {name}: {coatCatPhrase}, {mood}, who {tradeLine} and {quirk}.",
            "{name} is {catPhrase} who {quirk}; this merchant {tradeLine}.",
            "The {coat} cat called {name} {tradeLine} and {quirk}.",
            "{name}, {coatCatPhrase} of {mood} disposition, {claim} and {quirk}.",
            "Here sits {name}, the {mood} {coat} cat who {claim}; this merchant {tradeLine}.",
        ];
        const description = EncounterText.pick(
            templates,
            identityKey,
            "cat-template",
        );

        return {
            name,
            description: EncounterText.fill(
                description,
                [
                    ["name", name],
                    ["catPhrase", catPhrase],
                    ["coatCatPhrase", coatCatPhrase],
                    ["mood", mood],
                    ["coat", coat],
                    ["quirk", quirk],
                    ["tradeLine", tradeLine],
                    ["claim", claim],
                ],
            ),
        };
    }

    private static creature(
        itemName: string,
        identityKey: string,
    ): EncounterIdentity {
        const name = EncounterText.generatedName(
            identityKey,
            "creature-name",
            EncounterText.CREATURE_TITLES,
            EncounterText.CREATURE_NAME_ROOTS,
            EncounterText.CREATURE_NAME_ENDINGS,
        );
        const adjective = EncounterText.pick(
            EncounterText.CREATURE_ADJECTIVES,
            identityKey,
            "creature-adjective",
        );
        const habit = EncounterText.pick(
            EncounterText.CREATURE_HABITS,
            identityKey,
            "creature-habit",
        );
        const possession = EncounterText.pick(
            EncounterText.CREATURE_POSSESSIONS,
            identityKey,
            "creature-possession",
        );
        const reputation = EncounterText.pick(
            EncounterText.CREATURE_REPUTATIONS,
            identityKey,
            "creature-reputation",
        );
        const creaturePhrase = EncounterText.withIndefiniteArticle(
            adjective + " " + itemName,
        );
        const templates = [
            "{name}, {creaturePhrase} who {habit}.",
            "{CreaturePhrase} called {name}, carrying {possession} and absolutely no explanation.",
            "Locals know {name}, the {adjective} {kind}, as the {reputation}.",
            "{name} — {adjective} {kind}, owner of {possession}, and {reputation}.",
            "This is {name}, {creaturePhrase} who {habit} and guards {possession}.",
            "Behold {name}: the {reputation}, {creaturePhrase} who {habit}.",
            "The {adjective} {kind} named {name} carries {possession} and {habit}.",
            "{name}, {reputation}; also {creaturePhrase} who {habit}.",
        ];
        const description = EncounterText.pick(
            templates,
            identityKey,
            "creature-template",
        );

        return {
            name,
            description: EncounterText.fill(
                description,
                [
                    ["name", name],
                    ["creaturePhrase", creaturePhrase],
                    ["CreaturePhrase", EncounterText.capitalize(creaturePhrase)],
                    ["adjective", adjective],
                    ["kind", itemName],
                    ["habit", habit],
                    ["possession", possession],
                    ["reputation", reputation],
                ],
            ),
        };
    }

    private static magician(
        itemName: string,
        identityKey: string,
    ): EncounterIdentity {
        const name = EncounterText.pick(
            EncounterText.MAGICIAN_NAMES,
            identityKey,
            "magician-name",
        );
        const note = EncounterText.pick(
            EncounterText.MAGICIAN_NOTES,
            identityKey,
            "magician-note",
        );
        const spell = itemName.slice("magician selling ".length);
        const templates = [
            "{name}, a castle magician who sells the {spell} and {note}.",
            "The magician {name} offers the {spell}; this scholar {note}.",
            "{name} guards a quiet spell room, sells the {spell}, and {note}.",
        ];
        const description = EncounterText.pick(
            templates,
            identityKey,
            "magician-template",
        );

        return {
            name,
            description: EncounterText.fill(description, [
                ["name", name],
                ["spell", spell],
                ["note", note],
            ]),
        };
    }

    private static generatedName(
        identityKey: string,
        channel: string,
        titles: readonly string[],
        roots: readonly string[],
        endings: readonly string[],
    ): string {
        return EncounterText.pick(titles, identityKey, channel + ":title")
            + EncounterText.pick(roots, identityKey, channel + ":root")
            + EncounterText.pick(endings, identityKey, channel + ":ending");
    }

    private static fillItem(text: string, item: string): string {
        return EncounterText.fill(text, [["item", item]]);
    }

    private static fill(
        text: string,
        values: readonly (readonly [string, string])[],
    ): string {
        let result = text;
        for (const [key, value] of values) {
            result = result.split("{" + key + "}").join(value);
        }

        return result;
    }

    private static withIndefiniteArticle(phrase: string): string {
        const lower = phrase.toLowerCase();
        const startsWithVowelSound = /^(?:[aeio]|honest|hour|heir)/.test(lower)
            && !/^(?:one|uni|use|euro)/.test(lower);

        return (startsWithVowelSound ? "an " : "a ") + phrase;
    }

    private static capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    private static pick(
        values: readonly string[],
        identityKey: string,
        channel: string,
    ): string {
        return values[EncounterText.hash(identityKey, channel) % values.length]
            ?? values[0]
            ?? "";
    }

    private static hash(identityKey: string, channel: string): number {
        const text = identityKey + "\u241f" + channel;
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
