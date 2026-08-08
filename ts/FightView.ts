import { CardGame }                from "./CardGame.js";
import type {
    CardGameState,
    CardPlayResolution,
} from "./CardGame.js";
import { Coordinates }            from "./Coordinates.js";
import { EncounterText }          from "./EncounterText.js";
import { Effects }                from "./Effects.js";
import { Inventory }              from "./Inventory.js";
import { ItemTaking }             from "./ItemTaking.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import { ItemType }               from "./ItemType.js";
import type { Map }               from "./Map.js";
import { MonsterDefinition }      from "./MonsterDefinition.js";
import { OriginArtwork }          from "./OriginArtwork.js";
import { View }                   from "./View.js";

export interface DefeatTip {
    id: string;
    text: string;
}

interface RankedDefeatTip extends DefeatTip {
    priority: number;
    order: number;
}

interface CombatInventoryEntry {
    itemName: string;
    effects: { damage: number; block: number; healing: number };
    quantity: number;
    special: boolean;
}

export function defeatTipsForInventory(
    quantities: Readonly<Record<string, number>>,
    defeatedMonsterName: string|null = null,
): DefeatTip[] {
    const sortedQuantities = Object.entries(quantities).sort(
        ([first], [second]) =>
            first < second ? -1 : first > second ? 1 : 0
    );
    const combatItems: CombatInventoryEntry[] = [];
    for (const [itemName, rawQuantity] of sortedQuantities) {
        const effects = CardGame.itemCardEffects(itemName);
        const quantity = Math.max(0, Math.floor(rawQuantity));
        if (effects !== null && quantity > 0) {
            combatItems.push({
                itemName,
                effects,
                quantity,
                special: CardGame.itemCardSpecialEffect(itemName) !== null,
            });
        }
    }
    const strongestDamage = combatItems.reduce(
        (strongest, item) => Math.max(strongest, item.effects.damage),
        0,
    );
    const blockCopies = combatItems.reduce(
        (total, item) => total
            + (item.effects.block > 0 ? item.quantity : 0),
        0,
    );
    const healingCopies = combatItems.reduce(
        (total, item) => total
            + (item.effects.healing > 0 ? item.quantity : 0),
        0,
    );
    const combatItemCopies = combatItems.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const lowTierCopies = combatItems.reduce((total, item) => {
        if (item.special) {
            return total;
        }
        const strength = Math.max(
            item.effects.damage,
            item.effects.block,
            item.effects.healing,
        );

        return total + (strength <= 4 ? item.quantity : 0);
    }, 0);
    const strongCopies = combatItems.reduce((total, item) => {
        if (item.special) {
            return total;
        }
        const strength = Math.max(
            item.effects.damage,
            item.effects.block,
            item.effects.healing,
        );

        return total + (strength >= 7 ? item.quantity : 0);
    }, 0);
    const enchantmentCount = [
        "spell of force",
        "spell of mending",
        "spell of warding",
    ].reduce((total, itemName) => total + Math.max(
        0,
        Math.floor(quantities[itemName] ?? 0),
    ), 0);
    const yarrowCount = Math.max(0, Math.floor(quantities["yarrow"] ?? 0));
    const hasOneClubAndNoOtherWeapons =
        Math.max(0, Math.floor(quantities["club"] ?? 0)) === 1
        && !combatItems.some(item =>
            item.itemName !== "club"
            && item.itemName !== "poison potion"
            && item.effects.damage > 0
            && !new ItemType(item.itemName).isMonster()
        );
    const hasCapturedMonster = Object.entries(quantities).some(
        ([itemName, quantity]) =>
            quantity > 0 && new ItemType(itemName).isMonster()
    );
    const defeatedMonsterType = defeatedMonsterName !== null
        && new ItemType(defeatedMonsterName).isMonster()
        ? defeatedMonsterName
        : null;
    const tips: RankedDefeatTip[] = [
        {
            id: "health",
            text: "Gather yarrows. Each one adds 1 to your starting health. Small flowers, big help.",
            priority: yarrowCount < 8 ? 120 : 45,
            order: 0,
        },
        {
            id: "weapons",
            text: "Craft stronger weapons to deal more damage. A stern look only goes so far.",
            priority: strongestDamage < 6 ? 115 : 55,
            order: 1,
        },
        {
            id: "shields",
            text: "Craft shields to block incoming damage.",
            priority: blockCopies === 0 ? 110 : 50,
            order: 2,
        },
        {
            id: "healing",
            text: "Craft yarrow poultices—or, better yet, brew healing potions—to restore health during fights.",
            priority: healingCopies === 0 ? 105 : 48,
            order: 3,
        },
        {
            id: "upgrades",
            text: "Upgrade your equipment. Stronger versions improve attacks, blocks, or healing.",
            priority: lowTierCopies > 0 ? 90 : 40,
            order: 4,
        },
        {
            id: "spells",
            text: "Buy permanent spells from castle magicians. They strengthen every attack, block, or healing effect.",
            priority: enchantmentCount === 0 ? 80 : 35,
            order: 5,
        },
        {
            id: "deck",
            text: "Avoid filling your deck with low-tier items. A few strong items work better than a pile of weak ones.",
            priority: lowTierCopies >= 4 && lowTierCopies > strongCopies
                ? 125
                : 60,
            order: 6,
        },
        {
            id: "bare-fist",
            text: "“Bare Fist” appears when you run out of fight items. Craft more useful equipment—your knuckles have done enough.",
            priority: combatItemCopies < 8 ? 108 : 38,
            order: 7,
        },
        {
            id: "choice",
            text: "Choose two cards carefully each round. Balance attacks, blocks, and healing.",
            priority: 30,
            order: 8,
        },
        {
            id: "retry",
            text: "The same choices always lead to the same result. After a defeat, try different cards to find a winning sequence.",
            priority: 25,
            order: 9,
        },
        {
            id: "safe",
            text: "Defeat costs you nothing. You keep every item, so you can retry freely.",
            priority: 20,
            order: 10,
        },
    ];
    if (hasOneClubAndNoOtherWeapons) {
        tips.push({
            id: "more-clubs",
            text: "Craft more clubs to add more attacks to your deck. One club only swings once per capture.",
            priority: 118,
            order: 11,
        });
    }
    if (defeatedMonsterType !== null) {
        tips.push({
            id: "find-another-monster",
            text: "If this " + defeatedMonsterType
                + " is too strong, find another " + defeatedMonsterType
                + ". The next one may be less fierce.",
            priority: hasCapturedMonster ? 15 : 123,
            order: 12,
        });
    }

    return tips
        .sort((first, second) =>
            second.priority - first.priority || first.order - second.order
        )
        .map(({ id, text }) => ({ id, text }));
}

