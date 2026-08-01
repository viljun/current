import { CardGame } from "./CardGame.js";
import { Coordinates } from "./Coordinates.js";
import { Effects } from "./Effects.js";
import { Inventory } from "./Inventory.js";
import { ItemTaking } from "./ItemTaking.js";
import { MonsterDefinition } from "./MonsterDefinition.js";
import { OriginArtwork } from "./OriginArtwork.js";
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
        const itemOrigins = {};
        for (const itemName of Object.keys(this.inventory.totalQuantities)) {
            itemOrigins[itemName] = this.inventory.getItemOrigins(itemName);
        }
        this.game = new CardGame(monster, this.inventory.totalQuantities, this.coordinates.getSeed(), requiredNames, itemOrigins);
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
        title.textContent = "Battle";
        panel.append(title);
        panel.append(this.createCombatants());
        panel.append(this.statLine(this.capitalize(this.itemTakingSummary.itemType.name)
            + " " + state.monsterHealth + " / " + state.monsterMaxHealth, "Next attack " + state.monsterIntent, "fight-monster-health"));
        panel.append(this.statLine("You " + state.playerHealth + " / " + state.playerMaxHealth, "Chosen " + state.selectedCardIds.length + " / 3", "fight-player-health"));
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
            const cardButton = this.button("", () => {
                var _a;
                const selection = (_a = this.game) === null || _a === void 0 ? void 0 : _a.toggleCard(card.id);
                if ((selection === null || selection === void 0 ? void 0 : selection.turnResolution) !== null
                    && (selection === null || selection === void 0 ? void 0 : selection.turnResolution) !== undefined) {
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
    createCombatants() {
        const origin = {
            latitude: this.coordinates.latitude,
            longitude: this.coordinates.longitude,
            depth: this.inventory.getDepth(),
        };
        const row = document.createElement("div");
        row.className = "fight-combatants";
        row.append(this.createPortrait(this.itemTakingSummary.itemType.name, this.capitalize(this.itemTakingSummary.itemType.name), origin), this.createPortrait("cat", "You", origin));
        return row;
    }
    createPortrait(itemName, label, origin) {
        const portrait = OriginArtwork.create(itemName, origin, "fight-portrait-art");
        const wrapper = document.createElement("div");
        wrapper.className = "fight-portrait";
        const caption = document.createElement("strong");
        caption.textContent = label;
        wrapper.append(portrait, caption);
        return wrapper;
    }
    playTurnEffects(resolution) {
        var _a, _b, _c, _d;
        const cardElements = resolution.cards.map(card => {
            var _a;
            const elements = this.overlay === null
                ? []
                : Array.from(this.overlay.querySelectorAll(".fight-card"));
            return (_a = [...elements].find(element => element.dataset.cardId === card.id)) !== null && _a !== void 0 ? _a : null;
        });
        Effects.playFightTurn(resolution, cardElements, (_b = (_a = this.overlay) === null || _a === void 0 ? void 0 : _a.querySelector(".fight-monster-health")) !== null && _b !== void 0 ? _b : null, (_d = (_c = this.overlay) === null || _c === void 0 ? void 0 : _c.querySelector(".fight-player-health")) !== null && _d !== void 0 ? _d : null);
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
    statLine(leftText, rightText, leftClass) {
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
