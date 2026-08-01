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
            const text = document.createElement("div");
            text.className = "effect-change effect-change--" + (quantity > 0 ? "positive" : "negative");
            if (type === "rare" && quantity > 0) {
                text.classList.add("effect-change--rare");
            }
            text.textContent = (quantity > 0 ? "+" : "") + quantity + " " + name;
            text.style.left = origin.x + "px";
            text.style.top = origin.y + "px";
            text.setAttribute("aria-hidden", "true");
            document.body.append(text);
            const angleRange = visibleChanges.length === 1 ? 0 : 240;
            const angleDegrees = visibleChanges.length === 1
                ? -90
                : -210 + angleRange * index / (visibleChanges.length - 1);
            const angle = angleDegrees * Math.PI / 180;
            const distance = reducedMotion ? 25 : 75 + (index % 2) * 25;
            const destinationX = Math.cos(angle) * distance;
            const destinationY = Math.sin(angle) * distance - 20;
            const rotation = reducedMotion ? 0 : -8 + (index % 3) * 8;
            const animation = text.animate([
                {
                    transform: "translate(-50%, -50%) scale(0.45)",
                    opacity: 0,
                },
                {
                    transform: "translate(-50%, -50%) scale(1.25)",
                    opacity: 1,
                    offset: 0.22,
                },
                {
                    transform: "translate(calc(-50% + " + destinationX + "px), calc(-50% + "
                        + destinationY + "px)) scale(1.05) rotate(" + rotation + "deg)",
                    opacity: 1,
                    offset: 0.68,
                },
                {
                    transform: "translate(calc(-50% + " + destinationX * 1.2 + "px), calc(-50% + "
                        + destinationY * 1.2 + "px)) scale(1.4) rotate(" + rotation + "deg)",
                    opacity: 0,
                },
            ], {
                duration: reducedMotion ? 650 : 1150,
                easing: "cubic-bezier(.2,.75,.2,1)",
                fill: "forwards",
            });
            animation.addEventListener("finish", () => text.remove());
            animation.addEventListener("cancel", () => text.remove());
            window.setTimeout(() => text.remove(), 1300);
        });
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
