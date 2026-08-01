export interface MonsterAction {
    damage: number;
    block: number;
    healing: number;
}

export class MonsterDefinition {
    name: string;
    health: number;
    actionPattern: MonsterAction[];
    handSize: number;

    constructor(name: string, health: number, actionPattern: MonsterAction[], handSize: number) {
        this.name = name;
        this.health = health;
        this.actionPattern = actionPattern;
        this.handSize = handSize;
    }

    static get(name: string): MonsterDefinition|null {
        if (name === "rat") {
            return new MonsterDefinition("rat", 10, [
                { damage: 2, block: 0, healing: 0 },
                { damage: 0, block: 2, healing: 0 },
                { damage: 0, block: 0, healing: 0 },
                { damage: 2, block: 0, healing: 1 },
                { damage: 4, block: 0, healing: 0 },
            ], 5);
        }
        if (name === "orc") {
            return new MonsterDefinition("orc", 24, [
                { damage: 4, block: 1, healing: 0 },
                { damage: 0, block: 4, healing: 0 },
                { damage: 0, block: 0, healing: 3 },
                { damage: 0, block: 0, healing: 0 },
                { damage: 5, block: 3, healing: 0 },
                { damage: 7, block: 0, healing: 0 },
            ], 5);
        }
        if (name === "troll") {
            return new MonsterDefinition("troll", 45, [
                { damage: 6, block: 0, healing: 0 },
                { damage: 0, block: 6, healing: 3 },
                { damage: 0, block: 0, healing: 0 },
                { damage: 7, block: 0, healing: 2 },
                { damage: 9, block: 3, healing: 0 },
                { damage: 0, block: 0, healing: 6 },
                { damage: 12, block: 0, healing: 0 },
            ], 5);
        }

        return null;
    }
}
