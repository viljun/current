import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export declare class ItemType {
    name: string;
    constructor(name: string);
    canBeTakenOnlyOnce(): boolean;
    static getWithSeed(seed: number, depth: number): ItemType | null;
    prizes(): ItemTypeAndQuantity[];
}
//# sourceMappingURL=ItemType.d.ts.map