import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export interface MaximumQuantityViolation {
    itemType: ItemType;
    maximum: number;
    resultingQuantity: number;
}
export declare class ItemTakingSummary {
    itemType: ItemType;
    prizes: ItemTypeAndQuantity[];
    expenses: ItemTypeAndQuantity[];
    requirements: ItemTypeAndQuantity[];
    missing: ItemTypeAndQuantity[];
    maximumExceeded: MaximumQuantityViolation[];
    constructor(itemType: ItemType, prizes: ItemTypeAndQuantity[], expenses: ItemTypeAndQuantity[], requirements: ItemTypeAndQuantity[], missing: ItemTypeAndQuantity[], maximumExceeded?: MaximumQuantityViolation[]);
    isUnavailable(): boolean;
    getTakeButtonText(): {
        buttonText: string;
        additionalText: string;
    };
    getFightStatusText(): {
        beforeAction: string;
        afterAction: string;
    };
    private maximumQuantityText;
    private maximumQuantityList;
    private areSameChanges;
}
//# sourceMappingURL=ItemTakingSummary.d.ts.map