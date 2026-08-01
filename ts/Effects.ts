import type { ItemActionResult } from "./Inventory.js";
import type { CardDefinition, CardPlayResolution, CombatEffect } from "./CardGame.js";
import { OriginArtwork } from "./OriginArtwork.js";

type EffectType = "collect" | "craft" | "combat" | "rare";

export class Effects {
    private static readonly SOUND_STORAGE_KEY = "gpsgame.soundEnabled";
    private static readonly COMBAT_ITEMS = new Set(["rat", "orc", "troll"]);
    private static readonly CRAFT_ITEMS = new Set([
        "body shop",
        "club",
        "iron",
        "nature shop",
        "smelter",
        "stone axe",
        "sword",
        "weapon shop",
    ]);
    private static readonly RARE_ITEMS = new Set([
        "chest",
        "dungeon entrance",
        "treasure",
    ]);

    private static soundEnabled = false;
    private static audioContext: AudioContext|null = null;

    static initialize(soundSwitch: HTMLInputElement): void {
        try {
            Effects.soundEnabled = localStorage.getItem(Effects.SOUND_STORAGE_KEY) === "true";
        } catch {
            Effects.soundEnabled = false;
        }
        soundSwitch.checked = Effects.soundEnabled;
        soundSwitch.addEventListener("change", () => {
            Effects.soundEnabled = soundSwitch.checked;
            try {
                localStorage.setItem(Effects.SOUND_STORAGE_KEY, String(Effects.soundEnabled));
            } catch {
                // Effects preferences must never interrupt gameplay.
            }
        });
    }

    // Starts optional presentation and returns immediately. Gameplay never waits for effects.
    static playItemAction(result: ItemActionResult, sourceElement: HTMLElement|null): void {
        try {
            const type = Effects.getType(result.itemType.name);
            Effects.showChanges(result, sourceElement, type);
            Effects.playSound(type);
            Effects.vibrate(type);
        } catch (error) {
            console.warn("Unable to play item effect.", error);
        }
    }

    // Decorative only: the fight continues without waiting for this animation.
    static showFightRound(board: HTMLElement, round: number): void {
        try {
            const text = document.createElement("div");
            text.className = "fight-round-effect";
            text.textContent = "Round " + round + "/3";
            text.setAttribute("aria-hidden", "true");
            board.append(text);
            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            const duration = reducedMotion ? 850 : 2_200;
            const animation = text.animate([
                { transform: "translate(-50%, -50%) scale(.08)", opacity: 0 },
                { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: .35 },
                { transform: "translate(-50%, -50%) scale(2.1)", opacity: .9, offset: .62 },
                { transform: "translate(-50%, -50%) scale(5)", opacity: 0 },
            ], {
                duration,
                easing: "cubic-bezier(.2,.75,.2,1)",
                fill: "forwards",
            });
            const remove = () => text.remove();
            animation.addEventListener("finish", remove, { once: true });
            animation.addEventListener("cancel", remove, { once: true });
            window.setTimeout(remove, duration + 150);
        } catch (error) {
            console.warn("Unable to show round effect.", error);
        }
    }

    static showSpentFightCard(card: HTMLElement): void {
        card.classList.add("fight-card--spent");
        card.setAttribute("aria-disabled", "true");
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        card.animate([
            {
                opacity: 1,
                filter: "grayscale(0) brightness(1)",
                transform: "scale(1)",
            },
            {
                opacity: .28,
                filter: "grayscale(.9) brightness(.65)",
                transform: "scale(.94)",
            },
        ], {
            duration: reducedMotion ? 160 : 460,
            easing: "cubic-bezier(.2,.8,.2,1)",
            fill: "forwards",
        });
    }