export class FightView {
    private overlay: HTMLDivElement|null = null;
    private game: CardGame|null = null;
    private victoryApplied = false;
    private sourceElement: HTMLElement|null = null;
    private dealtRound = 0;
    private animating = false;
    private shownMonsterHealth: number|null = null;
    private shownPlayerHealth: number|null = null;
    private autoCloseTimer: number|null = null;

    private monsterName(): string {
        return EncounterText.for(
            this.itemTakingSummary.itemType.name,
            this.coordinates.latitude,
            this.coordinates.longitude,
        ).name;
    }

    constructor(
        private itemTakingSummary: ItemTakingSummary,
        private inventory: Inventory,
        private coordinates: Coordinates,
        private map: Map,
    ) {}

    open(): void {
        const monster = MonsterDefinition.get(this.itemTakingSummary.itemType.name);
        if (monster === null) {
            return;
        }
        this.sourceElement = document.querySelector<HTMLElement>(
            ".cell.selected .item.collectible",
        );
        this.map.setInteractionLocked(true);
        this.overlay = document.createElement("div");
        this.overlay.className = "fight-overlay";
        document.body.append(this.overlay);
        if ((this.inventory.totalQuantities["yarrow"] ?? 0) <= 0) {
            this.renderMissingYarrow();

            return;
        }
        this.startGame(monster);
    }

    private renderMissingYarrow(): void {
        if (this.overlay === null) {
            return;
        }
        const panel = document.createElement("section");
        panel.className = "fight-panel";
        panel.setAttribute("aria-labelledby", "fight-title");
        const closeButton = this.button("×", () => this.close());
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", "Close capture");
        const message = document.createElement("p");
        message.className = "fight-unavailable";
        message.textContent =
            "You need to find at least one yarrow plant to attempt a capture.";
        const content = document.createElement("div");
        content.className = "dialog-content";
        content.append(this.createCombatants(), message);
        panel.append(this.createPanelHeader(closeButton), content);
        this.overlay.append(panel);
    }

