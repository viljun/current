import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { BattleSpell } from "./BattleSpell.js";

export class ItemType {
    private static readonly MAXIMUM_QUANTITIES: Readonly<
        Record<string, number>
    > = {
        crucible: 1,
    };
    static readonly RIVER_FISH_NAMES = [
        "river trout",
        "silver perch",
        "northern pike",
        "common carp",
        "river eel",
    ] as const;
    static readonly CRAFTING_ACTIONS: readonly string[] = [
        "binding rope", "club", "torch", "stone axe", "sword", "crucible",
        "campfire", "padded hide", "wooden shield", "reinforced shield",
        "iron-spiked club", "iron hand axe", "flanged mace",
        "bearded battle axe", "arming sword", "war hammer", "longsword",
        "two-handed battle axe", "poleaxe", "masterwork greatsword",
        "yarrow poultice", "healing potion", "poison potion",
        "poisoned masterwork greatsword", "bone knife", "spiked cudgel",
        "iron dagger", "falchion", "morning star", "war pick",
        "heavy crossbow", "zweihander", "halberd", "executioner's axe",
        "estoc", "bec de corbin", "gothic mace", "runed longsword",
        "blacksteel glaive", "relic warhammer", "dragonbone axe",
        "royal claymore", "obsidian polearm", "dungeon-forged greatblade",
        "bone carving", "skull crushing", "chain smelting",
        "dust distilling", "wing tanning", "silk binding",
        "candle reclaiming", "nail reforging", "tile knapping",
        "moss brewing", "furnace", "mushroom mixing", "armorer's bench",
        ...BattleSpell.names(),
    ];
    private static readonly ENTRANCE_MODULUS = 4120;
    private static readonly SHOP_ENTRANCE_REMAINDER = 2;
    private static readonly SHOP_TRADE_DENSITY_DIVISOR = 85;
    private static readonly HIGHLAND_ENTRANCE_MODULUS = 7817;
    private static readonly HIGHLAND_ENTRANCE_REMAINDER = 17;
    private static readonly SHOP_TRADES: readonly {
        item: string;
        quantity: number;
    }[] = [
        { item: "stick", quantity: 3 },
        { item: "stone", quantity: 3 },
        { item: "hay", quantity: 3 },
        { item: "root", quantity: 3 },
        { item: "iron ore", quantity: 3 },
        { item: "iron", quantity: 3 },
        { item: "yarrow", quantity: 1 },
        { item: "hide", quantity: 1 },
        { item: "chest", quantity: 1 },
        { item: "rat", quantity: 1 },
        { item: "orc", quantity: 1 },
        { item: "troll", quantity: 1 },
        { item: "torch", quantity: 1 },
        { item: "club", quantity: 1 },
        { item: "stone axe", quantity: 1 },
        { item: "sword", quantity: 1 },
        { item: "padded hide", quantity: 1 },
        { item: "wooden shield", quantity: 1 },
        { item: "reinforced shield", quantity: 1 },
        { item: "crucible", quantity: 1 },
        { item: "treasure", quantity: 1 },
    ];
    private static readonly FOUNDATIONAL_VALUES: Readonly<Record<string, number>> = {
        coin: 1,
        hay: 1,
        hide: 6,
        "iron ore": 3,
        orc: 35,
        rat: 10,
        root: 1,
        stick: 1,
        stone: 2,
        troll: 80,
        yarrow: 10,
    };
    private static readonly PRODUCTION_ACTIONS = ["furnace", "campfire"];
    private static readonly DUNGEON_FURNACE_MODULI = [419, 2039, 3001];
    private static readonly DUNGEON_MONSTERS: readonly [number, string][] = [
        [4001, "bone rat"], [4027, "cave bat"], [4051, "giant spider"],
        [4073, "plague beetle"], [4099, "crypt hound"],
        [4133, "skeletal guard"], [4159, "dungeon scavenger"],
        [4201, "goblin cutthroat"], [4241, "tomb robber"],
        [4273, "cave crawler"], [4327, "ghoul"], [4363, "wight"],
        [4409, "cultist"], [4447, "armored skeleton"],
        [4483, "brood spider"], [4519, "cave troll"],
        [4561, "dungeon orc"], [4597, "plague bearer"],
        [4639, "stone sentinel"], [4673, "crypt knight"],
        [4721, "banshee"], [4759, "necromancer"], [4801, "ogre jailer"],
        [4831, "basilisk"], [4871, "minotaur"], [4909, "vampire"],
        [4951, "lich"], [4993, "bone colossus"],
        [5021, "abyssal knight"], [5059, "dungeon dragon"],
    ];
    private static readonly DUNGEON_MATERIALS: readonly [number, string][] = [
        [5101, "bones"], [5147, "cracked skull"], [5189, "rusted chain"],
        [53, "grave dust"], [5273, "bat wing"], [5323, "spider silk"],
        [5351, "black candle"], [5393, "ancient nail"],
        [5431, "broken tile"], [5479, "dungeon moss"],
    ];
    private static readonly DUNGEON_MONSTER_REWARD_MATERIALS: readonly string[] = [
        "bones", "bat wing", "spider silk", "dungeon moss", "bones",
        "cracked skull", "ancient nail", "black candle", "broken tile",
        "dungeon moss", "bones", "black candle", "black candle",
        "rusted chain", "spider silk", "bones", "rusted chain",
        "dungeon moss", "broken tile", "ancient nail", "black candle",
        "cracked skull", "rusted chain", "dungeon moss", "bones",
        "bat wing", "black candle", "bones", "ancient nail", "rusted chain",
    ];
    private static readonly DUNGEON_WEAPONS: readonly [number, string][] = [
        [5521, "bone knife"], [5563, "spiked cudgel"], [5591, "iron dagger"],
        [5639, "falchion"], [5683, "morning star"], [5717, "war pick"],
        [5749, "heavy crossbow"], [5791, "zweihander"], [5839, "halberd"],
        [5869, "executioner's axe"], [5923, "estoc"],
        [5953, "bec de corbin"], [5987, "gothic mace"],
        [6029, "runed longsword"], [6067, "blacksteel glaive"],
        [6101, "relic warhammer"], [6131, "dragonbone axe"],
        [6173, "royal claymore"], [6211, "obsidian polearm"],
        [6257, "dungeon-forged greatblade"],
    ];
    private static readonly DUNGEON_ACTIONS: readonly [number, string][] = [
        [6301, "bone carving"], [6343, "skull crushing"],
        [6379, "chain smelting"], [6421, "dust distilling"],
        [6469, "wing tanning"], [6491, "silk binding"],
        [6521, "candle reclaiming"], [6563, "nail reforging"],
        [6607, "tile knapping"], [6653, "moss brewing"],
    ];

