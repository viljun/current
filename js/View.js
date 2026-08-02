export class View {
    static getQuantityText(text, quantity) {
        if (quantity === 1) {
            const article = /^[aeiou]/i.test(text) ? "an" : "a";
            return article + " " + text;
        }
        const plural = ["hay", "iron"].includes(text) ? text : text + "s";
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
        messageBox.append(message);
        const br = document.createElement("br");
        messageBox.append(br);
    }
    static setMessage(messageBox, message) {
        messageBox.innerHTML = "";
        View.appendMessage(messageBox, message);
    }
}
