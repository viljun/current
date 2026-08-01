export declare class MonsterDefinition {
    name: string;
    health: number;
    attackPattern: number[];
    handSize: number;
    constructor(name: string, health: number, attackPattern: number[], handSize: number);
    static get(name: string): MonsterDefinition | null;
}
//# sourceMappingURL=MonsterDefinition.d.ts.map