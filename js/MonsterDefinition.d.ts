export declare class MonsterDefinition {
    name: string;
    health: number;
    cardStrength: number;
    minimumCards: number;
    maximumCards: number;
    handSize: number;
    constructor(name: string, health: number, cardStrength: number, minimumCards: number, maximumCards: number, handSize: number);
    static get(name: string): MonsterDefinition | null;
}
//# sourceMappingURL=MonsterDefinition.d.ts.map