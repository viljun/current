import { CardGame }                from "./CardGame.js";
import type { CardGameState, TurnResolution } from "./CardGame.js";
import { Coordinates }            from "./Coordinates.js";
import { Effects }                from "./Effects.js";
import { Inventory }              from "./Inventory.js";
import { ItemTaking }             from "./ItemTaking.js";
import type { ItemTakingSummary } from "./ItemTakingSummary.js";
import type { Map }               from "./Map.js";
import { MonsterDefinition }      from "./MonsterDefinition.js";

export class FightView {
    private overlay: HTMLDivElement|null = null;
    private game: CardGame|null = null;
    private victoryApplied = false;
    private sourceElement: HTMLElement|null = null;

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
        const requiredNames = this.itemTakingSummary.expenses.map(
            expense => expense.itemType.name,
        );
        this.game = new CardGame(
            monster,
            this.inventory.totalQuantities,
            this.coordinates.getSeed(),
            requiredNames,
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
        title.textContent = this.capitalize(this.itemTakingSummary.itemType.name);
        panel.append(title);
        panel.append(this.statLine(
            "Monster " + state.monsterHealth + " / " + state.monsterMaxHealth,
            "Next attack " + state.monsterIntent,
            "fight-monster-health",
        ));
        panel.append(this.statLine(
            "You " + state.playerHealth + " / " + state.playerMaxHealth,
            "Chosen " + state.selectedCardIds.length + " / 3",
            "fight-player-health",
        ));

        if (state.status === "playing") {
            panel.append(this.createHand(state));
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
    }

    private createHand(state: CardGameState): HTMLDivElement {
        const hand = document.createElement("div");
        hand.className = "fight-hand";
        state.hand.forEach(card => {
            const details = [];
            if (card.damage > 0) details.push(card.damage + " damage");
            if (card.block > 0) details.push(card.block + " block");
            if (card.healing > 0) details.push(card.healing + " heal");
            const cardButton = this.button(
                card.title + "\n" + details.join(" · "),
                () => {
                    const selection = this.game?.toggleCard(card.id);
                    if (selection?.turnResolution !== null
                        && selection?.turnResolution !== undefined
                    ) {
                        this.playTurnEffects(selection.turnResolution);
                    }
                    this.render();
                },
            );
            cardButton.classList.add("fight-card");
            cardButton.dataset.cardId = card.id;
            if (state.selectedCardIds.includes(card.id)) {
                cardButton.classList.add("fight-card--selected");
            }
            hand.append(cardButton);
        });

        return hand;
    }

    private playTurnEffects(resolution: TurnResolution): void {
        const cardElements = resolution.cards.map(card => {
            const elements = this.overlay === null
                ? []
                : Array.from(this.overlay.querySelectorAll<HTMLElement>(".fight-card"));

            return [...elements].find(element => element.dataset.cardId === card.id) ?? null;
        });
        Effects.playFightTurn(
            resolution,
            cardElements,
            this.overlay?.querySelector<HTMLElement>(".fight-monster-health") ?? null,
            this.overlay?.querySelector<HTMLElement>(".fight-player-health") ?? null,
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
}
