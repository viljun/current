export class View {
    static getQuantityText(text, quantity) {
        const massNoun = [
            "bones",
            "dungeon moss",
            "grave dust",
            "iron",
            "iron ore",
            "spider silk",
        ].includes(text);
        const invariantPlural = massNoun || ["hay", "yarrow"].includes(text);
        if (quantity === 1) {
            if (massNoun) {
                return "some " + text;
            }
            const article = /^[aeiou]/i.test(text) ? "an" : "a";
            return article + " " + text;
        }
        let plural = text;
        if (!invariantPlural) {
            if (text.endsWith("knife")) {
                plural = text.slice(0, -5) + "knives";
            }
            else if (/[^aeiou]y$/i.test(text)) {
                plural = text.slice(0, -1) + "ies";
            }
            else if (/(?:s|x|z|ch|sh)$/i.test(text)) {
                plural = text + "es";
            }
            else {
                plural = text + "s";
            }
        }
        return quantity + " " + plural;
    }
    // Returns array of texts as a sentence.
    static arrayToText(texts) {
        let lastWord;
        if (texts.length > 1) {
            lastWord = " and " + texts.pop();
        }
        else {
            lastWord = "";
        }
        return texts.join(", ") + lastWord;
    }
    static appendMessage(messageBox, message) {
        if (typeof message !== "string") {
            messageBox.append(message);
            return;
        }
        const status = document.createElement("div");
        status.className = "message status-text";
        status.textContent = message;
        status.title = message;
        messageBox.append(status);
    }
    static setMessage(messageBox, message) {
        messageBox.replaceChildren();
        View.appendMessage(messageBox, message);
    }
}
