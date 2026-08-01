import { CardGame } from "./CardGame.js";
import { Coordinates } from "./Coordinates.js";
import { Effects } from "./Effects.js";
import { Inventory } from "./Inventory.js";
import { ItemTaking } from "./ItemTaking.js";
import { MonsterDefinition } from "./MonsterDefinition.js";
export class FightView {
    constructor(itemTakingSummary, inventory, coordinates, map) {
        this.itemTakingSummary = itemTakingSummary;
        this.inventory = inventory;
        this.coordinates = coordinates;
        this.map = map;
        this.overlay = null;
        this.game = null;
        this.victoryApplied = false;
        this.sourceElement = null;
    }
    open() {
        const monster = MonsterDefinition.get(this.itemTakingSummary.itemType.name);
        if (monster === null) {
            return;
        }
        this.sourceElement = document.querySelector(".cell.selected .item.collectible");
        this.map.setInteractionLocked(true);
        this.overlay = document.createElement("div");
        this.overlay.className = "fight-overlay";
        document.body.append(this.overlay);
        this.startGame(monster);
    }
    startGame(monster) {
        this.victoryApplied = false;
        const requiredNames = this.itemTakingSummary.expenses.map(expense => expense.itemType.name);
        this.game = new CardGame(monster, this.inventory.totalQuantities, this.coordinates.getSeed(), requiredNames);
        this.render();
    }
    render() {
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
        panel.append(this.statLine("Monster " + state.monsterHealth + " / " + state.monsterMaxHealth, "Next attack " + state.monsterIntent));
        panel.append(this.statLine("You " + state.playerHealth + " / " + state.playerMaxHealth, "Block " + state.block + " · Chosen " + state.selectedCardIds.length + " / 3"));
        if (state.status === "playing") {
            panel.append(this.createHand(state));
        }
        else {
            const outcome = document.createElement("div");
            outcome.className = "fight-outcome fight-outcome--" + state.status;
            outcome.textContent = state.status === "won" ? "Victory" : "Defeated";
            panel.append(outcome);
            if (state.status === "won") {
                this.applyVictory();
            }
            else {
                const monster = MonsterDefinition.get(this.itemTakingSummary.itemType.name);
                if (monster !== null) {
                    panel.append(this.button("Try again", () => this.startGame(monster)));
                }
            }
        }
        this.overlay.append(panel);
    }
    createHand(state) {
        const hand = document.createElement("div");
        hand.className = "fight-hand";
        state.hand.forEach(card => {
            const details = [];
            if (card.damage > 0)
                details.push(card.damage + " damage");
            if (card.block > 0)
                details.push(card.block + " block");
            if (card.healing > 0)
                details.push(card.healing + " heal");
            const cardButton = this.button(card.title + "\n" + details.join(" · "), () => {
                var _a;
                (_a = this.game) === null || _a === void 0 ? void 0 : _a.toggleCard(card.id);
                this.render();
            });
            cardButton.classList.add("fight-card");
            if (state.selectedCardIds.includes(card.id)) {
                cardButton.classList.add("fight-card--selected");
            }
            hand.append(cardButton);
        });
        return hand;
    }
    applyVictory() {
        if (this.victoryApplied) {
            return;
        }
        this.victoryApplied = true;
        const currentSummary = new ItemTaking(this.itemTakingSummary.itemType, this.inventory).summary();
        if (currentSummary.missing.length > 0) {
            return;
        }
        const result = this.inventory.takeItem(this.coordinates);
        if (result !== null) {
            Effects.playItemAction(result, this.sourceElement);
            this.map.show({});
        }
    }
    close() {
        var _a;
        (_a = this.overlay) === null || _a === void 0 ? void 0 : _a.remove();
        this.overlay = null;
        this.map.setInteractionLocked(false);
    }
    requestClose(state) {
        if (state.status === "playing"
            && !window.confirm("Retreat from this fight? Your inventory will not change.")) {
            return;
        }
        this.close();
    }
    statLine(leftText, rightText) {
        const line = document.createElement("div");
        line.className = "fight-stats";
        const left = document.createElement("span");
        left.textContent = leftText;
        const right = document.createElement("span");
        right.textContent = rightText;
        line.append(left, right);
        return line;
    }
    button(text, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.onclick = action;
        return button;
    }
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}
