export interface ItemExplanationSection {
    heading: "Make" | "Catch" | "Use" | "Fight" | "Field note";
    text: string;
}
export declare class ItemExplanation {
    private static readonly MONSTERS;
    private static readonly MONSTER_COST_FACTS;
    private static readonly MONSTER_REWARD_FACTS;
    private static readonly TRANSFORMATION_FACTS;
    private static readonly CRAFTING_COST_FACTS;
    private static readonly FISH_CATCH_FACTS;
    private static readonly WORM_USE_FACTS;
    private static readonly COLLECTION_REWARD_FACTS;
    private static readonly CRAFTING_USE_FACTS;
    private static readonly FIGHT_USE_FACTS;
    private static readonly COIN_FACTS;
    private static readonly YARROW_FACTS;
    private static readonly COMBAT_EFFECT_FACTS;
    private static readonly ITEM_FIELD_NOTES;
    static for(itemName: string, latitude: number, longitude: number, areaId: number): string;
    static sectionsFor(itemName: string, latitude: number, longitude: number, areaId: number): ItemExplanationSection[];
    static element(itemName: string, latitude: number, longitude: number, areaId: number): HTMLDivElement;
    static displayName(itemName: string): string;
    static categoryFor(itemName: string): string;
    private static factSections;
    private static fieldNoteFor;
    private static weaponFieldNote;
    private static monsterFieldNote;
    private static fact;
    private static craftingUses;
    private static fightUses;
    private static changesText;
    private static namesText;
    private static list;
    private static pick;
    private static hash;
    private static numberKey;
}
//# sourceMappingURL=ItemExplanation.d.ts.map