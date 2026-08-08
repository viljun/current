import { ItemExplanation } from "./ItemExplanation.js";
import { OriginArtwork } from "./OriginArtwork.js";
export class EncounterCard {
    static show(description, details = "", title = "", returnFocus = null, closeLabel = "Close encounter details") {
        EncounterCard.setActiveItemToggle(null);
        EncounterCard.setActiveItemName(null);
        const card = EncounterCard.element();
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "fight-close encounter-card-close";
        closeButton.setAttribute("aria-label", closeLabel);
        closeButton.onclick = () => {
            EncounterCard.clear();
            if (returnFocus === null || returnFocus === void 0 ? void 0 : returnFocus.isConnected) {
                returnFocus.focus();
            }
        };
        card.replaceChildren(closeButton);
        if (title !== "") {
            const titleElement = document.createElement("h2");
            titleElement.className = "encounter-card-title";
            titleElement.textContent = title;
            card.append(titleElement);
        }
        if (description !== "") {
            const descriptionElement = document.createElement("span");
            descriptionElement.className = "encounter-card-description";
            descriptionElement.textContent = description;
            card.append(descriptionElement);
        }
        if (details instanceof HTMLElement) {
            details.classList.add("encounter-card-details");
            card.append(details);
        }
        else if (details !== "") {
            const detailsElement = document.createElement("span");
            detailsElement.className = "encounter-card-details";
            const detailText = details.trim();
            detailsElement.textContent = detailText.charAt(0).toUpperCase()
                + detailText.slice(1);
            card.append(detailsElement);
        }
        card.hidden = false;
    }
    static showItem(itemName, origin, returnFocus = null) {
        if (returnFocus !== null
            && EncounterCard.activeItemToggle === returnFocus) {
            EncounterCard.clear();
            return;
        }
        const content = document.createElement("div");
        content.className = "encounter-item-card-content";
        const artwork = OriginArtwork.create(itemName, origin, "encounter-card-item-art");
        OriginArtwork.containSubject(artwork, "encounter-card-item-art-subject-frame");
        content.append(artwork, ItemExplanation.element(itemName, origin.latitude, origin.longitude, origin.areaId));
        EncounterCard.show("", content, ItemExplanation.displayName(itemName), returnFocus, "Close item details");
        EncounterCard.setActiveItemToggle(returnFocus);
        EncounterCard.setActiveItemName(itemName);
    }
    static clear() {
        EncounterCard.setActiveItemToggle(null);
        EncounterCard.setActiveItemName(null);
        const card = document.getElementById(EncounterCard.ID);
        if (!(card instanceof HTMLElement)) {
            return;
        }
        card.hidden = true;
        card.replaceChildren();
    }
    static element() {
        const existing = document.getElementById(EncounterCard.ID);
        if (existing instanceof HTMLElement) {
            EncounterCard.prepare(existing);
            return existing;
        }
        const card = document.createElement("aside");
        card.id = EncounterCard.ID;
        document.body.append(card);
        EncounterCard.prepare(card);
        return card;
    }
    static prepare(card) {
        card.classList.add("encounter-card");
        card.setAttribute("aria-label", "Encounter details");
    }
    static setActiveItemToggle(button) {
        if (EncounterCard.activeItemToggle !== null) {
            EncounterCard.activeItemToggle.setAttribute("aria-expanded", "false");
        }
        EncounterCard.activeItemToggle = button;
        if (button !== null) {
            button.setAttribute("aria-expanded", "true");
        }
    }
    static setActiveItemName(itemName) {
        if (EncounterCard.activeItemName === itemName) {
            return;
        }
        EncounterCard.activeItemName = itemName;
        document.dispatchEvent(new CustomEvent(EncounterCard.ITEM_FOCUS_EVENT, { detail: { itemName } }));
    }
}
EncounterCard.ID = "encounterCard";
EncounterCard.ITEM_FOCUS_EVENT = "encounter-card-item-focus";
EncounterCard.activeItemToggle = null;
EncounterCard.activeItemName = null;
