import { CardGame }                from "./CardGame.js";
import type {
    CardGameState,
    CardPlayResolution,
} from "./CardGame.js";
import { Coordinates }            from "./Coordinates.js";
import { Effects }                from "./Effects.js";
import { Inventory }              from "./Inventory.js";
import { ItemTaking }             from "./ItemTaking.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { Map }               from "./Map.js";
import { MonsterDefinition }      from "./MonsterDefinition.js";
import { OriginArtwork }          from "./OriginArtwork.js";

export class FightView {
    private overlay: HTMLDivElement|null = null;
    private game: CardGame|null = null;
    private victoryApplied = false;
    private sourceElement: HTMLElement|null = null;
    private dealtRound = 0;
    private shownExchange = "";
    private animating = false;
    private shownMonsterHealth: number|null = null;
    private shownPlayerHealth: number|null = null;
    private autoCloseTimer: number|null = null;

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
        const closeButton = this.button("×", () => this.close());
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", "Close fight");
        const title = document.createElement("h1");
        title.textContent = "Battle";
        const message = document.createElement("p");
        message.className = "fight-unavailable";
        message.textContent = "You need to find at least one yarrow plant to fight.";
        panel.append(closeButton, title, this.createCombatants(), message);
        this.overlay.append(panel);
    }

    private startGame(monster: MonsterDefinition): void {
        this.victoryApplied = false;
        this.dealtRound = 0;
        this.shownExchange = "";
        this.animating = false;
        this.shownMonsterHealth = null;
        this.shownPlayerHealth = null;
        if (this.autoCloseTimer !== null) {
            window.clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        const requiredNames = this.itemTakingSummary.expenses.map(
            expense => expense.itemType.name,
        );
        const itemOrigins: Record<string, ReturnType<Inventory["getItemOrigins"]>> = {};
        for (const itemName of Object.keys(this.inventory.totalQuantities)) {
            itemOrigins[itemName] = this.inventory.getItemOrigins(itemName);
        }
        this.game = new CardGame(
            monster,
            this.inventory.totalQuantities,
            this.coordinates.getSeed(),
            requiredNames,
            itemOrigins,
            this.inventory.totalQuantities["yarrow"] ?? 0,
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

        const closeButton = this.button("×", () => this.requestClose());
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", state.status === "playing" ? "Retreat" : "Close fight");
        panel.append(closeButton);

        const board = document.createElement("div");
        board.className = "fight-board";
        const monsterSide = document.createElement("section");
        monsterSide.className = "fight-side fight-side--monster";
        const monsterDeck = this.createFightDeck("monster");
        monsterSide.append(monsterDeck);
        monsterSide.append(this.createFighterDisplay(
            this.itemTakingSummary.itemType.name,
            this.capitalize(this.itemTakingSummary.itemType.name),
            "above",
            "monster",
            state.monsterHealth,
            state.monsterMaxHealth,
            this.shownMonsterHealth,
        ));
        if (state.status === "playing") {
            monsterSide.append(this.createMonsterHand(state));
        }

        const center = document.createElement("div");
        center.className = "fight-board-center";
        const playerSide = document.createElement("section");
        playerSide.className = "fight-side fight-side--player";
        const playerDeck = this.createFightDeck("player");
        playerSide.append(playerDeck);
        let hand: HTMLDivElement|null = null;
        const shouldDeal = state.status === "playing"
            && state.phase === "player"
            && state.round !== this.dealtRound;
        if (state.status === "playing") {
            const status = document.createElement("div");
            status.className = "fight-turn-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
            status.textContent = this.turnStatus(state);
            center.append(status);
            hand = this.createHand(state);
            playerSide.append(hand);
        } else {
            const outcome = document.createElement("div");
            outcome.className = "fight-outcome fight-outcome--" + state.status;
            outcome.textContent = state.status === "won" ? "Victory" : "Defeated";
            center.append(outcome);
            if (state.status === "won") {
                this.applyVictory();
            }
        }
        playerSide.append(this.createFighterDisplay(
            "cat",
            "You",
            "below",
            "player",
            state.playerHealth,
            state.playerMaxHealth,
            this.shownPlayerHealth,
        ));
        this.shownMonsterHealth = state.monsterHealth;
        this.shownPlayerHealth = state.playerHealth;
        board.append(monsterSide, center, playerSide);
        panel.append(board);
        this.overlay.append(panel);
        this.showRoundEffect(state, board);
        if (shouldDeal && hand !== null) {
            this.dealtRound = state.round;
            Effects.dealFightCards(
                playerDeck,
                Array.from(hand.querySelectorAll<HTMLElement>(".fight-card")),
            );
            Effects.dealFightCards(
                monsterDeck,
                Array.from(monsterSide.querySelectorAll<HTMLElement>(
                    ".fight-monster-card-back",
                )),
            );
        }
    }

    private createFightDeck(owner: "player"|"monster"): HTMLDivElement {
        const deck = document.createElement("div");
        deck.className = "fight-deck fight-deck--" + owner;
        deck.setAttribute("aria-hidden", "true");

        return deck;
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
            cardButton.append(Effects.createCardArtwork(card));
            const name = document.createElement("strong");
            name.textContent = card.title;
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
            back.setAttribute("aria-label", "Hidden monster card");
            cards.append(back);
        }
        area.append(cards);

        return area;
    }

    private createIdentity(
        itemName: string,
        label: string,
        labelPosition: "above"|"below",
    ): HTMLDivElement {
        const origin = {
            latitude: this.coordinates.latitude,
            longitude: this.coordinates.longitude,
            areaId: this.inventory.getAreaId(),
        };
        const identity = document.createElement("div");
        identity.className = "fight-identity fight-identity--" + labelPosition;
        const name = document.createElement("strong");
        name.textContent = label;
        const portrait = OriginArtwork.create(
            itemName,
            origin,
            "fight-portrait-art",
        );
        if (labelPosition === "above") {
            identity.append(name, portrait);
        } else {
            identity.append(portrait, name);
        }

        return identity;
    }

    private createFighterDisplay(
        itemName: string,
        label: string,
        labelPosition: "above"|"below",
        owner: "player"|"monster",
        health: number,
        maximum: number,
        previousHealth: number|null,
    ): HTMLDivElement {
        const display = document.createElement("div");
        display.className = "fight-fighter fight-fighter--" + owner;
        display.append(
            this.createIdentity(itemName, label, labelPosition),
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
        value.textContent = String(health);
        value.setAttribute("aria-label", health + " health remaining");
        details.append(healthIcon, value);
        display.append(bar, details);

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
                this.capitalize(this.itemTakingSummary.itemType.name),
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
        const monsterCard = this.chooseMonsterCardElement(
            this.game.getState(),
        );
        const monsterResolution = this.game.playMonsterCard();
        if (monsterResolution === null) {
            this.animating = false;
            this.render();

            return;
        }
        await this.playCardEffects(monsterResolution, monsterCard);
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
            await this.sweepBoardCards();
            this.game.dealNextRound();
            this.animating = false;
            this.render();

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
            this.itemTakingSummary.itemType.name,
        );
    }

    private chooseMonsterCardElement(
        state: CardGameState,
    ): HTMLElement|null {
        if (this.overlay === null) {
            return null;
        }
        const cards = Array.from(this.overlay.querySelectorAll<HTMLElement>(
            ".fight-monster-card-back:not(.fight-card--empty)",
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
                value.textContent = String(state.monsterHealth);
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
                value.textContent = String(state.playerHealth);
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
        const status = this.overlay.querySelector<HTMLElement>(".fight-turn-status");
        if (status !== null) {
            status.textContent = this.turnStatus(state);
        }
        this.overlay.querySelectorAll<HTMLButtonElement>(
            ".fight-card:not(.fight-card--blocking):not(.fight-card--spent)",
        ).forEach(card => {
            card.disabled = this.animating || state.phase !== "player";
        });
        const board = this.overlay.querySelector<HTMLElement>(".fight-board");
        if (board !== null) {
            this.showRoundEffect(state, board);
        }
    }

    private finishFight(): void {
        if (this.overlay === null || this.game === null) {
            this.animating = false;

            return;
        }
        void this.sweepBoardCards();
        this.animating = false;
        this.syncFightState();
        const state = this.game.getState();
        const status = this.overlay.querySelector<HTMLElement>(".fight-turn-status");
        if (status !== null) {
            status.className = "fight-outcome fight-outcome--" + state.status;
            status.textContent = "";
        }
        const closeButton = this.overlay.querySelector<HTMLElement>(".fight-close");
        closeButton?.setAttribute("aria-label", "Close fight");
        if (state.status === "won") {
            this.applyVictory();
        }
        const board = this.overlay.querySelector<HTMLElement>(".fight-board");
        if (board !== null) {
            Effects.showFightOutcome(
                board,
                state.status === "won" ? "Victory" : "Defeated",
            );
        }
        this.autoCloseTimer = window.setTimeout(() => {
            this.autoCloseTimer = null;
            this.close();
        }, 3_000);
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
        if (currentSummary.missing.length > 0) {
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
            && !window.confirm("Retreat from this fight? Your inventory will not change.")
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

    private capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    private turnStatus(state: CardGameState): string {
        if (state.status === "won") {
            return "Victory";
        }
        if (state.status === "lost") {
            return "Defeated";
        }
        return "";
    }

    private showRoundEffect(state: CardGameState, board: HTMLElement): void {
        if (state.status !== "playing" || state.phase !== "player") {
            return;
        }
        const exchange = state.playerPlayedCount + 1;
        const key = state.round + ":" + exchange;
        if (this.shownExchange === key) {
            return;
        }
        this.shownExchange = key;
        Effects.showFightRound(board, 4 - exchange);
    }
}
