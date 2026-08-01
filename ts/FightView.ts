import { CardGame }                from "./CardGame.js";
import type { CardGameState, TurnResolution } from "./CardGame.js";
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
    private dealtTurn = 0;
    private shownMonsterHealth: number|null = null;
    private shownPlayerHealth: number|null = null;

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
        this.startGame(monster);
    }

    private startGame(monster: MonsterDefinition): void {
        this.victoryApplied = false;
        this.dealtTurn = 0;
        this.shownMonsterHealth = null;
        this.shownPlayerHealth = null;
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

        const closeButton = this.button("×", () => this.requestClose(state));
        closeButton.className = "fight-close";
        closeButton.setAttribute("aria-label", state.status === "playing" ? "Retreat" : "Close fight");
        panel.append(closeButton);

        const title = document.createElement("h1");
        title.textContent = "Battle";
        panel.append(title);
        panel.append(this.createCombatants());
        panel.append(this.healthStatLine(
            this.capitalize(this.itemTakingSummary.itemType.name)
                + " " + state.monsterHealth + " / " + state.monsterMaxHealth,
            "Next: " + this.describeMonsterIntent(state.monsterIntent),
            "fight-monster-health",
            "monster",
            state.monsterHealth,
            state.monsterMaxHealth,
            this.shownMonsterHealth,
        ));
        panel.append(this.healthStatLine(
            "You " + state.playerHealth + " / " + state.playerMaxHealth,
            "Chosen " + state.selectedCardIds.length + " / 3",
            "fight-player-health",
            "player",
            state.playerHealth,
            state.playerMaxHealth,
            this.shownPlayerHealth,
        ));
        this.shownMonsterHealth = state.monsterHealth;
        this.shownPlayerHealth = state.playerHealth;

        let hand: HTMLDivElement|null = null;
        const shouldDeal = state.status === "playing" && state.turn !== this.dealtTurn;
        if (state.status === "playing") {
            hand = this.createHand(state);
            panel.append(hand);
        } else {
            const outcome = document.createElement("div");
            outcome.className = "fight-outcome fight-outcome--" + state.status;
            outcome.textContent = state.status === "won" ? "Victory" : "Defeated";
            panel.append(outcome);
            if (state.status === "won") {
                this.applyVictory();
            } else {
                const monster = MonsterDefinition.get(this.itemTakingSummary.itemType.name);
                if (monster !== null) {
                    panel.append(this.button("Try again", () => this.startGame(monster)));
                }
            }
        }

        this.overlay.append(panel);
        if (shouldDeal && hand !== null) {
            this.dealtTurn = state.turn;
            const deck = hand.querySelector<HTMLElement>(".fight-deck");
            if (deck !== null) {
                Effects.dealFightCards(
                    deck,
                    Array.from(hand.querySelectorAll<HTMLElement>(".fight-card")),
                );
            }
        }
    }

    private createHand(state: CardGameState): HTMLDivElement {
        const hand = document.createElement("div");
        hand.className = "fight-hand";
        const deck = document.createElement("div");
        deck.className = "fight-deck";
        deck.setAttribute("aria-hidden", "true");
        hand.append(deck);
        state.hand.forEach(card => {
            const details = [];
            if (card.damage > 0) details.push(card.damage + " damage");
            if (card.block > 0) details.push(card.block + " block");
            if (card.healing > 0) details.push(card.healing + " heal");
            const cardButton = this.button("", () => {
                    const selection = this.game?.toggleCard(card.id);
                    if (selection?.turnResolution !== null
                        && selection?.turnResolution !== undefined
                    ) {
                        this.playTurnEffects(selection.turnResolution);
                    }
                    this.render();
            });
            cardButton.classList.add("fight-card");
            cardButton.dataset.cardId = card.id;
            if (state.selectedCardIds.includes(card.id)) {
                cardButton.classList.add("fight-card--selected");
            }
            if (card.origin !== null) {
                cardButton.append(OriginArtwork.create(card.itemName, card.origin, "fight-card-art"));
            }
            const name = document.createElement("strong");
            name.textContent = card.title;
            const effect = document.createElement("span");
            effect.textContent = details.join(" · ");
            cardButton.append(name, effect);
            hand.append(cardButton);
        });

        return hand;
    }

    private createCombatants(): HTMLDivElement {
        const origin = {
            latitude: this.coordinates.latitude,
            longitude: this.coordinates.longitude,
            depth: this.inventory.getDepth(),
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
        origin: { latitude: number; longitude: number; depth: number },
    ): HTMLDivElement {
        const portrait = OriginArtwork.create(itemName, origin, "fight-portrait-art");
        const wrapper = document.createElement("div");
        wrapper.className = "fight-portrait";
        const caption = document.createElement("strong");
        caption.textContent = label;
        wrapper.append(portrait, caption);

        return wrapper;
    }

    private playTurnEffects(resolution: TurnResolution): void {
        const allCardElements = this.overlay === null
            ? []
            : Array.from(this.overlay.querySelectorAll<HTMLElement>(".fight-card"));
        const cardElements = resolution.cards.map(card => {
            return allCardElements.find(element => element.dataset.cardId === card.id) ?? null;
        });
        Effects.playFightTurn(
            resolution,
            cardElements,
            this.overlay?.querySelector<HTMLElement>(".fight-monster-health") ?? null,
            this.overlay?.querySelector<HTMLElement>(".fight-player-health") ?? null,
        );
        if (resolution.monsterDefeated || resolution.playerDefeated) {
            Effects.sweepFightCards(allCardElements);
        }
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
            Effects.playItemAction(result, this.sourceElement);
            this.map.show({});
        }
    }

    private close(): void {
        this.overlay?.remove();
        this.overlay = null;
        this.map.setInteractionLocked(false);
    }

    private requestClose(state: CardGameState): void {
        if (state.status === "playing"
            && !window.confirm("Retreat from this fight? Your inventory will not change.")
        ) {
            return;
        }

        this.close();
    }

    private statLine(leftText: string, rightText: string, leftClass: string): HTMLDivElement {
        const line = document.createElement("div");
        line.className = "fight-stats";
        const left = document.createElement("span");
        left.textContent = leftText;
        left.className = leftClass;
        const right = document.createElement("span");
        right.textContent = rightText;
        line.append(left, right);

        return line;
    }

    private healthStatLine(
        leftText: string,
        rightText: string,
        leftClass: string,
        owner: "monster"|"player",
        health: number,
        maximum: number,
        previousHealth: number|null,
    ): HTMLDivElement {
        const line = this.statLine(leftText, rightText, leftClass);
        line.classList.add("fight-health-meter", "fight-health-meter--" + owner);
        const percentage = maximum > 0 ? 100 * health / maximum : 0;
        const previousPercentage = previousHealth === null || maximum <= 0
            ? percentage
            : 100 * previousHealth / maximum;
        line.style.setProperty("--health-fill", previousPercentage + "%");
        window.requestAnimationFrame(() => {
            line.style.setProperty("--health-fill", percentage + "%");
        });

        return line;
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

    private describeMonsterIntent(intent: CardGameState["monsterIntent"]): string {
        const actions: string[] = [];
        if (intent.damage > 0) actions.push(intent.damage + " damage");
        if (intent.block > 0) actions.push(intent.block + " block");
        if (intent.healing > 0) actions.push(intent.healing + " heal");

        return actions.length === 0 ? "Wait" : actions.join(" · ");
    }
}