    private startGame(monster: MonsterDefinition): void {
        this.victoryApplied = false;
        this.dealtRound = 0;
        this.animating = false;
        this.shownMonsterHealth = null;
        this.shownPlayerHealth = null;
        if (this.autoCloseTimer !== null) {
            window.clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        const itemOrigins: Record<string, ReturnType<Inventory["getItemOrigins"]>> = {};
        for (const itemName of Object.keys(this.inventory.totalQuantities)) {
            itemOrigins[itemName] = this.inventory.getItemOrigins(itemName);
        }
        this.game = new CardGame(
            monster,
            this.inventory.totalQuantities,
            this.coordinates.getSeed(),
            itemOrigins,
            CardGame.playerHealthForYarrow(
                this.inventory.totalQuantities["yarrow"] ?? 0,
            ),
            {
                damage: this.inventory.totalQuantities[
                    "spell of force"
                ] ?? 0,
                healing: this.inventory.totalQuantities[
                    "spell of mending"
                ] ?? 0,
                block: this.inventory.totalQuantities[
                    "spell of warding"
                ] ?? 0,
            },
        );
        this.render();
    }

    private render(): void {
        if (this.overlay === null || this.game === null) {
            return;
        }
        const state = this.game.getState();
        this.overlay.innerHTML = "";
        const panel = document.createElement("section");
        panel.className = "fight-panel";
        panel.setAttribute("aria-labelledby", "fight-title");

        const closeButton = this.button("×", () => this.requestClose());
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", state.status === "playing" ? "Retreat" : "Close fight");
        panel.append(this.createPanelHeader(closeButton));

        const board = document.createElement("div");
        board.className = "fight-board";
        const monsterSeat = this.createFighterSeat(
            this.itemTakingSummary.itemType.name,
            this.monsterName(),
            "monster",
            state.monsterHealth,
            state.monsterMaxHealth,
            this.shownMonsterHealth,
            this.itemTakingSummary.itemType.name,
        );
        monsterSeat.append(this.createModifierDisplay(state, "monster"));

        const table = document.createElement("section");
        table.className = "fight-table";
        let hand: HTMLDivElement|null = null;
        const shouldDeal = state.status === "playing"
            && state.phase === "player"
            && state.round !== this.dealtRound;
        if (state.status === "playing") {
            table.append(this.createMonsterHand(state));
            const status = document.createElement("div");
            status.className = "fight-turn-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
            status.textContent = this.turnStatus(state);
            hand = this.createHand(state);
            hand.prepend(status);
            table.append(hand);
        } else {
            const center = document.createElement("div");
            center.className = "fight-board-center";
            if (state.status === "lost") {
                table.classList.add("fight-table--defeated");
                center.append(this.createDefeatAdvice());
            } else {
                const outcome = document.createElement("div");
                outcome.className = "fight-outcome fight-outcome--won";
                outcome.textContent = "Victory";
                center.append(outcome);
            }
            table.append(center);
            if (state.status === "won") {
                this.applyVictory();
            }
        }
        const playerSeat = this.createFighterSeat(
            "cat",
            "You",
            "player",
            state.playerHealth,
            state.playerMaxHealth,
            this.shownPlayerHealth,
        );
        const enchantments = this.createEnchantmentDisplay(state);
        if (enchantments !== null) {
            playerSeat.append(enchantments);
        }
        playerSeat.append(this.createModifierDisplay(state, "player"));
        this.shownMonsterHealth = state.monsterHealth;
        this.shownPlayerHealth = state.playerHealth;
        board.append(monsterSeat, table, playerSeat);
        const content = document.createElement("div");
        content.className = "dialog-content fight-dialog-content";
        content.append(this.createFightFloor(), board);
        panel.append(content);
        this.overlay.append(panel);
        if (shouldDeal && hand !== null) {
            this.dealtRound = state.round;
            Effects.dealFightCards(
                Array.from(hand.querySelectorAll<HTMLElement>(".fight-card")),
                "player",
                state.round,
            );
            Effects.dealFightCards(
                Array.from(table.querySelectorAll<HTMLElement>(
                    ".fight-monster-card-back",
                )),
                "monster",
                state.round,
            );
        }
    }

    private createPanelHeader(closeButton: HTMLButtonElement): HTMLElement {
        const header = document.createElement("header");
        header.className = "dialog-header";
        const title = document.createElement("h1");
        title.id = "fight-title";
        title.textContent = "Battle";
        header.append(title, closeButton);

        return header;
    }

    private createFightFloor(): HTMLDivElement {
        const floor = document.createElement("div");
        floor.className = "fight-floor";
        floor.setAttribute("aria-hidden", "true");
        const stones = document.createElement("div");
        stones.className = "fight-floor-stones";
        for (let index = 0; index < 96; index++) {
            const stone = document.createElement("span");
            const source = this.fightFloorSeed(index, "source") % 4;
            stone.className = "fight-floor-stone fight-floor-stone--" + source;
            stone.style.setProperty(
                "--fight-floor-x",
                (Number(this.fightFloorSeed(index, "x") % 17) - 8) + "%",
            );
            stone.style.setProperty(
                "--fight-floor-y",
                (Number(this.fightFloorSeed(index, "y") % 17) - 8) + "%",
            );
            stone.style.setProperty(
                "--fight-floor-angle",
                (this.fightFloorSeed(index, "rotation") % 360) + "deg",
            );
            stone.style.setProperty(
                "--fight-floor-scale",
                (0.9 + Number(
                    this.fightFloorSeed(index, "scale") % 19,
                ) / 100).toFixed(2),
            );
            stone.style.setProperty(
                "--fight-floor-opacity",
                (0.42 + Number(
                    this.fightFloorSeed(index, "opacity") % 19,
                ) / 100).toFixed(2),
            );
            stone.style.setProperty(
                "--fight-floor-brightness",
                (0.62 + Number(
                    this.fightFloorSeed(index, "brightness") % 19,
                ) / 100).toFixed(2),
            );
            stones.append(stone);
        }
        floor.append(stones);

        return floor;
    }

    private fightFloorSeed(index: number, stream: string): number {
        let seed = (this.coordinates.getSeed() >>> 0) ^ 0x9e3779b9;
        const key = [
            "fight-floor",
            this.itemTakingSummary.itemType.name,
            stream,
        ].join(":");
        for (let character = 0; character < key.length; character++) {
            seed = Math.imul(
                seed ^ key.charCodeAt(character),
                0x01000193,
            ) >>> 0;
        }
        seed ^= Math.imul(index + 1, 0x85ebca6b);
        seed ^= seed >>> 16;
        seed = Math.imul(seed, 0x7feb352d) >>> 0;
        seed ^= seed >>> 15;
        seed = Math.imul(seed, 0x846ca68b) >>> 0;
        seed ^= seed >>> 16;

        return seed >>> 0;
    }

    private createHand(state: CardGameState): HTMLDivElement {
        const hand = document.createElement("div");
        hand.className = "fight-hand";
        state.hand.forEach(card => {
            const cardButton = this.button("", () => {
                void this.playPlayerCard(card.id, cardButton);
            });
            cardButton.classList.add("fight-card");
            cardButton.dataset.cardId = card.id;
            cardButton.disabled = this.animating || state.phase !== "player";
            cardButton.title = card.title;
            cardButton.append(Effects.createCardArtwork(card));
            const name = document.createElement("strong");
            name.className = "fight-card-name";
            name.textContent = card.title;
            name.title = card.title;
            cardButton.append(name, Effects.createCardEffectIcons(card));
            hand.append(cardButton);
        });

        return hand;
    }

    private createMonsterHand(state: CardGameState): HTMLDivElement {
        const area = document.createElement("div");
        area.className = "fight-monster-hand";
        const cards = document.createElement("div");
        cards.className = "fight-monster-cards";
        for (let index = 0; index < state.monsterHandSize; index++) {
            const back = document.createElement("div");
            back.className = "fight-monster-card-back";
            back.setAttribute("aria-label", "Hidden monster item");
            cards.append(back);
        }
        area.append(cards);

        return area;
    }

    private createIdentity(
        itemName: string,
        label: string,
        secondaryLabel?: string,
    ): HTMLDivElement {
        const origin = {
            latitude: this.coordinates.latitude,
            longitude: this.coordinates.longitude,
            areaId: this.inventory.getAreaId(),
        };
        const identity = document.createElement("div");
        identity.className = "fight-identity";
        const name = document.createElement("strong");
        name.textContent = label;
        const copy = document.createElement("div");
        copy.className = "fight-fighter-copy";
        copy.append(name);
        if (secondaryLabel !== undefined) {
            const type = document.createElement("span");
            type.className = "fight-fighter-type";
            type.textContent = secondaryLabel;
            copy.append(type);
        }
        const portrait = OriginArtwork.create(
            itemName,
            origin,
            "fight-portrait-art",
        );
        identity.append(portrait, copy);

        return identity;
    }

    private createFighterSeat(
        itemName: string,
        label: string,
        owner: "player"|"monster",
        health: number,
        maximum: number,
        previousHealth: number|null,
        secondaryLabel?: string,
    ): HTMLElement {
        const seat = document.createElement("section");
        seat.className = "fight-seat fight-seat--" + owner;
        const chair = document.createElement("img");
        chair.className = "fight-chair fight-chair--" + owner;
        chair.src = "images/fight-chair-monster-topdown-photoreal-v1.png";
        chair.alt = "";
        chair.setAttribute("aria-hidden", "true");
        seat.append(
            chair,
            this.createFighterDisplay(
                itemName,
                label,
                owner,
                health,
                maximum,
                previousHealth,
                secondaryLabel,
            ),
        );

        return seat;
    }

    private createFighterDisplay(
        itemName: string,
        label: string,
        owner: "player"|"monster",
        health: number,
        maximum: number,
        previousHealth: number|null,
        secondaryLabel?: string,
    ): HTMLDivElement {
        const display = document.createElement("div");
        display.className = "fight-fighter fight-fighter--" + owner;
        display.append(
            this.createIdentity(itemName, label, secondaryLabel),
            this.createHealthDisplay(
                owner,
                health,
                maximum,
                previousHealth,
            ),
        );

        return display;
    }

    private createHealthDisplay(
        owner: "player"|"monster",
        health: number,
        maximum: number,
        previousHealth: number|null,
    ): HTMLDivElement {
        const display = document.createElement("div");
        display.className = "fight-health-display fight-" + owner + "-health";
        const bar = document.createElement("div");
        bar.className = "fight-health-bar";
        bar.setAttribute("aria-hidden", "true");
        const fill = document.createElement("div");
        fill.className = "fight-health-fill";
        const percentage = maximum > 0 ? 100 * health / maximum : 0;
        const previousPercentage = previousHealth === null || maximum <= 0
            ? percentage
            : 100 * previousHealth / maximum;
        bar.style.setProperty("--health-fill", previousPercentage + "%");
        window.requestAnimationFrame(() => {
            bar.style.setProperty("--health-fill", percentage + "%");
        });
        bar.append(fill);

        const details = document.createElement("div");
        details.className = "fight-health-details";
        const healthIcon = document.createElement("span");
        healthIcon.className = "fight-health-icon";
        healthIcon.textContent = "♥";
        healthIcon.setAttribute("aria-hidden", "true");
        const value = document.createElement("span");
        value.className = "fight-health-value";
        value.textContent = health + "/" + maximum;
        value.setAttribute("aria-label", health + " health remaining");
        details.append(healthIcon, value);
        display.append(bar, details);

        return display;
    }

    private createEnchantmentDisplay(
        state: CardGameState,
    ): HTMLElement|null {
        const definitions = [
            {
                key: "damage" as const,
                icon: "⚔",
                label: "attack",
            },
            {
                key: "healing" as const,
                icon: "♥",
                label: "healing",
            },
            {
                key: "block" as const,
                icon: "◆",
                label: "block",
            },
        ];
        const active = definitions.filter(
            definition => state.playerEnchantments[definition.key] > 0,
        );
        if (active.length === 0) {
            return null;
        }
        const display = document.createElement("aside");
        display.className = "fight-enchantments";
        display.setAttribute("aria-label", "Permanent spell bonuses");
        for (const definition of active) {
            const value = state.playerEnchantments[definition.key];
            const badge = document.createElement("span");
            badge.className = "fight-enchantment fight-enchantment--"
                + definition.key;
            badge.title = "+" + value + " " + definition.label
                + " from permanent spells";
            badge.setAttribute("aria-label", badge.title);
            const icon = document.createElement("span");
            icon.className = "fight-enchantment-icon";
            icon.textContent = definition.icon;
            icon.setAttribute("aria-hidden", "true");
            const amount = document.createElement("strong");
            amount.textContent = "+" + value;
            badge.append(icon, amount);
            display.append(badge);
        }

        return display;
    }

    private createModifierDisplay(
        state: CardGameState,
        owner: "player"|"monster",
    ): HTMLElement {
        const display = document.createElement("aside");
        display.className = "fight-modifiers fight-modifiers--" + owner;
        display.setAttribute(
            "aria-label",
            owner === "player" ? "Your battle spells" : "Opponent battle spells",
        );
        const modifiers = state.modifiers;
        const active = owner === "monster"
            ? [
                modifiers.monsterFrozenRound === state.round
                    ? { icon: "❄", text: "Frozen this round" } : null,
                modifiers.monsterActionsPerRound === 1
                    ? { icon: "⌛", text: "One action per round" } : null,
                modifiers.monsterBlockDivisor > 1
                    ? {
                        icon: "◈",
                        text: "Block divided by "
                            + modifiers.monsterBlockDivisor,
                    } : null,
                modifiers.monsterHealingPoisoned
                    ? { icon: "☠", text: "Healing becomes poison" } : null,
                modifiers.monsterDamageDivisor > 1
                    ? {
                        icon: "↘",
                        text: "Attack divided by "
                            + modifiers.monsterDamageDivisor,
                    } : null,
                modifiers.monsterVulnerability > 0
                    ? {
                        icon: "✥",
                        text: "+" + modifiers.monsterVulnerability
                            + " damage from attacks",
                    } : null,
            ]
            : [
                modifiers.playerKeepsBlock
                    ? { icon: "⬟", text: "Block carries between rounds" } : null,
                modifiers.playerLifeStealPercent > 0
                    ? {
                        icon: "♥",
                        text: modifiers.playerLifeStealPercent
                            + "% life-steal",
                    } : null,
                modifiers.playerEchoCharges > 0
                    ? {
                        icon: "Ⅱ",
                        text: modifiers.playerEchoCharges
                            + (modifiers.playerEchoCharges === 1
                                ? " echo ready"
                                : " echoes ready"),
                    } : null,
            ];
        for (const modifier of active) {
            if (modifier === null) {
                continue;
            }
            const badge = document.createElement("span");
            badge.className = "fight-modifier";
            badge.textContent = modifier.icon;
            badge.title = modifier.text;
            badge.setAttribute("aria-label", modifier.text);
            display.append(badge);
        }

        return display;
    }

    private createCombatants(): HTMLDivElement {
        const origin = {
            latitude: this.coordinates.latitude,
            longitude: this.coordinates.longitude,
            areaId: this.inventory.getAreaId(),
        };
        const row = document.createElement("div");
        row.className = "fight-combatants";
        row.append(
            this.createPortrait(
                this.itemTakingSummary.itemType.name,
                this.monsterName(),
                origin,
            ),
            this.createPortrait("cat", "You", origin),
        );

        return row;
    }

    private createPortrait(
        itemName: string,
        label: string,
        origin: { latitude: number; longitude: number; areaId: number },
    ): HTMLDivElement {
        const portrait = OriginArtwork.create(itemName, origin, "fight-portrait-art");
        const wrapper = document.createElement("div");
        wrapper.className = "fight-portrait";
        const caption = document.createElement("strong");
        caption.textContent = label;
        wrapper.append(portrait, caption);

        return wrapper;
    }

    private async playPlayerCard(
        cardId: string,
        cardElement: HTMLElement,
    ): Promise<void> {
        if (this.animating || this.game === null || this.overlay === null) {
            return;
        }
        const allCardElements = Array.from(
            this.overlay.querySelectorAll<HTMLElement>(".fight-card"),
        );
        this.animating = true;
        allCardElements.forEach(card => {
            if (card instanceof HTMLButtonElement) {
                card.disabled = true;
            }
        });
        const playerResolution = this.game.playPlayerCard(cardId);
        if (playerResolution === null) {
            this.animating = false;

            return;
        }
        await this.playCardEffects(playerResolution, cardElement);
        if (playerResolution.monsterDefeated) {
            this.finishFight();

            return;
        }

        if (playerResolution.card.block === 0) {
            Effects.showSpentFightCard(cardElement);
        }
        this.syncFightState();
        if (this.overlay === null) {
            this.animating = false;

            return;
        }
        let monsterCard = this.chooseMonsterCardElement(
            this.game.getState(),
        );
        const monsterResolution = this.game.playMonsterCard();
        if (monsterResolution === null) {
            this.animating = false;
            this.render();

            return;
        }
        if (["frozen turn", "slowed turn"].includes(
            monsterResolution.card.itemName,
        )) {
            monsterCard = null;
        }
        await this.playCardEffects(monsterResolution, monsterCard);
        if (monsterResolution.monsterDefeated) {
            this.finishFight();

            return;
        }
        if (monsterResolution.playerDefeated) {
            this.finishFight();

            return;
        }

        if (monsterResolution.card.block === 0) {
            if (monsterCard !== null) {
                Effects.showSpentFightCard(monsterCard);
            }
        }
        this.syncFightState();
        if (monsterResolution.roundComplete) {
            void this.sweepBoardCards();
            await new Promise<void>(resolve => {
                window.setTimeout(resolve, 260);
            });
            if (this.overlay === null || this.game === null) {
                this.animating = false;

                return;
            }
            this.game.dealNextRound();
            this.render();
            this.animating = false;
            this.syncFightState();

            return;
        }
        this.animating = false;
        this.syncFightState();
    }

    private async playCardEffects(
        resolution: CardPlayResolution,
        cardElement: HTMLElement|null,
    ): Promise<void> {
        await Effects.playFightCard(
            resolution,
            cardElement,
            this.overlay?.querySelector<HTMLElement>(
                ".fight-fighter--monster .fight-portrait-art",
            ) ?? null,
            this.overlay?.querySelector<HTMLElement>(
                ".fight-fighter--player .fight-portrait-art",
            ) ?? null,
            this.overlay?.querySelector<HTMLElement>(
                ".fight-monster-health .fight-health-icon",
            ) ?? null,
            this.overlay?.querySelector<HTMLElement>(
                ".fight-player-health .fight-health-icon",
            ) ?? null,
            this.overlay,
            this.overlay,
            this.monsterName(),
        );
    }

    private chooseMonsterCardElement(
        state: CardGameState,
    ): HTMLElement|null {
        if (this.overlay === null) {
            return null;
        }
        const cards = Array.from(this.overlay.querySelectorAll<HTMLElement>(
            ".fight-monster-card-back"
                + ":not(.fight-card--empty)"
                + ":not(.fight-card--spent)"
                + ":not(.fight-card--blocking)",
        ));
        if (cards.length === 0) {
            return null;
        }

        const seedText = [
            "monster-card-position",
            this.itemTakingSummary.itemType.name,
            this.coordinates.latitude,
            this.coordinates.longitude,
            state.round,
            state.monsterPlayedCount,
        ].join(":");
        let hash = 2_166_136_261;
        for (let index = 0; index < seedText.length; index++) {
            hash = Math.imul(hash ^ seedText.charCodeAt(index), 16_777_619);
        }
        hash ^= hash >>> 16;

        return cards[(hash >>> 0) % cards.length] ?? null;
    }

    private syncFightState(): void {
        if (this.overlay === null || this.game === null) {
            return;
        }
        const state = this.game.getState();
        const monsterHealth = this.overlay.querySelector<HTMLElement>(
            ".fight-monster-health",
        );
        const playerHealth = this.overlay.querySelector<HTMLElement>(
            ".fight-player-health",
        );
        if (monsterHealth !== null) {
            const value = monsterHealth.querySelector<HTMLElement>(
                ".fight-health-value",
            );
            if (value !== null) {
                value.textContent = state.monsterHealth + "/"
                    + state.monsterMaxHealth;
                value.setAttribute(
                    "aria-label",
                    state.monsterHealth + " health remaining",
                );
            }
        }
        if (playerHealth !== null) {
            const value = playerHealth.querySelector<HTMLElement>(
                ".fight-health-value",
            );
            if (value !== null) {
                value.textContent = state.playerHealth + "/"
                    + state.playerMaxHealth;
                value.setAttribute(
                    "aria-label",
                    state.playerHealth + " health remaining",
                );
            }
        }
        this.updateHealthMeter(
            "monster",
            state.monsterHealth,
            state.monsterMaxHealth,
        );
        this.updateHealthMeter(
            "player",
            state.playerHealth,
            state.playerMaxHealth,
        );
        this.syncShieldCards("monster", state.monsterShields);
        this.syncShieldCards("player", state.playerShields);
        const status = this.overlay.querySelector<HTMLElement>(".fight-turn-status");
        if (status !== null) {
            status.textContent = this.turnStatus(state);
        }
        for (const owner of ["monster", "player"] as const) {
            const display = this.overlay.querySelector<HTMLElement>(
                ".fight-modifiers--" + owner,
            );
            if (display !== null) {
                display.replaceWith(this.createModifierDisplay(state, owner));
            }
        }
        this.overlay.querySelectorAll<HTMLButtonElement>(
            ".fight-card:not(.fight-card--blocking):not(.fight-card--spent)",
        ).forEach(card => {
            card.disabled = this.animating || state.phase !== "player";
        });
    }

    private syncShieldCards(
        owner: "player"|"monster",
        shields: CardGameState["playerShields"],
    ): void {
        const selector = owner === "monster"
            ? ".fight-monster-card.fight-card--blocking"
            : ".fight-hand .fight-card.fight-card--blocking";
        this.overlay?.querySelectorAll<HTMLElement>(selector).forEach(card => {
            const id = card.dataset.shieldId;
            const shield = shields.find(candidate => candidate.id === id);
            if (shield === undefined) {
                card.classList.remove("fight-card--blocking");
                Effects.showSpentFightCard(card);

                return;
            }
            const value = card.querySelector<HTMLElement>(
                ".fight-effect--block",
            );
            if (value !== null) {
                value.textContent = String(shield.remainingBlock);
            }
        });
    }

    private finishFight(): void {
        if (this.overlay === null || this.game === null) {
            this.animating = false;

            return;
        }
        const sweep = this.sweepBoardCards();
        this.animating = false;
        this.syncFightState();
        const state = this.game.getState();
        const status = this.overlay.querySelector<HTMLElement>(".fight-turn-status");
        status?.remove();
        const closeButton = this.overlay.querySelector<HTMLElement>(".fight-close");
        closeButton?.setAttribute("aria-label", "Close capture");
        if (state.status === "won") {
            this.applyVictory();
        } else {
            View.setMessage(
                this.map.messageBox,
                "Defeated. Gather yarrows or stronger gear, then retry.",
            );
            void sweep.then(() => this.showDefeatAdvice());
        }
        const board = this.overlay.querySelector<HTMLElement>(".fight-board");
        if (board !== null) {
            Effects.showFightOutcome(
                board,
                state.status === "won" ? "Victory" : "Defeated",
            );
        }
        if (state.status === "won") {
            this.autoCloseTimer = window.setTimeout(() => {
                this.autoCloseTimer = null;
                this.close();
            }, 3_000);
        }
    }

    private showDefeatAdvice(): void {
        if (
            this.overlay === null
            || this.game?.getState().status !== "lost"
        ) {
            return;
        }
        const table = this.overlay.querySelector<HTMLElement>(".fight-table");
        if (table === null) {
            return;
        }
        const tableHeight = table.getBoundingClientRect().height;
        if (tableHeight > 0) {
            table.style.height = tableHeight + "px";
        }
        table.classList.add("fight-table--defeated");
        const center = document.createElement("div");
        center.className = "fight-board-center";
        center.append(this.createDefeatAdvice());
        table.replaceChildren(center);
    }

    private createDefeatAdvice(): HTMLElement {
        const section = document.createElement("section");
        section.className = "fight-defeat-advice";
        section.setAttribute("aria-labelledby", "fight-defeat-advice-title");
        const title = document.createElement("h2");
        title.id = "fight-defeat-advice-title";
        title.textContent = "Prepare, then try again";
        const list = document.createElement("ol");
        list.id = "fight-defeat-tip-list";
        list.className = "fight-defeat-tip-list";
        const tips = defeatTipsForInventory(
            this.inventory.totalQuantities,
            this.itemTakingSummary.itemType.name,
        );
        tips.forEach((tip, index) => {
            const item = document.createElement("li");
            item.className = "fight-defeat-tip";
            item.dataset.tip = tip.id;
            item.textContent = tip.text;
            item.hidden = index >= 3;
            list.append(item);
        });
        section.append(title, list);
        if (tips.length > 3) {
            const showAll = this.button("Show all tips", () => {
                list.querySelectorAll<HTMLElement>(".fight-defeat-tip").forEach(
                    item => {
                        item.hidden = false;
                    },
                );
                showAll.remove();
            });
            showAll.className = "fight-defeat-more";
            showAll.setAttribute("aria-controls", list.id);
            showAll.setAttribute("aria-expanded", "false");
            section.append(showAll);
        }

        return section;
    }

    private async sweepBoardCards(): Promise<void> {
        if (this.overlay === null) {
            return;
        }
        const cards = Array.from(this.overlay.querySelectorAll<HTMLElement>(
            ".fight-card:not(.fight-card--empty), "
                + ".fight-monster-card-back:not(.fight-card--empty)",
        ));
        const sweep = Effects.sweepFightCards(cards);
        cards.forEach(card => card.classList.add("fight-card--empty"));
        await sweep;
    }

    private updateHealthMeter(
        owner: "player"|"monster",
        health: number,
        maximum: number,
    ): void {
        const meter = this.overlay?.querySelector<HTMLElement>(
            ".fight-" + owner + "-health .fight-health-bar",
        );
        if (meter === null || meter === undefined) {
            return;
        }
        meter.style.setProperty(
            "--health-fill",
            (maximum > 0 ? 100 * health / maximum : 0) + "%",
        );
    }

    private applyVictory(): void {
        if (this.victoryApplied) {
            return;
        }
        this.victoryApplied = true;
        const currentSummary = new ItemTaking(
            this.itemTakingSummary.itemType,
            this.inventory,
        ).summary();
        if (currentSummary.isUnavailable()) {
            return;
        }
        const result = this.inventory.takeItem(this.coordinates);
        if (result !== null) {
            Effects.playItemAction(
                result,
                this.sourceElement,
                this.coordinates.getSeed(),
            );
            this.map.show({});
        }
    }

    private close(): void {
        if (this.autoCloseTimer !== null) {
            window.clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        this.overlay?.remove();
        this.overlay = null;
        this.map.setInteractionLocked(false);
    }

    private requestClose(): void {
        const state = this.game?.getState();
        const cardsHaveBeenPlayed = state !== undefined
            && (
                state.round > 1
                || state.playerPlayedCount > 0
                || state.monsterPlayedCount > 0
            );
        if (state?.status === "playing"
            && cardsHaveBeenPlayed
            && !window.confirm(
                "Retreat from this capture attempt? Your inventory will not change.",
            )
        ) {
            return;
        }

        this.close();
    }

    private button(text: string, action: () => void): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.onclick = action;

        return button;
    }

    private turnStatus(state: CardGameState): string {
        if (state.status === "won") {
            return "Victory";
        }
        if (state.status === "lost") {
            return "Defeated";
        }
        return "Choose 2";
    }

}
