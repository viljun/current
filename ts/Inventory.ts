import { Coordinates } from "./Coordinates.js";
import { DungeonMap } from "./DungeonMap.js";
import { HighlandMap } from "./HighlandMap.js";
import { ItemExplanation } from "./ItemExplanation.js";
import { ItemType }    from "./ItemType.js";
import { ItemTypeAndQuantity } from "./ItemTypeAndQuantity.js";
import { OriginArtwork } from "./OriginArtwork.js";
import { ShopMap } from "./ShopMap.js";
import { SurfaceMap } from "./SurfaceMap.js";
import { View }        from './View.js';
import { BattleSpell } from "./BattleSpell.js";
import { CardGame } from "./CardGame.js";
import { ItemTaking } from "./ItemTaking.js";

interface InventorySaveData {
    version: number;
    usedCoordinates: Record<string, boolean>;
    quantities?: Record<string, number>;
}

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
    group: "Weapons"|"Shields"|"Healing"|"Battle spells"|"Tools & materials";
    variants: InventoryRecipeVariant[];
    ready: boolean;
}

export class Inventory {
    private static readonly STORAGE_KEY = "gpsgame.inventory";
    private static readonly SAVE_VERSION = 2;
    private static readonly REMOVED_ITEM_NAMES = [
        "body shop",
        "nature shop",
        "smelter",
        "weapon shop",
    ];
    private static readonly TROLL_WEAPONS = [
        "iron-spiked club",
        "iron hand axe",
        "flanged mace",
        "bearded battle axe",
        "arming sword",
        "war hammer",
        "longsword",
        "two-handed battle axe",
        "poleaxe",
        "masterwork greatsword",
    ];
    private static readonly TROLL_CRAFT_WEAPONS = [
        "iron-spiked club",
        "iron hand axe",
        "arming sword",
    ];
    private static readonly TROLL_WEAPON_RAW_MATERIALS = [
        "stick",
        "stone",
        "root",
        "iron",
        "hide",
    ];
    private static readonly DUNGEON_WEAPONS = [
        "bone knife",
        "spiked cudgel",
        "iron dagger",
        "falchion",
        "morning star",
        "war pick",
        "heavy crossbow",
        "zweihander",
        "halberd",
        "executioner's axe",
        "estoc",
        "bec de corbin",
        "gothic mace",
        "runed longsword",
        "blacksteel glaive",
        "relic warhammer",
        "dragonbone axe",
        "royal claymore",
        "obsidian polearm",
        "dungeon-forged greatblade",
    ];
    private static readonly DUNGEON_MONSTERS = [
        "bone rat", "cave bat", "giant spider", "plague beetle",
        "crypt hound", "skeletal guard", "dungeon scavenger",
        "goblin cutthroat", "tomb robber", "cave crawler", "ghoul",
        "wight", "cultist", "armored skeleton", "brood spider",
        "cave troll", "dungeon orc", "plague bearer", "stone sentinel",
        "crypt knight", "banshee", "necromancer", "ogre jailer",
        "basilisk", "minotaur", "vampire", "lich", "bone colossus",
        "abyssal knight", "dungeon dragon",
    ];
    private static readonly STRONG_WEAPONS = [
        "sword",
        "flanged mace",
        "bearded battle axe",
        "arming sword",
        "war hammer",
        "longsword",
        "two-handed battle axe",
        "poleaxe",
        "masterwork greatsword",
        "poisoned masterwork greatsword",
        ...Inventory.DUNGEON_WEAPONS.slice(3),
    ];

    quantities:      Record<string, number>  = {};
    totalQuantities: Record<string, number>  = {};
    usedCoordinates: Record<string, boolean> = {};
    private readonly changeListeners: (() => void)[] = [];
    constructor() {
        this.load();
    }

    // Returns quantity of the given item type in inventory.
    countItems(itemType: ItemType): number {
        return this.totalQuantities[itemType.name] ?? 0;
    }

    countItemTypes(): number {
        return this.entries().length;
    }

    onChange(listener: () => void): void {
        this.changeListeners.push(listener);
    }

    // Returns the locations of the remaining item instances, newest first.
    // The history is reconstructed from the ordered coordinate keys so old saves work unchanged.
    getItemOrigins(itemName: string): ItemOrigin[] {
        return (this.reconstructItemOrigins()[itemName] ?? []).map(origin => ({ ...origin }));
    }

