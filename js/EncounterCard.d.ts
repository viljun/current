import type { ItemOrigin } from "./Inventory.js";
export declare class EncounterCard {
    static readonly ID = "encounterCard";
    static readonly ITEM_FOCUS_EVENT = "encounter-card-item-focus";
    private static activeItemToggle;
    private static activeItemName;
    static show(description: string, details?: string | HTMLElement, title?: string, returnFocus?: HTMLElement | null, closeLabel?: string): void;
    static showItem(itemName: string, origin: ItemOrigin, returnFocus?: HTMLElement | null, ownedQuantity?: number): void;
    static clear(): void;
    private static element;
    private static prepare;
    private static setActiveItemToggle;
    private static setActiveItemName;
}
//# sourceMappingURL=EncounterCard.d.ts.map