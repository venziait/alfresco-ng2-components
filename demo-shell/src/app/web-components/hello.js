class HelloWorld extends HTMLElement {
    constructor() {
        super();
        this._text = null;

        const shadow = this.attachShadow({ mode: "open" });
        const wrapper = document.createElement("div");

        const info = document.createElement("span");
        info.textContent = "hello world";
        this._info = info;

        shadow.appendChild(wrapper);
        wrapper.appendChild(info);
    }

    static get observedAttributes() {
        return ["text"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // name will always be "country" due to observedAttributes
        this._text = newValue;
        this._info.textContent = newValue;
        this._updateRendering();
    }
    connectedCallback() {
        this._updateRendering();
    }

    get text() {
        return this._text;
    }
    set text(v) {
        this.setAttribute("text", v);
    }

    _updateRendering() {
        // Left as an exercise for the reader. But, you'll probably want to
        // check this.ownerDocument.defaultView to see if we've been
        // inserted into a document with a browsing context, and avoid
        // doing any work if not.
    }
}

customElements.define("hello-world", HelloWorld);