    // Plays one card and each of its effects in the order resolved by the game.
    static async playFightCard(
        resolution: CardPlayResolution,
        cardElement: HTMLElement|null,
        monsterPortraitElement: HTMLElement|null,
        playerPortraitElement: HTMLElement|null,
        statusElement: HTMLElement|null,
        monsterShieldArea: HTMLElement|null,
        playerShieldArea: HTMLElement|null,
        monsterName: string,
    ): Promise<void> {
        try {
            const monsterBounds = monsterPortraitElement?.getBoundingClientRect();
            const playerBounds = playerPortraitElement?.getBoundingClientRect();
            const monsterTarget = Effects.centerOf(monsterBounds);
            const playerTarget = Effects.centerOf(playerBounds);
            const actorName = resolution.actor === "player"
                ? "You"
                : Effects.capitalize(monsterName);
            Effects.setFightStatus(
                statusElement,
                actorName + (resolution.actor === "player" ? " play " : " plays ")
                    + resolution.card.title,
            );
            const defenderShieldArea = resolution.actor === "player"
                ? monsterShieldArea
                : playerShieldArea;
            if (cardElement !== null && resolution.actor === "monster") {
                await Effects.flipMonsterCard(cardElement, resolution.card);
            } else {
                await Effects.pause(140);
            }

            for (const effect of resolution.effects) {
                if (effect.type === "wait") {
                    await Effects.pause(280);

                    continue;
                }
                const target = effect.target === "player" ? playerTarget : monsterTarget;
                const description = Effects.describeFightEffect(
                    effect,
                    monsterName,
                );
                Effects.setFightStatus(statusElement, description);
                if (
                    effect.type === "block"
                    && cardElement !== null
                ) {
                    await Effects.animateBlockingCard(
                        cardElement,
                        resolution.card,
                        resolution.actor === "monster",
                    );
                }
                if (effect.type === "damage") {
                    await Effects.animateShieldHits(
                        effect,
                        defenderShieldArea,
                        statusElement,
                        cardElement,
                    );
                    if (effect.amount > 0 && target !== null) {
                        await Effects.animateEffectBadge(
                            cardElement,
                            "damage",
                            effect.amount,
                            target,
                        );
                    }
                } else if (effect.type === "healing" && target !== null) {
                    await Effects.animateEffectBadge(
                        cardElement,
                        "healing",
                        effect.amount,
                        target,
                    );
                } else if (target !== null) {
                    if (effect.type !== "block") {
                        await Effects.floatFightText(effect, description, target);
                    }
                } else {
                    await Effects.pause(420);
                }
            }

            Effects.playSound("combat");
            Effects.vibrate("combat");
        } catch (error) {
            console.warn("Unable to play fight effect.", error);
        }
    }

