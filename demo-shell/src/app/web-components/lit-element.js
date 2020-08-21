import { LitElement, html } from 'lit-element';

class AdfLitElement extends LitElement {
    render() {
        return html` 
      <p>This is a LitElement Component</p>
      <button @click="${this._handleClick}"> ADF LitElement button </button>
    `;
    }

    _handleClick() {
        console.log('lit-element clicked');
    }
}

customElements.define('adf-lit-element', AdfLitElement); //
