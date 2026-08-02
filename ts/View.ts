export class View {
    static getQuantityText(text: string, quantity: number) {
        if (quantity === 1) {
            const article = /^[aeiou]/i.test(text) ? "an" : "a";

            return article + " " + text;
        }

        return quantity + " " + text + "s";
    }

    // Returns array of texts as a sentence.
    static arrayToText(texts: string[]): string  {
        let lastWord: string;
        if (texts.length > 1) {
            lastWord = " and " + texts.pop();
        } else {
            lastWord = "";
        }

        return texts.join(", ") + lastWord;
    }

    static appendMessage(messageBox: HTMLDivElement, message: string | HTMLDivElement) {
        messageBox.append(message);
        const br = document.createElement("br");
        messageBox.append(br);
    }

    static setMessage(messageBox: HTMLDivElement, message: string | HTMLDivElement) {
        messageBox.innerHTML = "";
        View.appendMessage(messageBox, message);
    }
}
