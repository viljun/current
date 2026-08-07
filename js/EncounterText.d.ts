export interface EncounterIdentity {
    name: string;
    description: string;
}
export declare class EncounterText {
    private static readonly CAT_NAME_ROOTS;
    private static readonly CAT_NAME_ENDINGS;
    private static readonly CAT_TITLES;
    private static readonly CAT_COATS;
    private static readonly CAT_MOODS;
    private static readonly CAT_QUIRKS;
    private static readonly CAT_TRADE_CLAIMS;
    private static readonly CAT_BUYING_LINES;
    private static readonly CAT_SELLING_LINES;
    private static readonly MAGICIAN_NAMES;
    private static readonly MAGICIAN_NOTES;
    private static readonly CREATURE_NAME_ROOTS;
    private static readonly CREATURE_NAME_ENDINGS;
    private static readonly CREATURE_TITLES;
    private static readonly CREATURE_ADJECTIVES;
    private static readonly CREATURE_HABITS;
    private static readonly CREATURE_POSSESSIONS;
    private static readonly CREATURE_REPUTATIONS;
    static for(itemName: string, latitude: number, longitude: number): EncounterIdentity;
    static monsterLabel(itemName: string, generatedName: string): string;
    private static cat;
    private static creature;
    private static magician;
    private static generatedName;
    private static fillItem;
    private static fill;
    private static withIndefiniteArticle;
    private static capitalize;
    private static pick;
    private static hash;
    private static numberKey;
}
//# sourceMappingURL=EncounterText.d.ts.map