    // Deals the rendered hand from the visible deck without blocking the battle.
    static dealFightCards(deckElement: HTMLElement, cardElements: HTMLElement[]): void {
        try {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }
            cardElements.forEach(card => card.style.opacity = "0");
            window.requestAnimationFrame(() => {
                const firstCard = cardElements[0]?.getBoundingClientRect();
                if (firstCard !== undefined) {
                    deckElement.style.width = firstCard.width + "px";
                    deckElement.style.height = firstCard.height + "px";
                    deckElement.style.left = (window.innerWidth / 2 - firstCard.width / 2) + "px";
                    deckElement.style.top = (window.innerHeight / 2 - firstCard.height / 2) + "px";
                }
                const deck = deckElement.getBoundingClientRect();
                deckElement.style.opacity = "1";
                const entrance = deckElement.animate([
                    { transform: "translateX(130%) scale(.55) rotate(16deg)", opacity: 0 },
                    { transform: "translateX(0) scale(1.06) rotate(0deg)", opacity: 1, offset: .58 },
                    { transform: "translateX(-7px) scale(1) rotate(-7deg)", opacity: 1, offset: .72 },
                    { transform: "translateX(6px) scale(1) rotate(6deg)", opacity: 1, offset: .86 },
                    { transform: "translateX(0) scale(1) rotate(0deg)", opacity: 1 },
                ], {
                    duration: 520,
                    easing: "cubic-bezier(.2,.8,.2,1)",
                    fill: "forwards",
                });

                cardElements.forEach((card, index) => {
                    const target = card.getBoundingClientRect();
                    const x = deck.left + deck.width / 2 - (target.left + target.width / 2);
                    const y = deck.top + deck.height / 2 - (target.top + target.height / 2);
                    const animation = card.animate([
                        { transform: "translate(" + x + "px, " + y + "px) rotate(12deg) scale(.35)", opacity: 0 },
                        { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
                    ], {
                        delay: 360 + index * 90,
                        duration: 430,
                        easing: "cubic-bezier(.2,.8,.2,1)",
                        fill: "forwards",
                    });
                    const finish = () => {
                        card.style.opacity = "";
                        animation.cancel();
                    };
                    animation.addEventListener("finish", finish, { once: true });
                    window.setTimeout(finish, 1_050 + index * 90);
                });
                const lastCardDelay = Math.max(0, cardElements.length - 1) * 90;
                const exitDelay = 790 + lastCardDelay;
                window.setTimeout(() => {
                    entrance.cancel();
                    const exit = deckElement.animate([
                        { transform: "translateX(0) scale(1) rotate(0deg)", opacity: 1 },
                        { transform: "translateX(135%) scale(.45) rotate(18deg)", opacity: 0 },
                    ], {
                        duration: 340,
                        easing: "cubic-bezier(.55,.05,.8,.25)",
                        fill: "forwards",
                    });
                    const hide = () => {
                        deckElement.style.opacity = "";
                        deckElement.style.width = "";
                        deckElement.style.height = "";
                        deckElement.style.left = "";
                        deckElement.style.top = "";
                        exit.cancel();
                    };
                    exit.addEventListener("finish", hide, { once: true });
                    window.setTimeout(hide, 430);
                }, exitDelay);
            });
        } catch (error) {
            console.warn("Unable to deal fight cards.", error);
        }
    }

    // Captures the current hand, then sweeps its clones away after the final attacks land.
    static async sweepFightCards(cardElements: HTMLElement[]): Promise<void> {
        try {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }
            cardElements.forEach((card, index) => {
                const bounds = card.getBoundingClientRect();
                const clone = card.cloneNode(true) as HTMLElement;
                clone.classList.add("effect-fight-card");
                clone.style.left = bounds.left + "px";
                clone.style.top = bounds.top + "px";
                clone.style.width = bounds.width + "px";
                clone.style.height = bounds.height + "px";
                clone.setAttribute("aria-hidden", "true");
                document.body.append(clone);
                const direction = index % 2 === 0 ? -1 : 1;
                const turns = 0.45 + (index % 5) * 0.4;
                const rotation = direction * turns * 360;
                const animation = clone.animate([
                    { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
                    {
                        transform: "translate("
                            + direction * (window.innerWidth + bounds.width)
                            + "px, " + (3 + index % 4) + "rem) rotate("
                            + rotation + "deg)",
                        opacity: 0,
                    },
                ], {
                    delay: 380 + index * 45,
                    duration: 650,
                    easing: "cubic-bezier(.55,.05,.8,.25)",
                    fill: "forwards",
                });
                animation.addEventListener("finish", () => clone.remove());
                animation.addEventListener("cancel", () => clone.remove());
                window.setTimeout(() => clone.remove(), 1_300);
            });
            const lastDelay = Math.max(0, cardElements.length - 1) * 45;
            await Effects.pause(1_050 + lastDelay);
        } catch (error) {
            console.warn("Unable to sweep fight cards.", error);
        }
    }

    private static getType(itemName: string): EffectType {
        if (Effects.COMBAT_ITEMS.has(itemName)) {
            return "combat";
        }
        if (Effects.CRAFT_ITEMS.has(itemName)) {
            return "craft";
        }
        if (Effects.RARE_ITEMS.has(itemName)) {
            return "rare";
        }

        return "collect";
    }

