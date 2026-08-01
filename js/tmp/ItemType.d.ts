import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity";
export declare class ItemType {
    name: string;
    canBeTakenOnlyOnce: boolean;
    prizes: ItemTypeAndQuantity[];
    constructor(name: string, canBeTakenOnlyOnce: boolean, prizes: ItemTypeAndQuantity[]);
    static getWithSeed(seed: number): ItemType | null;
    static getWithName(name: string): ItemType;
}
//# sourceMappingURL=ItemType.d.ts.map