export class MonsterDefinition {
    constructor(name, health, attackPattern, handSize) {
        this.name = name;
        this.health = health;
        this.attackPattern = attackPattern;
        this.handSize = handSize;
    }
    static get(name) {
        if (name === "rat") {
            return new MonsterDefinition("rat", 6, [1, 1, 2], 5);
        }
        if (name === "orc") {
            return new MonsterDefinition("orc", 14, [2, 3, 2, 4], 5);
        }
        if (name === "troll") {
            return new MonsterDefinition("troll", 28, [4, 6, 3, 7], 5);
        }
        return null;
    }
}