    private static showChanges(
        result: ItemActionResult,
        sourceElement: HTMLElement|null,
        type: EffectType,
    ): void {
        const changes = new Map<string, number>();
        changes.set(result.itemType.name, 1);
        for (const change of [...result.expenses, ...result.prizes]) {
            changes.set(
                change.itemType.name,
                (changes.get(change.itemType.name) ?? 0) + change.quantity,
            );
        }

        const visibleChanges = [...changes.entries()].filter(([, quantity]) => quantity !== 0);
        const sourceBounds = sourceElement?.getBoundingClientRect();
        const origin = {
            x: sourceBounds ? sourceBounds.left + sourceBounds.width / 2 : window.innerWidth / 2,
            y: sourceBounds ? sourceBounds.top + sourceBounds.height / 2 : window.innerHeight / 2,
        };
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        visibleChanges.forEach(([name, quantity], index) => {
            let className = "effect-change effect-change--" + (quantity > 0 ? "positive" : "negative");
            if (type === "rare" && quantity > 0) {
                className += " effect-change--rare";
            }

            const angleRange = visibleChanges.length === 1 ? 0 : 240;
            const angleDegrees = visibleChanges.length === 1
                ? -90
                : -210 + angleRange * index / (visibleChanges.length - 1);
            const angle = angleDegrees * Math.PI / 180;
            const distance = reducedMotion ? 25 : 75 + (index % 2) * 25;
            const destinationX = Math.cos(angle) * distance;
            const destinationY = Math.sin(angle) * distance - 20;
            const rotation = reducedMotion ? 0 : -8 + (index % 3) * 8;
            Effects.floatText(
                (quantity > 0 ? "+" : "") + quantity + " " + name,
                className,
                origin,
                { x: destinationX, y: destinationY },
                rotation,
            );
        });
    }

    private static floatText(
        content: string,
        className: string,
        origin: { x: number, y: number },
        destination: { x: number, y: number },
        rotation: number,
        delay: number = 0,
    ): void {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const text = document.createElement("div");
        text.className = className;
        text.textContent = content;
        text.style.left = origin.x + "px";
        text.style.top = origin.y + "px";
        text.setAttribute("aria-hidden", "true");
        document.body.append(text);
        const x = reducedMotion ? 0 : destination.x;
        const y = reducedMotion ? -25 : destination.y;
        const duration = reducedMotion ? 650 : 1_150;
        const animation = text.animate([
            { transform: "translate(-50%, -50%) scale(0.45)", opacity: 0 },
            { transform: "translate(-50%, -50%) scale(1.25)", opacity: 1, offset: 0.22 },
            {
                transform: "translate(calc(-50% + " + x + "px), calc(-50% + "
                    + y + "px)) scale(1.05) rotate(" + rotation + "deg)",
                opacity: 1,
                offset: 0.68,
            },
            {
                transform: "translate(calc(-50% + " + x * 1.2 + "px), calc(-50% + "
                    + y * 1.2 + "px)) scale(1.4) rotate(" + rotation + "deg)",
                opacity: 0,
            },
        ], {
            delay: delay,
            duration: duration,
            easing: "cubic-bezier(.2,.75,.2,1)",
            fill: "forwards",
        });
        animation.addEventListener("finish", () => text.remove());
        animation.addEventListener("cancel", () => text.remove());
        window.setTimeout(() => text.remove(), delay + duration + 150);
    }

