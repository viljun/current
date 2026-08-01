import type { ItemActionResult } from "./Inventory.js";
import type { TurnResolution } from "./CardGame.js";
export declare class Effects {
    private static readonly SOUND_STORAGE_KEY;
    private static readonly COMBAT_ITEMS;
    private static readonly CRAFT_ITEMS;
    private static readonly RARE_ITEMS;
    private static soundEnabled;
    private static audioContext;
    static initialize(soundSwitch: HTMLInputElement): void;
    static playItemAction(result: ItemActionResult, sourceElement: HTMLElement | null): void;
    static playFightTurn(resolution: TurnResolution, cardElements: (HTMLElement | null)[], monsterHealthElement: HTMLElement | null, playerHealthElement: HTMLElement | null): void;
    private static getType;
    private static showChanges;
    private static floatText;
    private static animateCard;
    private static centerOf;
    private static playSound;
    private static vibrate;
}
//# sourceMappingURL=Effects.d.ts.map