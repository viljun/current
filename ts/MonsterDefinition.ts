export class MonsterDefinition {
    private static readonly DEFINITIONS:
        Readonly<Record<string, readonly [number, number, number, number, number]>> = {
        rat: [6, 0.75, 4, 6, 5],
        orc: [12, 2.0, 5, 7, 5],
        troll: [18, 2.8, 6, 9, 5],
        "bone rat": [7, 0.9, 4, 6, 5],
        "cave bat": [8, 1.0, 4, 6, 5],
        "giant spider": [9, 1.1, 4, 6, 5],
        "plague beetle": [10, 1.2, 4, 7, 5],
        "crypt hound": [11, 1.4, 4, 7, 5],
        "skeletal guard": [13, 1.6, 5, 7, 5],
        "dungeon scavenger": [15, 1.8, 5, 7, 5],
        "goblin cutthroat": [17, 2.0, 5, 8, 5],
        "tomb robber": [19, 2.2, 5, 8, 5],
        "cave crawler": [21, 2.4, 5, 8, 5],
        ghoul: [23, 2.6, 5, 8, 5],
        wight: [25, 2.8, 5, 8, 5],
        cultist: [27, 3.0, 6, 8, 5],
        "armored skeleton": [29, 3.2, 6, 8, 5],
        "brood spider": [31, 3.4, 6, 9, 5],
        "cave troll": [34, 3.6, 6, 9, 5],
        "dungeon orc": [37, 3.8, 6, 9, 5],
        "plague bearer": [40, 4.0, 6, 9, 5],
        "stone sentinel": [43, 4.2, 6, 9, 5],
        "crypt knight": [46, 4.4, 7, 9, 5],
        banshee: [49, 4.6, 7, 10, 5],
        necromancer: [52, 4.8, 7, 10, 5],
        "ogre jailer": [56, 5.0, 7, 10, 5],
        basilisk: [60, 5.2, 7, 10, 5],
        minotaur: [64, 5.4, 7, 10, 5],
        vampire: [68, 5.6, 8, 10, 5],
        lich: [72, 5.8, 8, 11, 5],
        "bone colossus": [77, 6.0, 8, 11, 5],
        "abyssal knight": [82, 6.2, 8, 11, 5],
        "dungeon dragon": [90, 6.5, 9, 12, 5],
    };
    name: string;
    health: number;
    cardStrength: number;
    minimumCards: number;
    maximumCards: number;
    handSize: number;

    constructor(
        name: string,
        health: number,
        cardStrength: number,
        minimumCards: number,
        maximumCards: number,
        handSize: number,
    ) {
        this.name = name;
        this.health = health;
        this.cardStrength = cardStrength;
        this.minimumCards = minimumCards;
        this.maximumCards = maximumCards;
        this.handSize = handSize;
    }

    static get(name: string): MonsterDefinition|null {
        const definition = MonsterDefinition.DEFINITIONS[name];
        if (definition !== undefined) {
            return new MonsterDefinition(name, ...definition);
        }

        return null;
    }
}