    private static async animateBlockingCard(
        sourceElement: HTMLElement,
        card: CardDefinition,
        monsterCard: boolean,
    ): Promise<void> {
        sourceElement.classList.add("fight-card--blocking");
        sourceElement.dataset.shieldId = card.id;
        if (sourceElement instanceof HTMLButtonElement) {
            sourceElement.disabled = true;
        }
        const value = sourceElement.querySelector<HTMLElement>(".fight-effect--block");
        if (value !== null) {
            value.classList.add("fight-shield-value");
            value.textContent = String(card.block);
        }
        const direction = monsterCard ? 1 : -1;
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const duration = reducedMotion ? 150 : 320;
        const movement = sourceElement.animate([
            { transform: "translateY(0)", filter: "brightness(1)" },
            {
                transform: "translateY(" + direction * .7 + "rem)",
                filter: "brightness(1.2)",
            },
        ], {
            duration,
            easing: "cubic-bezier(.2,.8,.2,1)",
            fill: "forwards",
        });
        await Effects.animationFinished(movement, duration);
    }

    private static async flipMonsterCard(
        cardElement: HTMLElement,
        card: CardDefinition,
    ): Promise<void> {
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const halfDuration = reducedMotion ? 90 : 260;
        const hideBack = cardElement.animate([
            { transform: "rotateY(0deg)" },
            { transform: "rotateY(90deg)" },
        ], {
            duration: halfDuration,
            easing: "ease-in",
            fill: "forwards",
        });
        await Effects.animationFinished(hideBack, halfDuration);
        cardElement.className = "fight-card fight-monster-card";
        cardElement.replaceChildren(...Effects.cardContents(card));
        const showFront = cardElement.animate([
            { transform: "rotateY(-90deg)" },
            { transform: "rotateY(0deg)" },
        ], {
            duration: halfDuration,
            easing: "ease-out",
            fill: "forwards",
        });
        await Effects.animationFinished(showFront, halfDuration);
        hideBack.cancel();
        showFront.cancel();
    }

    private static async animateShieldHits(
        effect: CombatEffect,
        shieldArea: HTMLElement|null,
        statusElement: HTMLElement|null,
        sourceCard: HTMLElement|null,
    ): Promise<void> {
        for (const hit of effect.shieldHits) {
            const shield = Effects.findShieldElement(shieldArea, hit.id);
            if (shield === null) {
                continue;
            }
            Effects.setFightStatus(
                statusElement,
                "Block absorbs " + hit.absorbed + " damage",
            );
            const shieldTarget = Effects.centerOf(shield.getBoundingClientRect());
            if (shieldTarget !== null) {
                await Effects.animateEffectBadge(
                    sourceCard,
                    "damage",
                    hit.absorbed,
                    shieldTarget,
                );
            }
            const value = shield.querySelector<HTMLElement>(".fight-shield-value");
            const initialBlock = hit.remainingBlock + hit.absorbed;
            const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 180
                : 420;
            const impact = shield.animate([
                { transform: "translateX(0) scale(1)", filter: "brightness(1)" },
                {
                    transform: "translateX(-8px) scale(1.08)",
                    filter: "brightness(1.8)",
                    offset: .25,
                },
                { transform: "translateX(6px) scale(.98)", offset: .55 },
                { transform: "translateX(0) scale(1)", filter: "brightness(1)" },
            ], {
                duration,
                easing: "cubic-bezier(.2,.8,.2,1)",
            });
            const valueAnimation = Effects.animateShieldValue(
                value,
                initialBlock,
                hit.remainingBlock,
                duration,
            );
            await Promise.all([
                Effects.animationFinished(impact, duration),
                valueAnimation,
            ]);

            if (hit.remainingBlock === 0) {
                Effects.setFightStatus(statusElement, "Block is used up");
                shield.classList.remove("fight-card--blocking");
                Effects.showSpentFightCard(shield);
                await Effects.pause(460);
            }
        }
    }

