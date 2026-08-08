export type BattleSpellEffect = "freeze" | "slow" | "sunder" | "curse" | "weaken" | "unravel" | "stoneward" | "lifesteal" | "echo" | "doom";
export interface BattleSpellIngredient {
    itemName: string;
    quantity: number;
}
export interface BattleSpellDefinition {
    itemName: string;
    title: string;
    effect: BattleSpellEffect;
    icon: string;
    shortLabel: string;
    description: string;
    ingredients: readonly BattleSpellIngredient[];
}
/**
 * Highland battle spells. Their books are inventory items and fight cards;
 * their combat state is deliberately temporary and is never persisted.
 */
export declare class BattleSpell {
    static readonly DEFINITIONS: readonly BattleSpellDefinition[];
    static get(itemName: string): BattleSpellDefinition | null;
    static forEffect(effect: BattleSpellEffect): BattleSpellDefinition;
    static names(): string[];
    static isBattleSpell(itemName: string): boolean;
}
//# sourceMappingURL=BattleSpell.d.ts.map