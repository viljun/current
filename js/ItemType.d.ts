import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export declare class ItemType {
    static readonly RIVER_FISH_NAMES: readonly ["river trout", "silver perch", "northern pike", "common carp", "river eel"];
    private static readonly ENTRANCE_MODULUS;
    private static readonly SHOP_ENTRANCE_REMAINDER;
    private static readonly SHOP_TRADE_DENSITY_DIVISOR;
    private static readonly HIGHLAND_ENTRANCE_MODULUS;
    private static readonly HIGHLAND_ENTRANCE_REMAINDER;
    private static readonly SHOP_TRADES;
    private static readonly FOUNDATIONAL_VALUES;
    private static readonly PRODUCTION_ACTIONS;
    private static readonly DUNGEON_FURNACE_MODULI;
    private static readonly DUNGEON_MONSTERS;
    private static readonly DUNGEON_MATERIALS;
    private static readonly DUNGEON_MONSTER_REWARD_MATERIALS;
    private static readonly DUNGEON_WEAPONS;
    private static readonly DUNGEON_ACTIONS;
    name: string;
    constructor(name: string);
    isMonster(): boolean;
    static isRiverFish(itemName: string): boolean;
    static isTransientAction(itemName: string): boolean;
    static getWithSeed(seed: number, areaId: number): ItemType | null;
    private static frequencyGate;
    static getShopOutsideWithSeed(seed: number): ItemType | null;
    static isHighlandEntranceSeed(seed: number): boolean;
    prizes(): ItemTypeAndQuantity[];
    requirements(): ItemTypeAndQuantity[];
    static intrinsicValue(itemName: string): number;
    static shopPrice(itemName: string, quantity: number, buying: boolean): number;
    static vendorCatPlayerScale(tradeName: string): number;
    private static calculateIntrinsicValue;
    private static valueChanges;
    private static isDungeonEntranceSeed;
    private static isShopEntranceSeed;
}
//# sourceMappingURL=ItemType.d.ts.map