    private static async animateEffectBadge(
        sourceCard: HTMLElement|null,
        type: "damage"|"healing",
        amount: number,
        target: { x: number; y: number },
    ): Promise<void> {
        const source = sourceCard?.querySelector<HTMLElement>(
            ".fight-effect--" + type,
        );
        if (source === undefined || source === null) {
            await Effects.pause(240);

            return;
        }
        const bounds = source.getBoundingClientRect();
        const badge = source.cloneNode(true) as HTMLElement;
        badge.classList.add("effect-fight-badge");
        badge.textContent = String(amount);
        badge.style.left = bounds.left + "px";
        badge.style.top = bounds.top + "px";
        badge.setAttribute("aria-hidden", "true");
        document.body.append(badge);
        const x = target.x - (bounds.left + bounds.width / 2);
        const y = target.y - (bounds.top + bounds.height / 2);
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const duration = reducedMotion ? 180 : 460;
        const animation = badge.animate([
            { transform: "translate(0, 0) scale(1)", opacity: 1 },
            {
                transform: "translate(" + x + "px, " + y + "px) scale(1.3)",
                opacity: 1,
                offset: .82,
            },
            {
                transform: "translate(" + x + "px, " + y + "px) scale(.65)",
                opacity: 0,
            },
        ], {
            duration,
            easing: "cubic-bezier(.25,.75,.25,1)",
            fill: "forwards",
        });
        await Effects.animationFinished(animation, duration);
        badge.remove();
        await Effects.pause(reducedMotion ? 40 : 100);
    }

    private static animateShieldValue(
        element: HTMLElement|null,
        from: number,
        to: number,
        duration: number,
    ): Promise<void> {
        if (element === null) {
            return Effects.pause(duration);
        }

        return new Promise(resolve => {
            const started = performance.now();
            const update = (now: number) => {
                const progress = Math.min(1, (now - started) / duration);
                const value = Math.round(from + (to - from) * progress);
                element.textContent = String(value);
                if (progress < 1) {
                    window.requestAnimationFrame(update);
                } else {
                    resolve();
                }
            };
            window.requestAnimationFrame(update);
        });
    }

    private static findShieldElement(
        area: HTMLElement|null,
        shieldId: string,
    ): HTMLElement|null {
        if (area === null) {
            return null;
        }

        return Array.from(
            area.querySelectorAll<HTMLElement>("[data-shield-id], [data-card-id]"),
        ).find(element =>
            element.dataset.shieldId === shieldId
            || (
                element.dataset.cardId === shieldId
                && element.classList.contains("fight-card--blocking")
            )
        ) ?? null;
    }

    private static async floatFightText(
        effect: CombatEffect,
        content: string,
        target: { x: number; y: number },
    ): Promise<void> {
        const text = document.createElement("div");
        const modifier = effect.type === "damage" || effect.type === "defeated"
            ? "negative"
            : effect.type === "healing"
                ? "positive"
                : effect.type === "block"
                    ? "block"
                    : "fight";
        text.className = "effect-change effect-change--" + modifier
            + " effect-change--fight effect-fight-step";
        text.textContent = content;
        text.style.left = target.x + "px";
        text.style.top = target.y + "px";
        text.setAttribute("aria-hidden", "true");
        document.body.append(text);
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reducedMotion ? 260 : 620;
        const animation = text.animate([
            { transform: "translate(-50%, -50%) scale(.7)", opacity: 0 },
            { transform: "translate(-50%, -70%) scale(1.08)", opacity: 1, offset: .25 },
            { transform: "translate(-50%, -115%) scale(1)", opacity: 1, offset: .72 },
            { transform: "translate(-50%, -145%) scale(1.05)", opacity: 0 },
        ], {
            duration,
            easing: "cubic-bezier(.2,.75,.2,1)",
            fill: "forwards",
        });
        await Effects.animationFinished(animation, duration);
        text.remove();
        await Effects.pause(reducedMotion ? 50 : 130);
    }

