export class MonsterDefinition {
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
        if (name === "rat") {
            return new MonsterDefinition("rat", 6, 0.75, 4, 6, 5);
        }
        if (name === "orc") {
            return new MonsterDefinition("orc", 14, 2.5, 5, 7, 5);
        }
        if (name === "troll") {
            return new MonsterDefinition("troll", 28, 4.75, 6, 9, 5);
        }

        return null;
    }
}
