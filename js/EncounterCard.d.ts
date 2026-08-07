import type { ItemOrigin } from "./Inventory.js";
export declare class EncounterCard {
    static readonly ID = "encounterCard";
    private static activeItemToggle;
    static show(description: string, details?: string | HTMLElement, title?: string, returnFocus?: HTMLElement | null, closeLabel?: string): void;
    static showItem(itemName: string, origin: ItemOrigin, returnFocus?: HTMLElement | null): void;
    static clear(): void;
    private static element;
    private static prepare;
    private static setActiveItemToggle;
}
//# sourceMappingURL=EncounterCard.d.ts.map