    getKnownRecipes(): InventoryRecipe[] {
        const discoveries = this.reconstructDiscoveryOrigins();
        const variants = this.recipeVariantsByOutput();
        const recipes: InventoryRecipe[] = [];
        for (const [itemName, origin] of Object.entries(discoveries)) {
            const itemVariants = variants[itemName];
            if (itemVariants === undefined || itemVariants.length === 0) {
                continue;
            }
            recipes.push({
                itemName,
                origin: { ...origin },
                group: this.recipeGroup(itemName),
                variants: itemVariants,
                ready: itemVariants.some(variant => variant.ready),
            });
        }

        return recipes.sort((first, second) =>
            Number(second.ready) - Number(first.ready)
            || first.group.localeCompare(second.group)
            || ItemExplanation.displayName(first.itemName).localeCompare(
                ItemExplanation.displayName(second.itemName),
            )
        );
    }

    // Returns text that describes inventory contents.
    getText(): string {
        return this.getProgressHint();
    }

    getProgressHint(): string {
        const hasAnyWeapon = [
            "club",
            "stone axe",
            "sword",
            "poisoned masterwork greatsword",
            ...Inventory.TROLL_WEAPONS,
            ...Inventory.DUNGEON_WEAPONS,
        ].some(itemName => this.has(itemName));
        if (!hasAnyWeapon) {
            return this.craftingHint(
                "club",
                "Craft a club now.",
            );
        }
        if (!this.has("yarrow")) {
            return "Find yarrow to increase your starting health in fights.";
        }
        if (this.quantity("yarrow") < 2 && !this.has("yarrow poultice")) {
            return "Find one more yarrow to improve your starting health even further.";
        }
        if (!this.has("yarrow poultice") && !this.has("hay")) {
            return "Gather one more yarrow and a hay to make a yarrow poultice.";
        }
        if (!this.has("yarrow poultice")) {
            return "Find and craft a yarrow poultice to heal yourself during fights.";
        }
        const hasImprovedWeapon = this.has("stone axe")
            || this.has("iron-spiked club")
            || this.has("iron hand axe")
            || Inventory.STRONG_WEAPONS.some(itemName => this.has(itemName));
        if (!this.has("rat")) {
            if (!this.has("binding rope")) {
                return this.bindingRopeHayHint()
                    ?? "Find and craft a binding rope to capture a rat.";
            }
            if (!hasImprovedWeapon) {
                return "Find and capture a rat to gain 10 coins and another attack.";
            }
            if (this.quantity("yarrow") < 5) {
                return "Find "
                    + (5 - this.quantity("yarrow"))
                    + " more yarrow to raise your health before capturing a rat.";
            }

            return "Find and capture a rat to gain 10 coins and another attack.";
        }
        if (!hasImprovedWeapon) {
            return this.craftingHint(
                "stone axe",
                "Find and craft a stone axe to deal more damage.",
            );
        }
        if (!this.has("wooden shield") && !this.has("reinforced shield")) {
            return this.craftingHint(
                "wooden shield",
                "Find and craft a wooden shield to block incoming damage.",
            );
        }
        if (!Inventory.STRONG_WEAPONS.some(itemName => this.has(itemName))) {
            if (!this.has("crucible")) {
                const missingCrucibleMaterials = [
                    {
                        itemName: "stone",
                        quantity: Math.max(0, 5 - this.quantity("stone")),
                    },
                    {
                        itemName: "hay",
                        quantity: Math.max(0, 1 - this.quantity("hay")),
                    },
                ].filter(change => change.quantity > 0);
                if (missingCrucibleMaterials.length > 0) {
                    return "Find " + View.arrayToText(
                        missingCrucibleMaterials.map(change =>
                            View.getQuantityText(
                                change.itemName,
                                change.quantity,
                            )
                        ),
                    ) + " to craft a crucible for smelting iron.";
                }

                return "Find and craft a crucible to smelt iron.";
            }
            if (!this.has("furnace")) {
                const missingFurnaceMaterials = [
                    {
                        itemName: "iron ore",
                        current: this.quantity("iron ore"),
                    },
                    {
                        itemName: "hay",
                        current: this.quantity("hay"),
                    },
                ].map(material => ({
                    ...material,
                    missing: Math.max(0, 3 - material.current),
                })).filter(material => material.missing > 0);
                if (missingFurnaceMaterials.length > 0) {
                    return "Find " + View.arrayToText(
                        missingFurnaceMaterials.map(material =>
                            material.missing
                            + (material.current > 0 ? " more " : " ")
                            + material.itemName
                        ),
                    ) + " to smelt iron.";
                }
                if (this.getAreaId() !== 1) {
                    return "Find a dungeon entrance and descend to find a furnace for smelting iron.";
                }

                return "Find a furnace and smelt your iron ore into iron.";
            }
            if (this.getAreaId() === 1) {
                return "Return to the surface, then find and craft a sword to deal more damage.";
            }

            return this.craftingHint(
                "sword",
                "Find and craft a sword to deal more damage.",
            );
        }
        if (!this.has("orc")) {
            if (this.quantity("yarrow") < 9) {
                return "Find "
                    + (9 - this.quantity("yarrow"))
                    + " more yarrow to raise your health before capturing an orc.";
            }
            if (this.quantity("binding rope") < 2) {
                return this.bindingRopeHayHint()
                    ?? "Find 2 binding ropes to capture an orc.";
            }

            return "Find and capture an orc to gain 50 coins and a hide.";
        }
        if (!this.has("troll")) {
            if (!this.has("reinforced shield")) {
                return this.craftingHint(
                    "reinforced shield",
                    "Find and craft a reinforced shield.",
                );
            }
            const trollWeaponCount = [
                ...Inventory.TROLL_WEAPONS,
                "poisoned masterwork greatsword",
                ...Inventory.DUNGEON_WEAPONS.slice(1),
            ].reduce(
                (total, itemName) =>
                    total + Math.min(3, this.quantity(itemName)),
                0,
            );
            if (trollWeaponCount < 5) {
                return this.trollWeaponHint(trollWeaponCount);
            }
            if (this.quantity("yarrow") < 13) {
                return "Find "
                    + (13 - this.quantity("yarrow"))
                    + " more yarrow to raise your health before capturing a troll.";
            }
            if (this.quantity("binding rope") < 3) {
                return this.bindingRopeHayHint()
                    ?? "Carry 3 binding ropes before capturing a troll.";
            }

            return "Find and capture a troll to gain a club, iron, and hides.";
        }
        const hasDungeonMonster = Inventory.DUNGEON_MONSTERS.some(
            itemName => this.has(itemName),
        );
        if (!hasDungeonMonster && this.getAreaId() !== 1) {
            return "Find a dungeon entrance and descend to hunt dungeon monsters.";
        }
        if (!hasDungeonMonster && !this.has("binding rope")) {
            return this.bindingRopeHayHint()
                ?? "Find and craft a binding rope before capturing dungeon monsters.";
        }
        if (!hasDungeonMonster
            && !Inventory.DUNGEON_WEAPONS.some(itemName => this.has(itemName))
        ) {
            return "Collect dungeon materials and craft your first dungeon weapon.";
        }
        if (!hasDungeonMonster) {
            return "Find and capture the weakest dungeon monster to gain dungeon materials.";
        }
        if (this.getAreaId() === 1) {
            return "Return to the surface, then find a highland gate to enter the rugged realm.";
        }
        if (this.getAreaId() !== 3) {
            return "Find a highland gate and enter the rugged realm.";
        }
        const spellCount = [
            "spell of force",
            "spell of mending",
            "spell of warding",
        ].filter(itemName => this.has(itemName)).length;
        if (spellCount === 0) {
            return "Find an enormous castle and search its passages for a magician who sells permanent spells.";
        }
        if (spellCount < 3) {
            return "Search another castle for a different permanent spell.";
        }
        const battleSpellCount = BattleSpell.names().filter(
            itemName => this.has(itemName),
        ).length;
        if (battleSpellCount === 0) {
            return "Find and craft a Highland battle spell to bend the rules during captures.";
        }
        if (battleSpellCount < BattleSpell.DEFINITIONS.length) {
            return "Find and craft another Highland battle spell to gain a new capture tactic.";
        }

        return "Explore the highlands and master your spellbook.";
    }

