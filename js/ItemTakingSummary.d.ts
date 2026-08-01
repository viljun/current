import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export declare class ItemTakingSummary {
    itemType: ItemType;
    prizes: ItemTypeAndQuantity[];
    expenses: ItemTypeAndQuantity[];
    missing: ItemTypeAndQuantity[];
    constructor(itemType: ItemType, prizes: ItemTypeAndQuantity[], expenses: ItemTypeAndQuantity[], missing: ItemTypeAndQuantity[]);
    getTakeButtonText(): {
        buttonText: string;
        additionalText: string;
    };
    private areSameChanges;
}
//# sourceMappingURL=ItemTakingSummary.d.ts.map