import { Inventory } from "./Inventory";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity";
export declare class ItemTaking {
    inventory: Inventory;
    prizes: ItemTypeAndQuantity[];
    constructor(inventory: Inventory, prizes: ItemTypeAndQuantity[]);
    summary(): {
        prizes: ItemTypeAndQuantity[];
        expenses: ItemTypeAndQuantity[];
        missing: ItemTypeAndQuantity[];
    };
}
//# sourceMappingURL=ItemTaking.d.ts.map