    private bindingRopeHayHint(): string|null {
        const missingHay = Math.max(0, 2 - this.quantity("hay"));
        if (missingHay === 0) {
            return null;
        }

        return "Get "
            + (missingHay === 1 ? "a hay" : missingHay + " hay")
            + " for a binding rope.";
    }

    private trollWeaponHint(currentWeaponCount: number): string {
        let remaining = 5 - currentWeaponCount;
        const targets: { itemName: string; quantity: number }[] = [];
        for (const itemName of Inventory.TROLL_CRAFT_WEAPONS) {
            const quantity = Math.min(
                remaining,
                Math.max(0, 3 - this.quantity(itemName)),
            );
            if (quantity > 0) {
                targets.push({ itemName, quantity });
                remaining -= quantity;
            }
            if (remaining === 0) {
                break;
            }
        }

        const available = { ...this.totalQuantities };
        const missing: Record<string, number> = {};
        const rawMaterials = new Set(
            Inventory.TROLL_WEAPON_RAW_MATERIALS,
        );
        const requireItem = (itemName: string, quantity: number): void => {
            const used = Math.min(available[itemName] ?? 0, quantity);
            available[itemName] = (available[itemName] ?? 0) - used;
            const required = quantity - used;
            if (required === 0) {
                return;
            }
            const ingredients = new ItemType(itemName).prizes()
                .filter(change => change.quantity < 0);
            if (rawMaterials.has(itemName) || ingredients.length === 0) {
                missing[itemName] = (missing[itemName] ?? 0) + required;

                return;
            }
            for (const ingredient of ingredients) {
                requireItem(
                    ingredient.itemType.name,
                    -ingredient.quantity * required,
                );
            }
        };
        for (const target of targets) {
            for (
                const ingredient of new ItemType(target.itemName).prizes()
                    .filter(change => change.quantity < 0)
            ) {
                requireItem(
                    ingredient.itemType.name,
                    -ingredient.quantity * target.quantity,
                );
            }
        }

        const targetText = View.arrayToText(targets.map(target =>
            View.getQuantityText(target.itemName, target.quantity)
        ));
        const missingText = Inventory.TROLL_WEAPON_RAW_MATERIALS
            .filter(itemName => (missing[itemName] ?? 0) > 0)
            .map(itemName => {
                const quantity = missing[itemName] ?? 0;

                return itemName === "iron" && quantity === 1
                    ? "1 iron"
                    : View.getQuantityText(itemName, quantity);
            });
        const reason =
            " Five upgraded weapons will prepare you to capture a troll.";
        if (missingText.length > 0) {
            return "Find " + View.arrayToText(missingText)
                + " for " + targetText + "." + reason;
        }

        return "Find and craft " + targetText + "." + reason;
    }

