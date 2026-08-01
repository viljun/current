export class Effects {
    static initialize(soundSwitch) {
        try {
            Effects.soundEnabled = localStorage.getItem(Effects.SOUND_STORAGE_KEY) === "true";
        }
        catch (_a) {
            Effects.soundEnabled = false;
        }
        soundSwitch.checked = Effects.soundEnabled;
        soundSwitch.addEventListener("change", () => {
            Effects.soundEnabled = soundSwitch.checked;
            try {
                localStorage.setItem(Effects.SOUND_STORAGE_KEY, String(Effects.soundEnabled));
            }
            catch (_a) {
                // Effects preferences must never interrupt gameplay.
            }
        });
    }
    // Starts optional presentation and returns immediately. Gameplay never waits for effects.
    static playItemAction(result, sourceElement) {
        try {
            const type = Effects.getType(result.itemType.name);
            Effects.showChanges(result, sourceElement, type);
            Effects.playSound(type);
            Effects.vibrate(type);
        }
        catch (error) {
            console.warn("Unable to play item effect.", error);
        }
    }
    // Captures all DOM positions synchronously, then lets the turn effects finish independently.
    static playFightTurn(resolution, cardElements, monsterHealthElement, playerHealthElement) {
        try {
            const monsterBounds = monsterHealthElement === null || monsterHealthElement === void 0 ? void 0 : monsterHealthElement.getBoundingClientRect();
            const playerBounds = playerHealthElement === null || playerHealthElement === void 0 ? void 0 : playerHealthElement.getBoundingClientRect();
            const monsterTarget = Effects.centerOf(monsterBounds);
            const playerTarget = Effects.centerOf(playerBounds);
            resolution.cards.forEach((card, index) => {
                const cardElement = cardElements[index];
                const sourceBounds = cardElement === null || cardElement === void 0 ? void 0 : cardElement.getBoundingClientRect();
                const target = card.damage > 0 ? monsterTarget : playerTarget;
                if (sourceBounds !== undefined && target !== null && cardElement != null) {
                    Effects.animateCard(sourceBounds, target, cardElement);
                }
            });
            if (monsterTarget !== null && resolution.monsterDamage > 0) {
                Effects.floatText("-" + resolution.monsterDamage, "effect-change effect-change--negative effect-change--fight", monsterTarget, { x: 0, y: -55 }, 0, 150);
            }
            if (monsterTarget !== null && resolution.monsterHealing > 0) {
                Effects.floatText("+" + resolution.monsterHealing, "effect-change effect-change--positive effect-change--fight", monsterTarget, { x: -35, y: -50 }, -5, 600);
            }
            if (monsterTarget !== null && resolution.monsterBlock > 0) {
                Effects.floatText("+" + resolution.monsterBlock + " block", "effect-change effect-change--block effect-change--fight", monsterTarget, { x: 40, y: -45 }, 5, 600);
            }
            if (playerTarget !== null && resolution.healing > 0) {
                Effects.floatText("+" + resolution.healing, "effect-change effect-change--positive effect-change--fight", playerTarget, { x: -35, y: -50 }, -5, 150);
            }
            if (playerTarget !== null && resolution.block > 0) {
                Effects.floatText("+" + resolution.block + " block", "effect-change effect-change--block effect-change--fight", playerTarget, { x: 40, y: -45 }, 5, 150);
            }
            if (playerTarget !== null && resolution.playerDamage > 0) {
                Effects.floatText("-" + resolution.playerDamage, "effect-change effect-change--negative effect-change--fight", playerTarget, { x: 0, y: -60 }, 0, 600);
            }
            Effects.playSound("combat");
            Effects.vibrate("combat");
        }
        catch (error) {
            console.warn("Unable to play fight effect.", error);
        }
    }
    // Deals the rendered hand from the visible deck without blocking the battle.
    static dealFightCards(deckElement, cardElements) {
        try {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }
            cardElements.forEach(card => card.style.opacity = "0");
            window.requestAnimationFrame(() => {
                var _a;
                const firstCard = (_a = cardElements[0]) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
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
                    window.setTimeout(finish, 1050 + index * 90);
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
        }
        catch (error) {
            console.warn("Unable to deal fight cards.", error);
        }
    }
    // Captures the current hand, then sweeps its clones away after the final attacks land.
    static sweepFightCards(cardElements) {
        try {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }
            cardElements.forEach((card, index) => {
                const bounds = card.getBoundingClientRect();
                const clone = card.cloneNode(true);
                clone.classList.add("effect-fight-card");
                clone.style.left = bounds.left + "px";
                clone.style.top = bounds.top + "px";
                clone.style.width = bounds.width + "px";
                clone.style.height = bounds.height + "px";
                clone.setAttribute("aria-hidden", "true");
                document.body.append(clone);
                const direction = index % 2 === 0 ? -1 : 1;
                const animation = clone.animate([
                    { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
                    { transform: "translate(" + direction * (window.innerWidth + bounds.width) + "px, 5rem) rotate(" + direction * 35 + "deg)", opacity: 0 },
                ], {
                    delay: 380 + index * 45,
                    duration: 650,
                    easing: "cubic-bezier(.55,.05,.8,.25)",
                    fill: "forwards",
                });
                animation.addEventListener("finish", () => clone.remove());
                animation.addEventListener("cancel", () => clone.remove());
                window.setTimeout(() => clone.remove(), 1300);
            });
        }
        catch (error) {
            console.warn("Unable to sweep fight cards.", error);
        }
    }
    static getType(itemName) {
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
    static showChanges(result, sourceElement, type) {
        var _a;
        const changes = new Map();
        changes.set(result.itemType.name, 1);
        for (const change of [...result.expenses, ...result.prizes]) {
            changes.set(change.itemType.name, ((_a = changes.get(change.itemType.name)) !== null && _a !== void 0 ? _a : 0) + change.quantity);
        }
        const visibleChanges = [...changes.entries()].filter(([, quantity]) => quantity !== 0);
        const sourceBounds = sourceElement === null || sourceElement === void 0 ? void 0 : sourceElement.getBoundingClientRect();
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
            Effects.floatText((quantity > 0 ? "+" : "") + quantity + " " + name, className, origin, { x: destinationX, y: destinationY }, rotation);
        });
    }
    static floatText(content, className, origin, destination, rotation, delay = 0) {
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
        const duration = reducedMotion ? 650 : 1150;
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
    static animateCard(source, target, sourceElement) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const clone = sourceElement.cloneNode(true);
        clone.classList.add("effect-fight-card");
        clone.style.left = source.left + "px";
        clone.style.top = source.top + "px";
        clone.style.width = source.width + "px";
        clone.style.height = source.height + "px";
        clone.setAttribute("aria-hidden", "true");
        document.body.append(clone);
        const x = target.x - (source.left + source.width / 2);
        const y = target.y - (source.top + source.height / 2);
        const animation = clone.animate([
            { transform: "translate(0, 0) scale(1)", opacity: 0.9 },
            { transform: "translate(" + x + "px, " + y + "px) scale(0.2)", opacity: 0 },
        ], {
            duration: 500,
            easing: "cubic-bezier(.25,.8,.25,1)",
            fill: "forwards",
        });
        animation.addEventListener("finish", () => clone.remove());
        animation.addEventListener("cancel", () => clone.remove());
        window.setTimeout(() => clone.remove(), 650);
    }
    static centerOf(bounds) {
        if (bounds === undefined) {
            return null;
        }
        return {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
        };
    }
    static playSound(type) {
        var _a;
        if (!Effects.soundEnabled || !("AudioContext" in window)) {
            return;
        }
        const context = (_a = Effects.audioContext) !== null && _a !== void 0 ? _a : new AudioContext();
        Effects.audioContext = context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const frequencies = {
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
    static vibrate(type) {
        var _a;
        const patterns = {
            collect: 20,
            craft: [20, 30, 20],
            combat: [40, 30, 60],
            rare: [20, 40, 20, 40, 60],
        };
        (_a = navigator.vibrate) === null || _a === void 0 ? void 0 : _a.call(navigator, patterns[type]);
    }
}
Effects.SOUND_STORAGE_KEY = "gpsgame.soundEnabled";
Effects.COMBAT_ITEMS = new Set(["rat", "orc", "troll"]);
Effects.CRAFT_ITEMS = new Set([
    "body shop",
    "club",
    "iron",
    "nature shop",
    "smelter",
    "stone axe",
    "sword",
    "weapon shop",
]);
Effects.RARE_ITEMS = new Set([
    "chest",
    "dungeon entrance",
    "treasure",
]);
Effects.soundEnabled = false;
Effects.audioContext = null;
