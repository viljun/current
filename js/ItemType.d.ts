import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export declare class ItemType {
    private static readonly SHOP_TRADES;
    name: string;
    constructor(name: string);
    isMonster(): boolean;
    static getWithSeed(seed: number, areaId: number): ItemType | null;
    prizes(): ItemTypeAndQuantity[];
    requirements(): ItemTypeAndQuantity[];
}
//# sourceMappingURL=ItemType.d.ts.map