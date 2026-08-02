export class MonsterDefinition {
    constructor(name, health, cardStrength, minimumCards, maximumCards, handSize) {
        this.name = name;
        this.health = health;
        this.cardStrength = cardStrength;
        this.minimumCards = minimumCards;
        this.maximumCards = maximumCards;
        this.handSize = handSize;
    }
    static get(name) {
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