    private craftingHint(
        actionName: string,
        readyText: string,
    ): string {
        const missing = new ItemType(actionName).prizes()
            .filter(change => change.quantity < 0)
            .map(change => ({
                itemName: change.itemType.name,
                quantity: Math.max(
                    0,
                    -change.quantity - this.quantity(change.itemType.name),
                ),
            }))
            .filter(change => change.quantity > 0);
        if (missing.length === 0) {
            return readyText;
        }
        const missingText = missing.map(change =>
            View.getQuantityText(change.itemName, change.quantity)
        );

        return "Find " + View.arrayToText(missingText)
            + " to craft " + View.getQuantityText(actionName, 1) + ".";
    }

    private has(itemName: string): boolean {
        return this.quantity(itemName) > 0;
    }

    private quantity(itemName: string): number {
        return this.totalQuantities[itemName] ?? 0;
    }

    openDialog(): void {
        const entries = this.entries();
        const recipes = this.getKnownRecipes();
        const dialog = document.createElement("dialog");
        dialog.className = "inventory-dialog";
        dialog.setAttribute("aria-labelledby", "inventory-title");
        const title = document.createElement("h1");
        title.id = "inventory-title";
        title.textContent = "Inventory";
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", "Close inventory");
        closeButton.onclick = () => dialog.close();
        const header = document.createElement("header");
        header.className = "dialog-header";
        header.append(title, closeButton);
        const tabs = document.createElement("nav");
        tabs.className = "inventory-tabs";
        tabs.setAttribute("role", "tablist");
        tabs.setAttribute("aria-label", "Inventory sections");
        const itemsTab = this.dialogTab("Items");
        const recipesTab = this.dialogTab("Recipes");
        tabs.append(itemsTab, recipesTab);
        const content = document.createElement("div");
        content.id = "inventory-tab-panel";
        content.className = "dialog-content inventory-dialog-content";
        content.setAttribute("role", "tabpanel");
        const showTab = (tab: "items"|"recipes"): void => {
            const itemsSelected = tab === "items";
            tabs.dataset.activeTab = tab;
            itemsTab.setAttribute("aria-selected", String(itemsSelected));
            recipesTab.setAttribute("aria-selected", String(!itemsSelected));
            itemsTab.classList.toggle("inventory-tab--active", itemsSelected);
            recipesTab.classList.toggle("inventory-tab--active", !itemsSelected);
            content.setAttribute(
                "aria-labelledby",
                itemsSelected ? itemsTab.id : recipesTab.id,
            );
            content.replaceChildren(
                itemsSelected
                    ? this.createInventoryList(entries)
                    : this.createRecipeView(recipes),
            );
        };
        itemsTab.onclick = () => showTab("items");
        recipesTab.onclick = () => showTab("recipes");
        showTab("items");

        dialog.append(header, tabs, content);
        dialog.addEventListener("close", () => dialog.remove(), { once: true });
        document.body.append(dialog);
        dialog.showModal();
    }

    private dialogTab(label: "Items"|"Recipes"): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.id = "inventory-" + label.toLowerCase() + "-tab";
        button.className = "inventory-tab";
        button.setAttribute("role", "tab");
        button.setAttribute("aria-controls", "inventory-tab-panel");
        button.textContent = label;

