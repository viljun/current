import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export declare class ItemType {
    name: string;
    constructor(name: string);
    isMonster(): boolean;
    static getWithSeed(seed: number, depth: number): ItemType | null;
    prizes(): ItemTypeAndQuantity[];
    requirements(): ItemTypeAndQuantity[];
}
//# sourceMappingURL=ItemType.d.ts.map