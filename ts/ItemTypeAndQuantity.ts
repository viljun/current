import { ItemType } from "./ItemType.js";

export class ItemTypeAndQuantity {
    itemType: ItemType;
    quantity: number;
    constructor(itemType: ItemType, quantity: number) {
        this.itemType = itemType;
        this.quantity = quantity;
    }
}