        return button;
    }

    private createInventoryList(entries: [string, number][]): HTMLElement {
        if (entries.length === 0) {
            return this.emptyDialogMessage(
                "Your inventory is empty. The backpack is enjoying the rest.",
            );
        }
        const list = document.createElement("div");
        list.className = "inventory-list";
        for (const [name, quantity] of entries) {
            const item = document.createElement("article");
            item.className = "inventory-entry";
            const origin = this.getItemOrigins(name)[0] ?? {
                latitude: 0,
                longitude: 0,
                areaId: this.getAreaId(),
            };
            const header = document.createElement("header");
            header.className = "inventory-entry-header";
            const artwork = OriginArtwork.create(
                name,
                origin,
                "inventory-entry-art",
            );
            OriginArtwork.containSubject(
                artwork,
                "inventory-entry-art-subject-frame",
            );
            const identity = document.createElement("div");
            identity.className = "inventory-entry-identity";
            const label = document.createElement("h2");
            label.className = "inventory-entry-name";
            label.textContent = ItemExplanation.displayName(name);
            const category = document.createElement("span");
            category.className = "inventory-entry-category";
            category.textContent = ItemExplanation.categoryFor(name);
            identity.append(label, category);
            const quantityBadge = document.createElement("span");
            quantityBadge.className = "inventory-entry-quantity";
            quantityBadge.textContent = "×" + quantity;
            quantityBadge.setAttribute(
                "aria-label",
                "Quantity " + quantity,
            );
            header.append(artwork, identity, quantityBadge);
            const explanation = ItemExplanation.element(
                name,
                origin.latitude,
                origin.longitude,
                origin.areaId,
            );
            explanation.classList.add("inventory-entry-description");
            item.append(header, explanation);
            list.append(item);
        }

        return list;
    }

    private createRecipeView(recipes: InventoryRecipe[]): HTMLElement {
        if (recipes.length === 0) {
            return this.emptyDialogMessage(
                "Find or create a craftable item to add its recipe here.",
            );
        }
        const view = document.createElement("section");
        view.className = "recipe-book";
        const toolbar = document.createElement("div");
        toolbar.className = "recipe-toolbar";
        const filterLabel = document.createElement("label");
        filterLabel.className = "recipe-filter-label";
        filterLabel.textContent = "Show";
        const filter = document.createElement("select");
        filter.className = "recipe-filter";
        filter.setAttribute("aria-label", "Filter recipes");
        const filters = [
            ["all", "All recipes"],
            ["ready", "Ready to craft"],
            ["Weapons", "Weapons"],
            ["Shields", "Shields"],
            ["Healing", "Healing"],
            ["Battle spells", "Battle spells"],
            ["Tools & materials", "Tools & materials"],
        ] as const;
        for (const [value, label] of filters) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            filter.append(option);
        }
        filterLabel.append(filter);
        const count = document.createElement("span");
        count.className = "recipe-count";
        const note = document.createElement("p");
        note.className = "recipe-book-note";
        note.textContent = "Find the item or method on the map when you are ready to craft.";
        const list = document.createElement("div");
        list.className = "recipe-list";
        const render = (): void => {
            const shown = recipes.filter(recipe =>
                filter.value === "all"
                || (filter.value === "ready" && recipe.ready)
                || recipe.group === filter.value
            );
            count.textContent = shown.length === recipes.length
                ? recipes.length + (recipes.length === 1 ? " recipe" : " recipes")
                : shown.length + " of " + recipes.length;
            list.replaceChildren();
            shown.forEach((recipe, index) =>
                list.append(this.createRecipeEntry(recipe, index))
            );
            if (shown.length === 0) {
                list.append(this.emptyDialogMessage(
                    "No known recipes match this filter.",
                ));
            }
        };
        filter.onchange = render;
        toolbar.append(filterLabel, count);
        view.append(toolbar, note, list);
        render();

        return view;
    }

    private createRecipeEntry(
        recipe: InventoryRecipe,
        index: number,
    ): HTMLElement {
        const entry = document.createElement("article");
        entry.className = "recipe-entry "
            + (recipe.ready ? "recipe-entry--ready" : "recipe-entry--missing");
        entry.dataset.itemName = recipe.itemName;
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "recipe-entry-toggle";
        const detailsId = "recipe-details-"
            + recipe.itemName.replace(/[^a-z0-9]+/g, "-") + "-" + index;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", detailsId);
        const artwork = OriginArtwork.create(
            recipe.itemName,
            recipe.origin,
            "recipe-entry-art",
        );
        OriginArtwork.containSubject(
            artwork,
            "inventory-entry-art-subject-frame",
        );
        const identity = document.createElement("span");
        identity.className = "recipe-entry-identity";
        const name = document.createElement("strong");
        name.className = "recipe-entry-name";
        name.textContent = ItemExplanation.displayName(recipe.itemName);
        const group = document.createElement("span");
        group.className = "recipe-entry-group";
        group.textContent = recipe.group;
        identity.append(name, group);
        const status = document.createElement("span");
        status.className = "recipe-status";
        status.textContent = recipe.ready ? "Ready" : "Missing items";
        toggle.append(artwork, identity, status);

        const summary = document.createElement("p");
        summary.className = "recipe-summary";
        summary.textContent = this.recipeSummary(recipe);
        const variants = document.createElement("div");
        variants.className = "recipe-variants";
        recipe.variants.forEach(variant =>
            variants.append(this.createRecipeVariant(recipe, variant))
        );
        const details = ItemExplanation.element(
            recipe.itemName,
            recipe.origin.latitude,
            recipe.origin.longitude,
            recipe.origin.areaId,
        );
        details.id = detailsId;
        details.classList.add("recipe-entry-details");
        details.hidden = true;
        toggle.onclick = () => {
            details.hidden = !details.hidden;
            toggle.setAttribute("aria-expanded", String(!details.hidden));
        };
        entry.append(toggle, summary, variants, details);

        return entry;
    }

    private createRecipeVariant(
        recipe: InventoryRecipe,
        variant: InventoryRecipeVariant,
    ): HTMLElement {
        const section = document.createElement("section");
        section.className = "recipe-variant";
        const heading = document.createElement("h3");
        heading.className = "recipe-variant-title";
        heading.textContent = variant.actionName === recipe.itemName
            ? "Recipe"
            : "Method: " + ItemExplanation.displayName(variant.actionName);
        if (variant.outputQuantity > 1) {
            const output = document.createElement("span");
            output.className = "recipe-output-quantity";
            output.textContent = "Makes ×" + variant.outputQuantity;
            heading.append(output);
        }
        const ingredients = document.createElement("ul");
        ingredients.className = "recipe-ingredients";
        for (const ingredient of variant.ingredients) {
            const item = document.createElement("li");
            item.className = "recipe-ingredient "
                + (ingredient.owned >= ingredient.required
                    ? "recipe-ingredient--owned"
                    : "recipe-ingredient--missing");
            if (ingredient.reusable) {
                item.classList.add("recipe-ingredient--reusable");
                item.title = "Required but not consumed";
            }
            const label = document.createElement("span");
            label.className = "recipe-ingredient-name";
            label.textContent = ItemExplanation.displayName(
                ingredient.itemName,
            ) + (ingredient.reusable ? " (kept)" : "");
            const quantity = document.createElement("strong");
            quantity.textContent = ingredient.owned + "/" + ingredient.required;
            item.append(label, quantity);
            ingredients.append(item);
        }
        section.append(heading, ingredients);

        return section;
    }

    private recipeSummary(recipe: InventoryRecipe): string {
        const sections = ItemExplanation.sectionsFor(
            recipe.itemName,
            recipe.origin.latitude,
            recipe.origin.longitude,
            recipe.origin.areaId,
        );
        const useful = sections.find(section => section.heading === "Fight")
            ?? sections.find(section => section.heading === "Use");

        return useful?.text
            ?? "A known recipe. Gather its ingredients, then find it on the map to craft it.";
    }

    private emptyDialogMessage(text: string): HTMLElement {
        const message = document.createElement("p");
        message.className = "inventory-empty";
        message.textContent = text;

        return message;
    }

    isItemTypeTaken(itemType: ItemType): boolean {
        return (this.totalQuantities[itemType.name] ?? 0) > 0;
    }

    coordinatesToString(coordinates: Coordinates): string {
        return coordinates.latitude + "," + coordinates.longitude + "," + this.getAreaId();
    }

    // Returns true if item in the given location has been picked up.
    isItemTaken(coordinates: Coordinates): boolean {
        if (this.usedCoordinates.hasOwnProperty(this.coordinatesToString(coordinates))) {
            return true;
        }

        return false;
    }

    // Adds item in the given coordinates to inventory.
    takeItem(coordinates: Coordinates): ItemActionResult|null {
        const areaId = this.getAreaId();
        let itemType = this.itemAtCoordinates(coordinates, areaId);
        if (itemType === null) {
            console.log("There's no item at " + this.coordinatesToString(coordinates));

            return null;
        }
        const coordinatesKey = this.coordinatesToString(coordinates);
        if (this.usedCoordinates.hasOwnProperty(coordinatesKey)) {
            console.log("You have already taken this " + itemType.name + ".");

            return null;
        }
        if (itemType.name === "stairs up") {
            this.exitArea();

            return { itemType, prizes: [], expenses: [] };
        }
        if (ItemTaking.maximumQuantityViolations(
            itemType,
            this.totalQuantities,
        ).length > 0) {
            console.log(
                "Taking this " + itemType.name
                    + " would exceed an inventory limit.",
            );

            return null;
        }

        this.usedCoordinates[coordinatesKey] = true;
        this.reconstructQuantities();
        this.save();
        for (const listener of this.changeListeners) {
            listener();
        }

        const changes = itemType.prizes();

        return {
            itemType: itemType,
            prizes: changes.filter(change => change.quantity > 0),
            expenses: changes.filter(change => change.quantity < 0),
        };
    }

    private load(): void {
        try {
            const serialized = localStorage.getItem(Inventory.STORAGE_KEY);
            if (serialized === null) {
                return;
            }

            const saveData: unknown = JSON.parse(serialized);
            if (!this.isValidSaveData(saveData)) {
                console.warn("Ignoring invalid inventory save data.");

                return;
            }

            this.usedCoordinates = { ...saveData.usedCoordinates };
            this.reconstructQuantities();
            if (saveData.version !== Inventory.SAVE_VERSION) {
                this.save();
            }
        } catch (error) {
            console.warn("Unable to load inventory save data.", error);
        }
    }

    private save(): void {
        const saveData: InventorySaveData = {
            version: Inventory.SAVE_VERSION,
            usedCoordinates: this.usedCoordinates,
        };

        try {
            localStorage.setItem(Inventory.STORAGE_KEY, JSON.stringify(saveData));
        } catch (error) {
            console.warn("Unable to save inventory.", error);
        }
    }

    private isValidSaveData(saveData: unknown): saveData is InventorySaveData {
        if (typeof saveData !== "object" || saveData === null) {
            return false;
        }

        const value = saveData as Record<string, unknown>;
        if (!this.isUsedCoordinatesRecord(value.usedCoordinates)) {
            return false;
        }

        if (value.version === Inventory.SAVE_VERSION) {
            return true;
        }

        return value.version === 1
            && this.isQuantityRecord(value.quantities);
    }

    private isQuantityRecord(value: unknown): value is Record<string, number> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return false;
        }

        return Object.values(value).every(quantity =>
            typeof quantity === "number"
            && Number.isSafeInteger(quantity)
            && quantity >= 0
        );
    }

    private isUsedCoordinatesRecord(value: unknown): value is Record<string, boolean> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return false;
        }

        return Object.values(value).every(isUsed => isUsed === true);
    }

    private reconstructItemOrigins(): Record<string, ItemOrigin[]> {
        const origins: Record<string, ItemOrigin[]> = {};
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = this.itemAtCoordinates(coordinates, origin.areaId);
            if (action === null) {
                continue;
            }

            if (!ItemType.isTransientAction(action.name)) {
                this.addOrigins(origins, action.name, 1, origin);
            }
            for (const change of action.prizes()) {
                if (change.quantity > 0) {
                    this.addOrigins(origins, change.itemType.name, change.quantity, origin);
                } else {
                    // Spend old instances first, leaving recent pickups available for card art.
                    origins[change.itemType.name]?.splice(change.quantity);
                }
            }
        }

        return origins;
    }

    private reconstructDiscoveryOrigins(): Record<string, ItemOrigin> {
        const discoveries: Record<string, ItemOrigin> = {};
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const action = this.itemAtCoordinates(
                new Coordinates(origin.latitude, origin.longitude),
                origin.areaId,
            );
            if (action === null
                || Inventory.REMOVED_ITEM_NAMES.includes(action.name)
            ) {
                continue;
            }
            if (!ItemType.isTransientAction(action.name)) {
                discoveries[action.name] = { ...origin };
            }
            for (const change of action.prizes()) {
                if (change.quantity > 0) {
                    discoveries[change.itemType.name] = { ...origin };
                }
            }
        }

        return discoveries;
    }

    private recipeVariantsByOutput(): Record<
        string,
        InventoryRecipeVariant[]
    > {
        const recipes: Record<string, InventoryRecipeVariant[]> = {};
        for (const actionName of ItemType.CRAFTING_ACTIONS) {
            const action = new ItemType(actionName);
            const changes = action.prizes();
            const expenses = changes.filter(change => change.quantity < 0);
            if (expenses.length === 0) {
                continue;
            }
            const prizes = changes.filter(change => change.quantity > 0);
            const outputs = prizes.length > 0
                ? prizes.map(prize => ({
                    itemName: prize.itemType.name,
                    quantity: prize.quantity,
                }))
                : [{ itemName: actionName, quantity: 1 }];
            const ingredients: InventoryRecipeIngredient[] = [
                ...expenses.map(expense => ({
                    itemName: expense.itemType.name,
                    required: -expense.quantity,
                    owned: Math.max(
                        0,
                        this.totalQuantities[expense.itemType.name] ?? 0,
                    ),
                    reusable: false,
                })),
                ...action.requirements().map(requirement => ({
                    itemName: requirement.itemType.name,
                    required: requirement.quantity,
                    owned: Math.max(
                        0,
                        this.totalQuantities[requirement.itemType.name] ?? 0,
                    ),
                    reusable: true,
                })),
            ];
            const ready = ingredients.every(
                ingredient => ingredient.owned >= ingredient.required,
            );
            for (const output of outputs) {
                recipes[output.itemName] ??= [];
                recipes[output.itemName]!.push({
                    actionName,
                    outputQuantity: output.quantity,
                    ingredients: ingredients.map(ingredient => ({
                        ...ingredient,
                    })),
                    ready,
                });
            }
        }

        return recipes;
    }

    private recipeGroup(itemName: string): InventoryRecipe["group"] {
        if (BattleSpell.isBattleSpell(itemName)) {
            return "Battle spells";
        }
        const effects = CardGame.itemCardEffects(itemName);
        if (effects?.healing !== undefined && effects.healing > 0) {
            return "Healing";
        }
        if (effects !== null && effects.block > effects.damage) {
            return "Shields";
        }
        if (effects !== null && effects.damage > 0) {
            return "Weapons";
        }

        return "Tools & materials";
    }

    private addOrigins(
        origins: Record<string, ItemOrigin[]>,
        itemName: string,
        quantity: number,
        origin: ItemOrigin,
    ): void {
        origins[itemName] ??= [];
        for (let index = 0; index < quantity; index++) {
            origins[itemName]!.unshift({ ...origin });
        }
    }

    private parseOrigin(key: string): ItemOrigin|null {
        const parts = key.split(",");
        if (parts.length !== 3) {
            return null;
        }
        const latitude = Number(parts[0]);
        const longitude = Number(parts[1]);
        const areaId = Number(parts[2]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || !Number.isSafeInteger(areaId)
        ) {
            return null;
        }

        return { latitude, longitude, areaId };
    }

    private entries(): [string, number][] {
        return Object.entries(this.totalQuantities).filter(
            (entry): entry is [string, number] => entry[1] !== 0,
        );
    }

    // Update inventory total quantities by adding prizes and inventory.
    updateTotalQuantities(): void {
        this.totalQuantities = {};
        for (const [quantitiesKey, value] of Object.entries(this.quantities)) {
            // Copy value from general this.
            if (!ItemType.isTransientAction(quantitiesKey)) {
                if (!this.totalQuantities.hasOwnProperty(quantitiesKey)) {
                    this.totalQuantities[quantitiesKey] = 0;
                }
                this.totalQuantities[quantitiesKey] ??= 0;
                this.totalQuantities[quantitiesKey] +=
                    this.quantities[quantitiesKey] ?? 0;
            }

            // Add prizes.
            const itemType = new ItemType(quantitiesKey);
            for (const prize of itemType.prizes()) {
                const itemTypeName = prize.itemType.name;
                this.totalQuantities[itemTypeName] ??= 0;
                this.totalQuantities[itemTypeName] += prize.quantity * (this.quantities[quantitiesKey] ?? 0);
            }
        }
    }

    private reconstructQuantities(): void {
        this.quantities = {};
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(
                origin.latitude,
                origin.longitude,
            );
            const action = this.itemAtCoordinates(coordinates, origin.areaId);
            if (action === null
                || Inventory.REMOVED_ITEM_NAMES.includes(action.name)
            ) {
                continue;
            }
            this.quantities[action.name] ??= 0;
            this.quantities[action.name]!++;
        }
        this.updateTotalQuantities();
    }

    getAreaId(): number {
        let areaId = 0;
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin?.areaId !== 0) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = ItemType.getWithSeed(coordinates.getSeed(), 0)?.name;
            if (action === "dungeon entrance") {
                areaId = 1;
            } else if (action === "shop entrance") {
                areaId = 2;
            } else if (action === "highland gate") {
                areaId = 3;
            }
        }

        return areaId;
    }

    exitArea(): void {
        for (const key of Object.keys(this.usedCoordinates)) {
            const origin = this.parseOrigin(key);
            if (origin === null) {
                continue;
            }
            const coordinates = new Coordinates(origin.latitude, origin.longitude);
            const action = this.itemAtCoordinates(coordinates, origin.areaId);
            if (action !== null && [
                "dungeon entrance",
                "highland gate",
                "shop entrance",
                "stairs up",
            ].includes(action.name)) {
                delete this.usedCoordinates[key];
            }
        }
        this.reconstructQuantities();
        this.save();
        for (const listener of this.changeListeners) {
            listener();
        }
    }

    private itemAtCoordinates(
        coordinates: Coordinates,
        areaId: number,
    ): ItemType|null {
        if (areaId === 1) {
            return DungeonMap.itemAt(coordinates);
        }
        if (areaId === 2 && ShopMap.isOutside(coordinates)) {
            return ItemType.getShopOutsideWithSeed(coordinates.getSeed());
        }
        if (areaId === 3) {
            return HighlandMap.itemAt(coordinates);
        }
        if (areaId === 0) {
            return SurfaceMap.itemAt(coordinates);
        }

        return ItemType.getWithSeed(coordinates.getSeed(), areaId);
    }
}
