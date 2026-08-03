import type { ItemActionResult } from "./Inventory.js";
import type { CardDefinition, CardPlayResolution, CombatEffect } from "./CardGame.js";
import { Image as GameImage } from "./Image.js";
import { OriginArtwork } from "./OriginArtwork.js";

type EffectType = "collect" | "craft" | "combat" | "rare";

export class Effects {
    private static readonly MAX_ITEM_ANIMATIONS_PER_TYPE = 50;
    private static readonly SOUND_STORAGE_KEY = "gpsgame.soundEnabled";
    private static readonly COMBAT_ITEMS = new Set(["rat", "orc", "troll"]);
    private static readonly CRAFT_ITEMS = new Set([
        "armorer's bench",
        "arming sword",
        "bearded battle axe",
        "club",
        "crucible",
        "flanged mace",
        "furnace",
        "iron hand axe",
        "iron-spiked club",
        "longsword",
        "masterwork greatsword",
        "padded hide",
        "poleaxe",
        "reinforced shield",
        "stone axe",
        "sword",
        "torch",
        "two-handed battle axe",
        "war hammer",
        "wooden shield",
    ]);
    private static readonly RARE_ITEMS = new Set([
        "chest",
        "dungeon entrance",
        "shop entrance",
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
    static playItemAction(
        result: ItemActionResult,
        sourceElement: HTMLElement|null,
        actionSeed: number,
    ): void {
        try {
            const type = Effects.getType(result.itemType.name);
            Effects.showChanges(result, sourceElement, type, actionSeed);
            Effects.playSound(type);
            Effects.vibrate(type);
        } catch (error) {
            console.warn("Unable to play item effect.", error);
        }
    }

    // Decorative only: collision has already exited the area when this starts.
    static showAreaCollapse(map: HTMLElement, seed: number): void {
        try {
            const overlay = document.createElement("div");
            overlay.className = "area-collapse-effect";
            overlay.style.gridTemplateColumns = getComputedStyle(map).gridTemplateColumns;
            Array.from(map.children).forEach((cell, index) => {
                const fragment = (cell as HTMLElement).cloneNode(true) as HTMLElement;
                const signed = ((Math.abs(seed + index * 7919) % 201) - 100) / 100;
                fragment.style.setProperty("--collapse-x", (signed * 55) + "px");
                fragment.style.setProperty(
                    "--collapse-rotate",
                    (((seed + index * 37) % 31) - 15) + "deg",
                );
                overlay.append(fragment);
            });
            map.parentElement?.append(overlay);
            window.setTimeout(() => overlay.remove(), 1_250);
        } catch (error) {
            console.warn("Unable to show area collapse.", error);
        }
    }

    // Decorative only: the fight continues without waiting for this animation.
    static showFightRound(board: HTMLElement, remainingRounds: number): void {
        try {
            const text = document.createElement("div");
            text.className = "fight-round-effect";
            text.textContent = String(remainingRounds);
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

    static showFightOutcome(
        board: HTMLElement,
        outcome: "Victory"|"Defeated",
    ): void {
        try {
            const text = document.createElement("div");
            text.className = "fight-outcome-effect fight-outcome-effect--"
                + outcome.toLowerCase();
            text.textContent = outcome;
            text.setAttribute("role", "status");
            board.append(text);
            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            const duration = reducedMotion ? 2_000 : 4_000;
            const animation = text.animate([
                { transform: "translate(-50%, -50%) scale(.35)", opacity: 0 },
                { transform: "translate(-50%, -50%) scale(1.12)", opacity: 1, offset: .3 },
                { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: .78 },
                { transform: "translate(-50%, -50%) scale(.92)", opacity: 0 },
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
            console.warn("Unable to show fight outcome effect.", error);
        }
    }

    static showSpentFightCard(card: HTMLElement): void {
        card.getAnimations().forEach(animation => animation.cancel());
        card.classList.add("fight-card--spent");
        card.setAttribute("aria-disabled", "true");
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        card.animate([
            {
                opacity: 1,
                filter: "grayscale(0) brightness(1)",
            },
            {
                opacity: .28,
                filter: "grayscale(.9) brightness(.65)",
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
        monsterHealthIcon: HTMLElement|null,
        playerHealthIcon: HTMLElement|null,
        monsterShieldArea: HTMLElement|null,
        playerShieldArea: HTMLElement|null,
        monsterName: string,
    ): Promise<void> {
        try {
            const monsterBounds = monsterPortraitElement?.getBoundingClientRect();
            const playerBounds = playerPortraitElement?.getBoundingClientRect();
            const monsterTarget = Effects.centerOf(monsterBounds);
            const playerTarget = Effects.centerOf(playerBounds);
            const monsterHealthTarget = Effects.centerOf(
                monsterHealthIcon?.getBoundingClientRect(),
            );
            const playerHealthTarget = Effects.centerOf(
                playerHealthIcon?.getBoundingClientRect(),
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
                        cardElement,
                    );
                    const healthIcon = effect.target === "player"
                        ? playerHealthIcon
                        : monsterHealthIcon;
                    const healthTarget = effect.target === "player"
                        ? playerHealthTarget
                        : monsterHealthTarget;
                    if (effect.amount > 0 && healthTarget !== null) {
                        await Effects.animateEffectBadge(
                            cardElement,
                            "damage",
                            effect.amount,
                            healthTarget,
                            healthIcon,
                        );
                    }
                } else if (effect.type === "healing") {
                    const healthTarget = effect.target === "player"
                        ? playerHealthTarget
                        : monsterHealthTarget;
                    if (healthTarget !== null) {
                        await Effects.animateEffectBadge(
                            cardElement,
                            "healing",
                            effect.amount,
                            healthTarget,
                        );
                    }
                } else if (target !== null) {
                    if (
                        effect.type !== "block"
                        && effect.type !== "defeated"
                    ) {
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

    // Sweeps visual copies away while the hidden originals preserve the board layout.
    static async sweepFightCards(cardElements: HTMLElement[]): Promise<void> {
        try {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }
            cardElements.forEach((card, index) => {
                const bounds = card.getBoundingClientRect();
                const startingOpacity = getComputedStyle(card).opacity;
                const clone = card.cloneNode(true) as HTMLElement;
                clone.classList.add("effect-fight-card");
                clone.style.left = bounds.left + "px";
                clone.style.top = bounds.top + "px";
                clone.style.width = bounds.width + "px";
                clone.style.height = bounds.height + "px";
                clone.style.font = getComputedStyle(card).font;
                clone.style.textAlign = getComputedStyle(card).textAlign;
                clone.setAttribute("aria-hidden", "true");
                const host = card.closest<HTMLElement>(".fight-overlay") ?? document.body;
                host.append(clone);
                const direction = index % 2 === 0 ? -1 : 1;
                const turns = 0.45 + (index % 5) * 0.4;
                const rotation = direction * turns * 360;
                const animation = clone.animate([
                    {
                        transform: "translate(0, 0) rotate(0deg)",
                        opacity: startingOpacity,
                    },
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
                animation.addEventListener("finish", () => clone.remove(), { once: true });
                animation.addEventListener("cancel", () => clone.remove(), { once: true });
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
        actionSeed: number,
    ): void {
        const changes = new Map<string, number>();
        changes.set(result.itemType.name, 1);
        for (const change of [...result.expenses, ...result.prizes]) {
            changes.set(
                change.itemType.name,
                (changes.get(change.itemType.name) ?? 0) + change.quantity,
            );
        }

        const visibleChanges = [...changes.entries()].filter(([, quantity]) => quantity > 0);
        const sourceBounds = sourceElement?.getBoundingClientRect();
        const origin = {
            x: sourceBounds ? sourceBounds.left + sourceBounds.width / 2 : window.innerWidth / 2,
            y: sourceBounds ? sourceBounds.top + sourceBounds.height / 2 : window.innerHeight / 2,
        };
        const inventoryBounds = document.getElementById(
            "inventoryControl",
        )?.getBoundingClientRect();
        const target = {
            x: inventoryBounds
                ? inventoryBounds.left + inventoryBounds.width / 2
                : window.innerWidth,
            y: inventoryBounds
                ? inventoryBounds.top + inventoryBounds.height / 2
                : window.innerHeight,
        };
        visibleChanges.forEach(([name, quantity], index) => {
            const animationCount = Math.min(
                quantity,
                Effects.MAX_ITEM_ANIMATIONS_PER_TYPE,
            );
            for (let itemIndex = 0; itemIndex < animationCount; itemIndex++) {
                Effects.floatItem(
                    name,
                    origin,
                    itemIndex,
                    index,
                    type === "rare",
                    actionSeed,
                    target,
                );
            }
        });
    }

    private static floatItem(
        itemName: string,
        origin: { x: number, y: number },
        itemIndex: number,
        typeIndex: number,
        rare: boolean,
        actionSeed: number,
        target: { x: number, y: number },
    ): void {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const seed = Effects.flightSeed(actionSeed, itemName, itemIndex, typeIndex);
        const item = document.createElement("img");
        item.className = "effect-item" + (rare ? " effect-item--rare" : "");
        item.src = "images/" + GameImage.getWithItemTypeName(itemName, 54, seed).src;
        item.alt = "";
        item.style.left = origin.x + "px";
        item.style.top = origin.y + "px";
        item.setAttribute("aria-hidden", "true");
        document.body.append(item);

        const x = target.x - origin.x;
        const y = target.y - origin.y;
        const distance = Math.max(1, Math.hypot(x, y));
        const perpendicularX = -y / distance;
        const perpendicularY = x / distance;
        const bend = reducedMotion
            ? 0
            : ((seed % 201) - 100) / 100 * Math.min(220, 70 + distance * .22);
        const lift = reducedMotion ? 0 : 35 + ((seed >>> 8) % 76);
        const rotation = reducedMotion ? 0 : -140 + seed % 281;
        const delay = reducedMotion ? itemIndex * 4 : itemIndex * 12 + seed % 17;
        const duration = reducedMotion ? 380 : 850 + seed % 351;
        const animation = item.animate([
            { transform: "translate(-50%, -50%) scale(.3)", opacity: 0 },
            {
                transform: "translate(calc(-50% + " + (
                    x * .25 + perpendicularX * bend
                ) + "px), calc(-50% + " + (
                    y * .25 + perpendicularY * bend - lift
                ) + "px)) scale(1.05) rotate(" + rotation * .2 + "deg)",
                opacity: 1,
                offset: .3,
            },
            {
                transform: "translate(calc(-50% + " + (
                    x * .68 + perpendicularX * bend * .55
                ) + "px), calc(-50% + " + (
                    y * .68 + perpendicularY * bend * .55 - lift * .45
                ) + "px)) scale(.85) rotate(" + rotation * .72 + "deg)",
                opacity: 1,
                offset: .7,
            },
            {
                transform: "translate(calc(-50% + " + x
                    + "px), calc(-50% + " + y
                    + "px)) scale(.28) rotate(" + rotation + "deg)",
                opacity: 1,
                offset: .92,
            },
            {
                transform: "translate(calc(-50% + " + x
                    + "px), calc(-50% + " + y
                    + "px)) scale(.08) rotate(" + rotation + "deg)",
                opacity: 0,
            },
        ], {
            delay,
            duration,
            easing: "cubic-bezier(.2,.65,.35,1)",
            fill: "forwards",
        });
        const remove = () => item.remove();
        animation.addEventListener("finish", remove, { once: true });
        animation.addEventListener("cancel", remove, { once: true });
        window.setTimeout(remove, delay + duration + 150);
    }

    private static flightSeed(
        actionSeed: number,
        itemName: string,
        itemIndex: number,
        typeIndex: number,
    ): number {
        let seed = actionSeed ^ Effects.stringSeed(itemName);
        seed ^= Math.imul(itemIndex + 1, 0x9e3779b1);
        seed ^= Math.imul(typeIndex + 1, 0x85ebca6b);
        seed ^= seed >>> 16;
        seed = Math.imul(seed, 0x7feb352d);
        seed ^= seed >>> 15;

        return seed >>> 0;
    }

    private static stringSeed(value: string): number {
        let seed = 0;
        for (let index = 0; index < value.length; index++) {
            seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
        }

        return seed;
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
        const blockOffset = direction * .7;
        sourceElement.dataset.blockOffset = String(blockOffset);
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const duration = reducedMotion ? 150 : 320;
        const movement = sourceElement.animate([
            { transform: "translateY(0)", filter: "brightness(1)" },
            {
                transform: "translateY(" + blockOffset + "rem)",
                filter: "brightness(1.2)",
            },
        ], {
            duration,
            easing: "cubic-bezier(.2,.8,.2,1)",
            fill: "forwards",
        });
        await Effects.animationFinished(movement, duration);
        sourceElement.style.transform = "translateY(" + blockOffset + "rem)";
        sourceElement.style.filter = "brightness(1.2)";
        movement.cancel();
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
        sourceCard: HTMLElement|null,
    ): Promise<void> {
        for (const hit of effect.shieldHits) {
            const shield = Effects.findShieldElement(shieldArea, hit.id);
            if (shield === null) {
                continue;
            }
            const shieldTarget = Effects.centerOf(shield.getBoundingClientRect());
            const value = shield.querySelector<HTMLElement>(".fight-shield-value");
            const badgeTarget = Effects.centerOf(value?.getBoundingClientRect())
                ?? shieldTarget;
            if (badgeTarget !== null) {
                await Effects.animateEffectBadge(
                    sourceCard,
                    "damage",
                    hit.absorbed,
                    badgeTarget,
                    value,
                );
            }
            const initialBlock = hit.remainingBlock + hit.absorbed;
            const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 180
                : 420;
            const valueAnimation = Effects.animateShieldValue(
                value,
                initialBlock,
                hit.remainingBlock,
                duration,
            );
            await valueAnimation;

            if (hit.remainingBlock === 0) {
                await Effects.animateExhaustedShieldReturn(shield);
                shield.classList.remove("fight-card--blocking");
                Effects.showSpentFightCard(shield);
                await Effects.pause(460);
            }
        }
    }

    private static async animateExhaustedShieldReturn(
        shield: HTMLElement,
    ): Promise<void> {
        const offset = Number(shield.dataset.blockOffset);
        const safeOffset = Number.isFinite(offset) ? offset : 0;
        shield.getAnimations().forEach(animation => animation.cancel());
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const duration = reducedMotion ? 140 : 360;
        const movement = shield.animate([
            { transform: "translateY(" + safeOffset + "rem)" },
            { transform: "translateY(0)" },
        ], {
            duration,
            easing: "cubic-bezier(.2,.8,.2,1)",
            fill: "forwards",
        });
        await Effects.animationFinished(movement, duration);
        shield.style.transform = "translateY(0)";
        shield.style.filter = "";
        delete shield.dataset.blockOffset;
        movement.cancel();
    }

    private static async animateEffectBadge(
        sourceCard: HTMLElement|null,
        type: "damage"|"healing",
        amount: number,
        target: { x: number; y: number },
        impactBadge: HTMLElement|null = null,
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
        const duration = reducedMotion ? 180 : 650;
        const seedText = (sourceCard?.dataset.cardId ?? "card")
            + ":" + (impactBadge?.closest<HTMLElement>("[data-shield-id]")
                ?.dataset.shieldId ?? impactBadge?.className ?? "target")
            + ":" + type + ":" + amount;
        const seed = Effects.stringSeed(seedText);
        const distance = Math.max(1, Math.hypot(x, y));
        const perpendicularX = -y / distance;
        const perpendicularY = x / distance;
        const direction = seed % 2 === 0 ? 1 : -1;
        const bend = reducedMotion
            ? 0
            : direction * Math.min(145, 38 + distance * .3)
                * (.72 + ((seed >>> 8) % 57) / 100);
        const swing = reducedMotion
            ? 0
            : -direction * (14 + ((seed >>> 16) % 39));
        const rotation = reducedMotion ? 0 : direction * (18 + seed % 39);
        const progressPoints = reducedMotion
            ? [0, 1]
            : [0, .1, .22, .36, .5, .64, .76, .86, .94, 1];
        const flight = progressPoints.map(progress => {
            const curve = Math.sin(Math.PI * progress) * bend
                + Math.sin(2 * Math.PI * progress) * swing;
            const translateX = x * progress + perpendicularX * curve;
            const translateY = y * progress + perpendicularY * curve;
            const scale = 1 + 1.55 * progress;

            return {
                transform: "translate(" + translateX + "px, "
                    + translateY + "px) scale(" + scale + ") rotate("
                    + rotation * progress + "deg)",
                opacity: progress === 1 ? 0 : 1,
                offset: progress,
            };
        });
        const animation = badge.animate(flight, {
            duration,
            easing: reducedMotion ? "linear" : "cubic-bezier(.16,.82,.25,1)",
            fill: "forwards",
        });
        await Effects.animationFinished(animation, duration);
        badge.remove();
        if (impactBadge !== null) {
            Effects.animateDamagedBadge(impactBadge);
        }
        await Effects.pause(reducedMotion ? 40 : 100);
    }

    private static animateDamagedBadge(source: HTMLElement): void {
        const bounds = source.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) {
            return;
        }
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const duration = reducedMotion ? 180 : 520;
        const halves = [
            {
                clipPath: "polygon(0 0, 58% 0, 45% 35%, 58% 57%, 43% 100%, 0 100%)",
                end: "translate(-115%, 50%) rotate(-28deg) scale(3.8)",
                origin: "right center",
            },
            {
                clipPath: "polygon(58% 0, 100% 0, 100% 100%, 43% 100%, 58% 57%, 45% 35%)",
                end: "translate(115%, 50%) rotate(28deg) scale(3.8)",
                origin: "left center",
            },
        ].map(part => {
            const fragment = document.createElement("span");
            fragment.className = "fight-damaged-badge";
            fragment.style.left = bounds.left + "px";
            fragment.style.top = bounds.top + "px";
            fragment.style.width = bounds.width + "px";
            fragment.style.height = bounds.height + "px";
            fragment.style.clipPath = part.clipPath;
            fragment.style.transformOrigin = part.origin;
            fragment.setAttribute("aria-hidden", "true");
            const copy = source.cloneNode(true) as HTMLElement;
            copy.removeAttribute("aria-label");
            copy.style.width = "100%";
            copy.style.height = "100%";
            copy.style.display = "flex";
            fragment.append(copy);
            document.body.append(fragment);
            const animation = fragment.animate([
                { transform: "translate(0, 0) scale(1)", opacity: 1 },
                {
                    transform: "translate(0, 0) scale(3)",
                    opacity: .9,
                    offset: .32,
                },
                {
                    transform: part.end,
                    opacity: 0,
                },
            ], {
                duration,
                easing: "cubic-bezier(.2,.75,.25,1)",
                fill: "forwards",
            });

            return { fragment, animation };
        });
        void Promise.all(halves.map(({ animation }) =>
            Effects.animationFinished(animation, duration),
        )).then(() => {
            halves.forEach(({ fragment }) => fragment.remove());
        });
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

    public static createCardEffectIcons(card: CardDefinition): HTMLElement {
        const effects = document.createElement("span");
        effects.className = "fight-card-effects";
        Effects.appendCardEffectIcon(effects, "damage", card.damage);
        Effects.appendCardEffectIcon(effects, "block", card.block);
        Effects.appendCardEffectIcon(effects, "healing", card.healing);

        return effects;
    }

    public static createCardArtwork(card: CardDefinition): HTMLElement {
        if (card.origin !== null) {
            return OriginArtwork.create(
                card.itemName,
                card.origin,
                "fight-card-art",
            );
        }
        const artwork = document.createElement("div");
        artwork.className = "fight-card-art fight-card-art--empty";
        artwork.setAttribute("aria-hidden", "true");

        return artwork;
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
        return [
            Effects.createCardArtwork(card),
            Effects.textElement("strong", card.title),
            Effects.createCardEffectIcons(card),
        ];
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