    private static describeFightEffect(
        effect: CombatEffect,
        monsterName: string,
    ): string {
        const actor = effect.actor === "player" ? "You" : Effects.capitalize(monsterName);
        const target = effect.target === "player" ? "you" : monsterName;
        if (effect.type === "damage") {
            if (effect.amount === 0 && effect.blocked > 0) {
                return Effects.capitalize(target) + "'s block absorbs "
                    + effect.blocked + " damage";
            }
            const blocked = effect.blocked > 0
                ? " (" + effect.blocked + " blocked)"
                : "";

            return actor + (effect.actor === "player" ? " deal " : " deals ")
                + effect.amount + " damage to " + target + blocked;
        }
        if (effect.type === "healing") {
            return actor + (effect.actor === "player" ? " heal " : " heals ")
                + effect.amount + " health";
        }
        if (effect.type === "block") {
            return actor + (effect.actor === "player" ? " gain " : " gains ")
                + effect.amount + " block";
        }
        if (effect.type === "defeated") {
            return effect.target === "monster" ? "Monster defeated" : "You are defeated";
        }

        return actor + (effect.actor === "player" ? " wait" : " waits");
    }

    private static setFightStatus(element: HTMLElement|null, text: string): void {
        if (element !== null) {
            element.textContent = text;
        }
    }

    public static createCardEffectIcons(card: CardDefinition): HTMLElement {
        const effects = document.createElement("span");
        effects.className = "fight-card-effects";
        Effects.appendCardEffectIcon(effects, "damage", card.damage);
        Effects.appendCardEffectIcon(effects, "block", card.block);
        Effects.appendCardEffectIcon(effects, "healing", card.healing);

        return effects;
    }

    private static appendCardEffectIcon(
        container: HTMLElement,
        type: "damage"|"block"|"healing",
        amount: number,
    ): void {
        if (amount <= 0) {
            return;
        }
        const label = type === "healing" ? "heal" : type;
        const icon = document.createElement("span");
        icon.className = "fight-effect-icon fight-effect--" + type;
        icon.textContent = String(amount);
        icon.title = amount + " " + label;
        icon.setAttribute("aria-label", amount + " " + label);
        container.append(icon);
    }

    private static cardContents(card: CardDefinition): Node[] {
        const contents: Node[] = [];
        if (card.origin !== null) {
            contents.push(
                OriginArtwork.create(
                    card.itemName,
                    card.origin,
                    "fight-card-art",
                ),
            );
        }
        contents.push(
            Effects.textElement("strong", card.title),
            Effects.createCardEffectIcons(card),
        );

        return contents;
    }

    private static textElement(tag: "strong"|"span", content: string): HTMLElement {
        const element = document.createElement(tag);
        element.textContent = content;

        return element;
    }

    private static animationFinished(animation: Animation, duration: number): Promise<void> {
        return new Promise(resolve => {
            let finished = false;
            const finish = () => {
                if (finished) {
                    return;
                }
                finished = true;
                resolve();
            };
            animation.addEventListener("finish", finish, { once: true });
            animation.addEventListener("cancel", finish, { once: true });
            window.setTimeout(finish, duration + 100);
        });
    }

    private static pause(milliseconds: number): Promise<void> {
        return new Promise(resolve => window.setTimeout(resolve, milliseconds));
    }

    private static capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    private static centerOf(bounds: DOMRect|undefined): { x: number, y: number }|null {
        if (bounds === undefined) {
            return null;
        }

        return {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
        };
    }

    private static playSound(type: EffectType): void {
        if (!Effects.soundEnabled || !("AudioContext" in window)) {
            return;
        }

        const context = Effects.audioContext ?? new AudioContext();
        Effects.audioContext = context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const frequencies: Record<EffectType, number> = {
            collect: 520,
            craft: 660,
            combat: 180,
            rare: 880,
        };
        oscillator.frequency.value = frequencies[type];
        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.16);
    }

    private static vibrate(type: EffectType): void {
        const patterns: Record<EffectType, number|number[]> = {
            collect: 20,
            craft: [20, 30, 20],
            combat: [40, 30, 60],
            rare: [20, 40, 20, 40, 60],
        };
        navigator.vibrate?.(patterns[type]);
    }
}
