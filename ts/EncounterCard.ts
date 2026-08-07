import type { ItemOrigin } from "./Inventory.js";
import { ItemExplanation } from "./ItemExplanation.js";
import { OriginArtwork } from "./OriginArtwork.js";

export class EncounterCard {
    static readonly ID = "encounterCard";
    private static activeItemToggle: HTMLElement|null = null;

    static show(
        description: string,
        details: string|HTMLElement = "",
        title = "",
        returnFocus: HTMLElement|null = null,
        closeLabel = "Close encounter details",
    ): void {
        EncounterCard.setActiveItemToggle(null);
        const card = EncounterCard.element();
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "fight-close encounter-card-close";
        closeButton.setAttribute("aria-label", closeLabel);
        closeButton.onclick = () => {
            EncounterCard.clear();
            if (returnFocus?.isConnected) {
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
        } else if (details !== "") {
            const detailsElement = document.createElement("span");
            detailsElement.className = "encounter-card-details";
            const detailText = details.trim();
            detailsElement.textContent = detailText.charAt(0).toUpperCase()
                + detailText.slice(1);
            card.append(detailsElement);
        }
        card.hidden = false;
    }

    static showItem(
        itemName: string,
        origin: ItemOrigin,
        returnFocus: HTMLElement|null = null,
    ): void {
        if (
            returnFocus !== null
            && EncounterCard.activeItemToggle === returnFocus
        ) {
            EncounterCard.clear();

            return;
        }

        const content = document.createElement("div");
        content.className = "encounter-item-card-content";
        const artwork = OriginArtwork.create(
            itemName,
            origin,
            "encounter-card-item-art",
        );
        OriginArtwork.containSubject(
            artwork,
            "encounter-card-item-art-subject-frame",
        );
        content.append(
            artwork,
            ItemExplanation.element(
                itemName,
                origin.latitude,
                origin.longitude,
                origin.areaId,
            ),
        );
        EncounterCard.show(
            "",
            content,
            ItemExplanation.displayName(itemName),
            returnFocus,
            "Close item details",
        );
        EncounterCard.setActiveItemToggle(returnFocus);
    }

    static clear(): void {
        EncounterCard.setActiveItemToggle(null);
        const card = document.getElementById(EncounterCard.ID);
        if (!(card instanceof HTMLElement)) {
            return;
        }
        card.hidden = true;
        card.replaceChildren();
    }

    private static element(): HTMLElement {
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

    private static prepare(card: HTMLElement): void {
        card.classList.add("encounter-card");
        card.setAttribute("aria-label", "Encounter details");
    }

    private static setActiveItemToggle(button: HTMLElement|null): void {
        if (EncounterCard.activeItemToggle !== null) {
            EncounterCard.activeItemToggle.setAttribute(
                "aria-expanded",
                "false",
            );
        }
        EncounterCard.activeItemToggle = button;
        if (button !== null) {
            button.setAttribute("aria-expanded", "true");
        }
    }
}
