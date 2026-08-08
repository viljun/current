import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
export interface ItemActionResult {
    itemType: ItemType;
    prizes: ItemTypeAndQuantity[];
    expenses: ItemTypeAndQuantity[];
}
export interface ItemOrigin {
    latitude: number;
    longitude: number;
    areaId: number;
}
export interface InventoryRecipeIngredient {
    itemName: string;
    required: number;
    owned: number;
    reusable: boolean;
}
export interface InventoryRecipeVariant {
    actionName: string;
    outputQuantity: number;
    ingredients: InventoryRecipeIngredient[];
    ready: boolean;
}
export interface InventoryRecipe {
    itemName: string;
    origin: ItemOrigin;
    group: "Weapons" | "Shields" | "Healing" | "Battle spells" | "Tools & materials";
    variants: InventoryRecipeVariant[];
    ready: boolean;
}
export declare class Inventory {
    private static readonly STORAGE_KEY;
    private static readonly SAVE_VERSION;
    private static readonly REMOVED_ITEM_NAMES;
    private static readonly TROLL_WEAPONS;
    private static readonly TROLL_CRAFT_WEAPONS;
    private static readonly TROLL_WEAPON_RAW_MATERIALS;
    private static readonly DUNGEON_WEAPONS;
    private static readonly DUNGEON_MONSTERS;
    private static readonly STRONG_WEAPONS;
    quantities: Record<string, number>;
    totalQuantities: Record<string, number>;
    usedCoordinates: Record<string, boolean>;
    private readonly changeListeners;
    constructor();
    countItems(itemType: ItemType): number;
    countItemTypes(): number;
    onChange(listener: () => void): void;
    getItemOrigins(itemName: string): ItemOrigin[];
    getKnownRecipes(): InventoryRecipe[];
    getText(): string;
    getProgressHint(): string;
    private bindingRopeHayHint;
    private trollWeaponHint;
    private craftingHint;
    private has;
    private quantity;
    openDialog(): void;
    private dialogTab;
    private createInventoryList;
    private createRecipeView;
    private createRecipeEntry;
    private createRecipeVariant;
    private recipeSummary;
    private emptyDialogMessage;
    isItemTypeTaken(itemType: ItemType): boolean;
    coordinatesToString(coordinates: Coordinates): string;
    isItemTaken(coordinates: Coordinates): boolean;
    takeItem(coordinates: Coordinates): ItemActionResult | null;
    private load;
    private save;
    private isValidSaveData;
    private isQuantityRecord;
    private isUsedCoordinatesRecord;
    private reconstructItemOrigins;
    private reconstructDiscoveryOrigins;
    private recipeVariantsByOutput;
    private recipeGroup;
    private addOrigins;
    private parseOrigin;
    private entries;
    updateTotalQuantities(): void;
    private reconstructQuantities;
    getAreaId(): number;
    exitArea(): void;
    private itemAtCoordinates;
}
//# sourceMappingURL=Inventory.d.ts.map