    name: string;
    constructor(name: string) {
        this.name = name;
    }

    isMonster(): boolean {
        return ["rat", "orc", "troll"].includes(this.name)
            || ItemType.DUNGEON_MONSTERS.some(([, name]) => name === this.name);
    }

    static isRiverFish(itemName: string): boolean {
        return ItemType.RIVER_FISH_NAMES.some(name => name === itemName);
    }

    static isTransientAction(itemName: string): boolean {
        return itemName === "campfire";
    }

    maximumQuantity(): number|null {
        return ItemType.MAXIMUM_QUANTITIES[this.name] ?? null;
    }

    // Returns item type by seed or null if there is no item in the location with the given seed.
    static getWithSeed(seed: number, areaId: number): ItemType|null {
        let name = null;

        if (areaId === 2) {
            if (ItemType.isShopEntranceSeed(seed)) {
                name = "stairs up";
            } else {
                const tradeCount = ItemType.SHOP_TRADES.length * 2;
                const tradePeriod = tradeCount
                    * ItemType.SHOP_TRADE_DENSITY_DIVISOR;
                const tradeIndex = ((seed % tradePeriod) + tradePeriod) % tradePeriod;
                if (tradeIndex >= tradeCount) {
                    return null;
                }
                const trade = ItemType.SHOP_TRADES[
                    tradeIndex % ItemType.SHOP_TRADES.length
                ];
                if (trade === undefined) {
                    return null;
                }
                name = tradeIndex < ItemType.SHOP_TRADES.length
                    ? "cat buying " + trade.item
                    : "cat selling " + trade.item;
            }

            return new ItemType(name);
        }

        if (areaId === 1) {
            if (ItemType.isDungeonEntranceSeed(seed)) {
                name = "stairs up";
            } else if (!(seed % 503)) {
                name = "chest";
            } else {
                const dungeonEntry = [
                    ...ItemType.DUNGEON_MONSTERS,
                    ...ItemType.DUNGEON_MATERIALS,
                    ...ItemType.DUNGEON_WEAPONS,
                    ...ItemType.DUNGEON_ACTIONS,
                ].find(([modulus, itemName]) =>
                    !(seed % modulus)
                    && (
                        itemName !== "grave dust"
                        || ItemType.frequencyGate(
                            seed,
                            0x67726176,
                            1,
                            2,
                        )
                    )
                    && (
                        itemName !== "black candle"
                        || ItemType.frequencyGate(
                            seed,
                            0x63616e64,
                            1,
                            10,
                        )
                    )
                );
                if (dungeonEntry !== undefined) {
                    name = dungeonEntry[1];
                }
            }
            if (name !== null) {
                return new ItemType(name);
            }
            if (!(seed % 3571)) {
                name = "masterwork greatsword";
            } else if (!(seed % 3203)) {
                name = "poleaxe";
            } else if (!(seed % 2903)) {
                name = "two-handed battle axe";
            } else if (!(seed % 2609)) {
                name = "longsword";
            } else if (!(seed % 2351)) {
                name = "war hammer";
            } else if (!(seed % 2153)) {
                name = "arming sword";
            } else if (!(seed % 1901)) {
                name = "bearded battle axe";
            } else if (!(seed % 1753)) {
                name = "flanged mace";
            } else if (!(seed % 1601)) {
                name = "iron hand axe";
            } else if (!(seed % 1451)) {
                name = "iron-spiked club";
            } else if (!(seed % 1201)) {
                name = "armorer's bench";
            } else if (ItemType.DUNGEON_FURNACE_MODULI.some(
                modulus => !(seed % modulus),
            )) {
                name = "furnace";
            } else {
                return null;
            }

            return new ItemType(name);
        }

        if (ItemType.isHighlandEntranceSeed(seed)) {
            name = "highland gate";
        } else if (ItemType.isDungeonEntranceSeed(seed)) {
            name = "dungeon entrance";
        } else if (ItemType.isShopEntranceSeed(seed)) {
            name = "shop entrance";
        } else if (!(seed % 101)) {
            name = "coin";
        } else if (!(seed % 47)) {
            name = "stick";
        } else if (!(seed % 53)) {
            if (!ItemType.frequencyGate(seed, 0x73746f53, 1, 2)) {
                return null;
            }
            name = "stone";
        } else if (
            !(seed % 71)
            && ItemType.frequencyGate(seed, 0x68617953, 1, 2)
        ) {
            name = "hay";
        } else if (!(seed % 31)) {
            name = "root";
        } else if (!(seed % 191)) {
            name = "iron ore";
        } else if (!(seed % 349)) {
            name = "yarrow";
        } else if (!(seed % 937)) {
            name = "yarrow poultice";
        } else if (!(seed % 367)) {
            name = "hide";
        } else if (!(seed % 509)) {
            name = "rat";
        } else if (!(seed % 607)) {
            name = "crucible";
        } else if (!(seed % 709)) {
            name = "orc";
        } else if (!(seed % 811) || !(seed % 887)) {
            name = "binding rope";
        } else if (
            (!(seed % 859) || !(seed % 907))
            && ItemType.frequencyGate(seed, 0x636c7562, 4, 5)
            && ItemType.frequencyGate(seed, 0x6c650020, 1, 2)
        ) {
            name = "club";
        } else if (!(seed % 877)) {
            name = "padded hide";
        } else if (
            (!(seed % 881) || !(seed % 883))
            && ItemType.frequencyGate(seed, 0x6c650034, 1, 2)
        ) {
            name = "wooden shield";
        } else if (!(seed % 929) || !(seed % 1861)) {
            name = "stone axe";
        } else if (!(seed % 997)) {
            name = "troll";
        } else if (!(seed % 1301)) {
            name = "sword";
        } else if (!(seed % 1423) || !(seed % 1427)) {
            name = "reinforced shield";
        } else if (!(seed % 2013)) {
            name = "treasure";
        } else if (
            (
                (
                    !(seed % 173)
                    && ItemType.frequencyGate(seed, 0x776f726d, 3, 10)
                )
                || (
                    !(seed % 26)
                    && ItemType.frequencyGate(seed, 0x2d78bb56, 5, 10)
                )
            )
            && ItemType.frequencyGate(seed, 0x51a70016, 1, 3)
        ) {
            name = "worm";
        } else {
            return null;
        }

        return new ItemType(name);
    }

