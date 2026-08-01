export interface MonsterAction {
    damage: number;
    block: number;
    healing: number;
}
export declare class MonsterDefinition {
    name: string;
    health: number;
    actionPattern: MonsterAction[];
    handSize: number;
    constructor(name: string, health: number, actionPattern: MonsterAction[], handSize: number);
    static get(name: string): MonsterDefinition | null;
}
//# sourceMappingURL=MonsterDefinition.d.ts.map