    private static frequencyGate(
        seed: number,
        salt: number,
        keptBuckets: number,
        totalBuckets: number,
    ): boolean {
        let value = (seed >>> 0) ^ salt;
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d);
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b);
        value ^= value >>> 16;

        return (value >>> 0) % totalBuckets < keptBuckets;
    }

    static getShopOutsideWithSeed(seed: number): ItemType|null {
        const areaItem = ItemType.getWithSeed(seed, 2);
        if (areaItem?.name === "stairs up") {
            return areaItem;
        }
        let name: string|null = null;
        if (!(seed % 23)) {
            name = "coin";
        } else if (!(seed % 29)) {
            name = "calendula";
        } else if (!(seed % 37)) {
            name = "chamomile";
        } else if (!(seed % 43)) {
            name = "lavender";
        } else if (!(seed % 47)) {
            name = "red poppy";
        } else if (!(seed % 59)) {
            name = "cornflower";
        } else if (!(seed % 421)) {
            name = "healing potion";
        } else if (!(seed % 631)) {
            name = "poison potion";
        } else if (!(seed % 887)) {
            name = "poisoned masterwork greatsword";
        } else if (!(seed % 307)) {
            name = "stick";
        } else if (!(seed % 337)) {
            if (!ItemType.frequencyGate(seed, 0x73746f4f, 1, 2)) {
                return null;
            }
            name = "stone";
        } else if (
            !(seed % 487)
            && ItemType.frequencyGate(seed, 0x6861794f, 1, 2)
        ) {
            name = "hay";
        } else if (!(seed % 263)) {
            name = "root";
        } else if (!(seed % 1259)) {
            name = "iron ore";
        } else if (!(seed % 1381)) {
            name = "yarrow";
        } else if (!(seed % 2081)) {
            name = "hide";
        } else if (!(seed % 6089)) {
            name = "binding rope";
        }

        return name === null ? null : new ItemType(name);
    }

    static isHighlandEntranceSeed(seed: number): boolean {
        const modulus = ItemType.HIGHLAND_ENTRANCE_MODULUS;
        const remainder = ((seed % modulus) + modulus) % modulus;

        return remainder === ItemType.HIGHLAND_ENTRANCE_REMAINDER;
    }

    // Returns
    prizes(): ItemTypeAndQuantity[] {
        const battleSpell = BattleSpell.get(this.name);
        if (battleSpell !== null) {
            return battleSpell.ingredients.map(ingredient =>
                new ItemTypeAndQuantity(
                    new ItemType(ingredient.itemName),
                    -ingredient.quantity,
                )
            );
        }
        const magicianSpells: Readonly<Record<
            string,
            { spell: string; price: number }
        >> = {
            "magician selling force spell": {
                spell: "spell of force",
                price: 250,
            },
            "magician selling mending spell": {
                spell: "spell of mending",
                price: 220,
            },
            "magician selling warding spell": {
                spell: "spell of warding",
                price: 240,
            },
        };
        const magicianSpell = magicianSpells[this.name];
        if (magicianSpell !== undefined) {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("coin"),
                    -magicianSpell.price,
                ),
                new ItemTypeAndQuantity(
                    new ItemType(magicianSpell.spell),
                    1,
                ),
            ];
        }
        if (ItemType.isRiverFish(this.name)) {
            return [
                new ItemTypeAndQuantity(new ItemType("worm"), -1),
            ];
        }
        if (this.name === "campfire") {
            return [
                ...ItemType.RIVER_FISH_NAMES.map(fish =>
                    new ItemTypeAndQuantity(new ItemType(fish), -1)
                ),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
                new ItemTypeAndQuantity(new ItemType("river feast"), 1),
            ];
        }
        const buyingPrefix = "cat buying ";
        const sellingPrefix = "cat selling ";
        if (this.name.startsWith(buyingPrefix) || this.name.startsWith(sellingPrefix)) {
            const buying = this.name.startsWith(buyingPrefix);
            const itemName = this.name.slice(
                buying ? buyingPrefix.length : sellingPrefix.length,
            );
            const trade = ItemType.SHOP_TRADES.find(value => value.item === itemName);
            if (trade !== undefined) {
                const price = ItemType.shopPrice(
                    trade.item,
                    trade.quantity,
                    buying,
                );
                return buying
                    ? [
                        new ItemTypeAndQuantity(
                            new ItemType(trade.item),
                            -trade.quantity,
                        ),
                        new ItemTypeAndQuantity(new ItemType("coin"), price),
                    ]
                    : [
                        new ItemTypeAndQuantity(new ItemType("coin"), -price),
                        new ItemTypeAndQuantity(
                            new ItemType(trade.item),
                            trade.quantity,
                        ),
                    ];
            }
        }
        if (this.name === "chest") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), 5),
            ];
        }
        const dungeonMonsterIndex = ItemType.DUNGEON_MONSTERS.findIndex(
            ([, name]) => name === this.name,
        );
        if (dungeonMonsterIndex >= 0) {
            const tier = Math.floor(dungeonMonsterIndex / 10);
            const rewardStyle = dungeonMonsterIndex % 3;
            const changes = [
                new ItemTypeAndQuantity(
                    new ItemType("binding rope"),
                    -(1 + tier),
                ),
            ];
            if (rewardStyle === 0) {
                changes.push(new ItemTypeAndQuantity(
                    new ItemType("coin"),
                    10 + dungeonMonsterIndex * 5,
                ));
            }
            if (rewardStyle === 1 || rewardStyle === 2) {
                const material = [
                    "skeletal guard",
                    "armored skeleton",
                ].includes(this.name)
                    ? "bones"
                    : ItemType.DUNGEON_MONSTER_REWARD_MATERIALS[
                        dungeonMonsterIndex
                    ];
                if (material !== undefined) {
                    changes.push(new ItemTypeAndQuantity(
                        new ItemType(material),
                        1 + tier,
                    ));
                }
                if (rewardStyle === 2) {
                    changes.push(new ItemTypeAndQuantity(
                        new ItemType("coin"),
                        5 + dungeonMonsterIndex * 3,
                    ));
                } else if (tier === 2) {
                    const secondMaterial =
                        ItemType.DUNGEON_MONSTER_REWARD_MATERIALS[
                            (dungeonMonsterIndex + 1)
                                % ItemType.DUNGEON_MONSTER_REWARD_MATERIALS.length
                        ];
                    if (secondMaterial !== undefined) {
                        changes.push(new ItemTypeAndQuantity(
                            new ItemType(secondMaterial),
                            1,
                        ));
                    }
                }
            }

            return changes;
        }
        if (this.name === "club") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "iron-spiked club") {
            return [
                new ItemTypeAndQuantity(new ItemType("club"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "iron hand axe") {
            return [
                new ItemTypeAndQuantity(new ItemType("stone axe"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
            ];
        }
        if (this.name === "flanged mace") {
            return [
                new ItemTypeAndQuantity(new ItemType("iron-spiked club"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -3),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
            ];
        }
        if (this.name === "bearded battle axe") {
            return [
                new ItemTypeAndQuantity(new ItemType("iron hand axe"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -4),
                new ItemTypeAndQuantity(new ItemType("root"), -2),
            ];
        }
        if (this.name === "arming sword") {
            return [
                new ItemTypeAndQuantity(new ItemType("sword"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -4),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "war hammer") {
            return [
                new ItemTypeAndQuantity(new ItemType("flanged mace"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -6),
                new ItemTypeAndQuantity(new ItemType("hide"), -2),
            ];
        }
        if (this.name === "longsword") {
            return [
                new ItemTypeAndQuantity(new ItemType("arming sword"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -8),
                new ItemTypeAndQuantity(new ItemType("hide"), -2),
                new ItemTypeAndQuantity(new ItemType("root"), -2),
            ];
        }
        if (this.name === "two-handed battle axe") {
            return [
                new ItemTypeAndQuantity(new ItemType("bearded battle axe"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -10),
                new ItemTypeAndQuantity(new ItemType("hide"), -3),
                new ItemTypeAndQuantity(new ItemType("treasure"), -1),
            ];
        }
        if (this.name === "poleaxe") {
            return [
                new ItemTypeAndQuantity(new ItemType("war hammer"), -1),
                new ItemTypeAndQuantity(new ItemType("bearded battle axe"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -12),
                new ItemTypeAndQuantity(new ItemType("root"), -3),
                new ItemTypeAndQuantity(new ItemType("hide"), -2),
            ];
        }
        if (this.name === "masterwork greatsword") {
            return [
                new ItemTypeAndQuantity(new ItemType("longsword"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -18),
                new ItemTypeAndQuantity(new ItemType("hide"), -4),
                new ItemTypeAndQuantity(new ItemType("treasure"), -2),
                new ItemTypeAndQuantity(new ItemType("coin"), -500),
            ];
        }
        if (this.name === "healing potion") {
            return [
                new ItemTypeAndQuantity(new ItemType("calendula"), -1),
                new ItemTypeAndQuantity(new ItemType("chamomile"), -1),
                new ItemTypeAndQuantity(new ItemType("lavender"), -1),
                new ItemTypeAndQuantity(new ItemType("red poppy"), -1),
                new ItemTypeAndQuantity(new ItemType("cornflower"), -1),
            ];
        }
        if (this.name === "yarrow poultice") {
            return [
                new ItemTypeAndQuantity(new ItemType("yarrow"), -1),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
            ];
        }
        if (this.name === "poison potion") {
            return [
                new ItemTypeAndQuantity(new ItemType("healing potion"), -1),
                new ItemTypeAndQuantity(new ItemType("grave dust"), -1),
            ];
        }
        if (this.name === "mushroom mixing") {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("gloamcap mushroom"),
                    -3,
                ),
                new ItemTypeAndQuantity(new ItemType("poison potion"), 1),
            ];
        }
        if (this.name === "poisoned masterwork greatsword") {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("masterwork greatsword"),
                    -1,
                ),
                new ItemTypeAndQuantity(new ItemType("poison potion"), -1),
            ];
        }
        if (this.name === "bone knife") {
            return [
                new ItemTypeAndQuantity(new ItemType("bones"), -2),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "spiked cudgel") {
            return [
                new ItemTypeAndQuantity(new ItemType("club"), -1),
                new ItemTypeAndQuantity(new ItemType("ancient nail"), -2),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "iron dagger") {
            return [
                new ItemTypeAndQuantity(new ItemType("sword"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("ancient nail"), -1),
            ];
        }
        if (this.name === "falchion") {
            return [
                new ItemTypeAndQuantity(new ItemType("iron dagger"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -3),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("bat wing"), -1),
            ];
        }
        if (this.name === "morning star") {
            return [
                new ItemTypeAndQuantity(new ItemType("flanged mace"), -1),
                new ItemTypeAndQuantity(new ItemType("rusted chain"), -2),
                new ItemTypeAndQuantity(new ItemType("ancient nail"), -2),
            ];
        }
        if (this.name === "war pick") {
            return [
                new ItemTypeAndQuantity(new ItemType("war hammer"), -1),
                new ItemTypeAndQuantity(new ItemType("ancient nail"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
            ];
        }
        if (this.name === "heavy crossbow") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -4),
                new ItemTypeAndQuantity(new ItemType("spider silk"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
            ];
        }
        if (this.name === "zweihander") {
            return [
                new ItemTypeAndQuantity(new ItemType("longsword"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -5),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("rusted chain"), -1),
            ];
        }
        if (this.name === "halberd") {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("bearded battle axe"),
                    -1,
                ),
                new ItemTypeAndQuantity(new ItemType("stick"), -2),
                new ItemTypeAndQuantity(new ItemType("iron"), -4),
                new ItemTypeAndQuantity(new ItemType("rusted chain"), -1),
            ];
        }
        if (this.name === "executioner's axe") {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("two-handed battle axe"),
                    -1,
                ),
                new ItemTypeAndQuantity(new ItemType("iron"), -4),
                new ItemTypeAndQuantity(new ItemType("hide"), -2),
                new ItemTypeAndQuantity(new ItemType("cracked skull"), -1),
            ];
        }
        if (this.name === "estoc") {
            return [
                new ItemTypeAndQuantity(new ItemType("arming sword"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -6),
                new ItemTypeAndQuantity(new ItemType("spider silk"), -1),
            ];
        }
        if (this.name === "bec de corbin") {
            return [
                new ItemTypeAndQuantity(new ItemType("war pick"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -4),
                new ItemTypeAndQuantity(new ItemType("rusted chain"), -1),
            ];
        }
        if (this.name === "gothic mace") {
            return [
                new ItemTypeAndQuantity(new ItemType("flanged mace"), -1),
                new ItemTypeAndQuantity(new ItemType("ancient nail"), -4),
                new ItemTypeAndQuantity(new ItemType("iron"), -6),
            ];
        }
        if (this.name === "runed longsword") {
            return [
                new ItemTypeAndQuantity(new ItemType("longsword"), -1),
                new ItemTypeAndQuantity(new ItemType("grave dust"), -2),
                new ItemTypeAndQuantity(new ItemType("iron"), -6),
                new ItemTypeAndQuantity(new ItemType("treasure"), -1),
            ];
        }
        if (this.name === "blacksteel glaive") {
            return [
                new ItemTypeAndQuantity(new ItemType("halberd"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -8),
                new ItemTypeAndQuantity(new ItemType("dungeon moss"), -2),
                new ItemTypeAndQuantity(new ItemType("poison potion"), -1),
            ];
        }
        if (this.name === "relic warhammer") {
            return [
                new ItemTypeAndQuantity(new ItemType("war hammer"), -1),
                new ItemTypeAndQuantity(new ItemType("cracked skull"), -2),
                new ItemTypeAndQuantity(new ItemType("grave dust"), -3),
                new ItemTypeAndQuantity(new ItemType("treasure"), -1),
            ];
        }
        if (this.name === "dragonbone axe") {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("executioner's axe"),
                    -1,
                ),
                new ItemTypeAndQuantity(new ItemType("bones"), -5),
                new ItemTypeAndQuantity(new ItemType("iron"), -8),
                new ItemTypeAndQuantity(new ItemType("poison potion"), -1),
            ];
        }
        if (this.name === "royal claymore") {
            return [
                new ItemTypeAndQuantity(
                    new ItemType("masterwork greatsword"),
                    -1,
                ),
                new ItemTypeAndQuantity(new ItemType("rusted chain"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), -10),
                new ItemTypeAndQuantity(new ItemType("treasure"), -2),
            ];
        }
        if (this.name === "obsidian polearm") {
            return [
                new ItemTypeAndQuantity(new ItemType("blacksteel glaive"), -1),
                new ItemTypeAndQuantity(new ItemType("broken tile"), -5),
                new ItemTypeAndQuantity(new ItemType("grave dust"), -4),
                new ItemTypeAndQuantity(new ItemType("treasure"), -2),
            ];
        }
        if (this.name === "dungeon-forged greatblade") {
            return [
                new ItemTypeAndQuantity(new ItemType("royal claymore"), -1),
                new ItemTypeAndQuantity(new ItemType("bones"), -5),
                new ItemTypeAndQuantity(new ItemType("iron"), -15),
                new ItemTypeAndQuantity(new ItemType("poison potion"), -2),
                new ItemTypeAndQuantity(new ItemType("treasure"), -3),
            ];
        }
        if (this.name === "bone carving") {
            return [
                new ItemTypeAndQuantity(new ItemType("bones"), -2),
                new ItemTypeAndQuantity(new ItemType("stick"), 1),
            ];
        }
        if (this.name === "skull crushing") {
            return [
                new ItemTypeAndQuantity(new ItemType("cracked skull"), -1),
                new ItemTypeAndQuantity(new ItemType("stone"), 2),
            ];
        }
        if (this.name === "chain smelting") {
            return [
                new ItemTypeAndQuantity(new ItemType("rusted chain"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), 2),
            ];
        }
        if (this.name === "dust distilling") {
            return [
                new ItemTypeAndQuantity(new ItemType("grave dust"), -2),
                new ItemTypeAndQuantity(new ItemType("healing potion"), 1),
            ];
        }
        if (this.name === "wing tanning") {
            return [
                new ItemTypeAndQuantity(new ItemType("bat wing"), -2),
                new ItemTypeAndQuantity(new ItemType("hide"), 1),
            ];
        }
        if (this.name === "silk binding") {
            return [
                new ItemTypeAndQuantity(new ItemType("spider silk"), -2),
                new ItemTypeAndQuantity(new ItemType("hay"), 1),
            ];
        }
        if (this.name === "candle reclaiming") {
            return [
                new ItemTypeAndQuantity(new ItemType("black candle"), -1),
                new ItemTypeAndQuantity(new ItemType("torch"), 1),
            ];
        }
        if (this.name === "nail reforging") {
            return [
                new ItemTypeAndQuantity(new ItemType("ancient nail"), -3),
                new ItemTypeAndQuantity(new ItemType("iron ore"), 1),
            ];
        }
        if (this.name === "tile knapping") {
            return [
                new ItemTypeAndQuantity(new ItemType("broken tile"), -2),
                new ItemTypeAndQuantity(new ItemType("stone axe"), 1),
            ];
        }
        if (this.name === "moss brewing") {
            return [
                new ItemTypeAndQuantity(new ItemType("dungeon moss"), -2),
                new ItemTypeAndQuantity(new ItemType("yarrow"), 1),
            ];
        }
        if (this.name === "crucible") {
            return [
                new ItemTypeAndQuantity(new ItemType("stone"), -5),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
            ];
        }
        if (this.name === "dungeon wall") {
            return [
                new ItemTypeAndQuantity(new ItemType("dungeon wall"), 1),
            ];
        }
        if (this.name === "dungeon floor") {
            return [
                new ItemTypeAndQuantity(new ItemType("dungeon floor"), -300),
            ];
        }
        if (this.name === "orc") {
            return [
                new ItemTypeAndQuantity(new ItemType("binding rope"), -2),
                new ItemTypeAndQuantity(new ItemType("coin"), 50),
                new ItemTypeAndQuantity(new ItemType("hide"), 1),
            ];
        }
        if (this.name === "furnace") {
            return [
                new ItemTypeAndQuantity(new ItemType("iron ore"), -3),
                new ItemTypeAndQuantity(new ItemType("hay"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), 9),
            ];
        }
        if (this.name === "armorer's bench") {
            return [
                new ItemTypeAndQuantity(new ItemType("padded hide"), -1),
                new ItemTypeAndQuantity(new ItemType("stick"), -3),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
                new ItemTypeAndQuantity(new ItemType("reinforced shield"), 1),
            ];
        }
        if (this.name === "padded hide") {
            return [
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
            ];
        }
        if (this.name === "wooden shield") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -3),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
            ];
        }
        if (this.name === "reinforced shield") {
            return [
                new ItemTypeAndQuantity(new ItemType("wooden shield"), -1),
                new ItemTypeAndQuantity(new ItemType("hide"), -1),
                new ItemTypeAndQuantity(new ItemType("iron"), -2),
            ];
        }
        if (this.name === "rat") {
            return [
                new ItemTypeAndQuantity(new ItemType("binding rope"), -1),
                new ItemTypeAndQuantity(new ItemType("coin"), 10),
            ];
        }
        if (this.name === "stone axe") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("stone"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -3),
            ];
        }
        if (this.name === "sword") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -2),
                new ItemTypeAndQuantity(new ItemType("iron"), -5),
            ];
        }
        if (this.name === "torch") {
            return [
                new ItemTypeAndQuantity(new ItemType("stick"), -1),
                new ItemTypeAndQuantity(new ItemType("hay"), -1),
                new ItemTypeAndQuantity(new ItemType("root"), -1),
            ];
        }
        if (this.name === "binding rope") {
            return [
                new ItemTypeAndQuantity(new ItemType("hay"), -2),
            ];
        }
        if (this.name === "treasure") {
            return [
                new ItemTypeAndQuantity(new ItemType("coin"), 20),
            ];
        }
        if (this.name === "troll") {
            return [
                new ItemTypeAndQuantity(new ItemType("binding rope"), -3),
                new ItemTypeAndQuantity(new ItemType("club"), 1),
                new ItemTypeAndQuantity(new ItemType("iron"), 2),
                new ItemTypeAndQuantity(new ItemType("hide"), 2),
            ];
        }
        return [];
    }

    // Reusable items needed for an action but not consumed by it.
    requirements(): ItemTypeAndQuantity[] {
        if (this.name === "furnace") {
            return [
                new ItemTypeAndQuantity(new ItemType("crucible"), 1),
            ];
        }

        return [];
    }

    static intrinsicValue(itemName: string): number {
        return ItemType.calculateIntrinsicValue(itemName, new Set<string>());
    }

    static shopPrice(itemName: string, quantity: number, buying: boolean): number {
        const lotValue = ItemType.intrinsicValue(itemName) * quantity;

        return Math.max(
            1,
            buying ? Math.floor(lotValue * .75) : Math.ceil(lotValue * 1.5),
        );
    }

    static vendorCatPlayerScale(tradeName: string): number {
        const buyingPrefix = "cat buying ";
        const sellingPrefix = "cat selling ";
        const buying = tradeName.startsWith(buyingPrefix);
        const selling = tradeName.startsWith(sellingPrefix);
        if (!buying && !selling) {
            return 1;
        }

        const itemName = tradeName.slice(
            buying ? buyingPrefix.length : sellingPrefix.length,
        );
        const trade = ItemType.SHOP_TRADES.find(value => value.item === itemName);
        if (trade === undefined) {
            return 1;
        }

        const prices = ItemType.SHOP_TRADES.reduce<number[]>(
            (values, tradeValue) => values.concat(
                ItemType.shopPrice(
                    tradeValue.item,
                    tradeValue.quantity,
                    true,
                ),
                ItemType.shopPrice(
                    tradeValue.item,
                    tradeValue.quantity,
                    false,
                ),
            ),
            [],
        );
        const minimumPrice = Math.min(...prices);
        const maximumPrice = Math.max(...prices);
        const price = ItemType.shopPrice(trade.item, trade.quantity, buying);
        const pricePosition = (Math.log(price) - Math.log(minimumPrice))
            / (Math.log(maximumPrice) - Math.log(minimumPrice));

        // Price is the only size input: no coordinate or visual-seed jitter.
        return 0.5 + pricePosition * 1.3;
    }

    private static calculateIntrinsicValue(
        itemName: string,
        visiting: Set<string>,
    ): number {
        const foundational = ItemType.FOUNDATIONAL_VALUES[itemName];
        if (foundational !== undefined) {
            return foundational;
        }
        if (visiting.has(itemName)) {
            return 1;
        }
        const nextVisiting = new Set(visiting);
        nextVisiting.add(itemName);
        const itemType = new ItemType(itemName);
        const changes = itemType.prizes();
        const expenses = changes.filter(change => change.quantity < 0);
        const rewards = changes.filter(change => change.quantity > 0);

        if (itemType.isMonster()) {
            const rewardValue = ItemType.valueChanges(rewards, nextVisiting);
            const combatCost = ItemType.valueChanges(expenses, nextVisiting);

            return Math.max(1, Math.round((rewardValue - combatCost) * .5));
        }
        if (expenses.length > 0) {
            const materialValue = ItemType.valueChanges(expenses, nextVisiting);

            return Math.max(1, Math.ceil(materialValue * 1.2));
        }
        if (rewards.length > 0) {
            return Math.max(1, ItemType.valueChanges(rewards, nextVisiting));
        }

        for (const actionName of ItemType.PRODUCTION_ACTIONS) {
            const production = new ItemType(actionName).prizes();
            const output = production.find(change =>
                change.itemType.name === itemName && change.quantity > 0
            );
            if (output === undefined) {
                continue;
            }
            const productionCost = ItemType.valueChanges(
                production.filter(change => change.quantity < 0),
                nextVisiting,
            );

            return Math.max(1, productionCost * 1.2 / output.quantity);
        }

        return 1;
    }

    private static valueChanges(
        changes: ItemTypeAndQuantity[],
        visiting: Set<string>,
    ): number {
        return changes.reduce((total, change) =>
            total + Math.abs(change.quantity)
                * ItemType.calculateIntrinsicValue(change.itemType.name, visiting),
        0);
    }

    private static isDungeonEntranceSeed(seed: number): boolean {
        const modulus = ItemType.ENTRANCE_MODULUS;
        const remainder = ((seed % modulus) + modulus) % modulus;

        return remainder < 2;
    }

    private static isShopEntranceSeed(seed: number): boolean {
        const modulus = ItemType.ENTRANCE_MODULUS;
        const remainder = ((seed % modulus) + modulus) % modulus;

        return remainder === ItemType.SHOP_ENTRANCE_REMAINDER;
    }

}
