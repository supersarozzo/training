// A very small pretend page (document, Node) so a test can build a button with h() and tap it.
// Only what parts.js lockedButton / mainButton / icon need. Not a browser: no layout, no styles.
class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.className = "";
    this.disabled = false;
    this.textContent = "";
    const names = new Set();
    this.classList = {
      add: (...c) => c.forEach((x) => names.add(x)),
      remove: (...c) => c.forEach((x) => names.delete(x)),
      contains: (x) => names.has(x),
      toggle: (x) => (names.has(x) ? (names.delete(x), false) : (names.add(x), true)),
    };
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  append(...kids) { this.childNodes.push(...kids); }
  replaceChildren(...kids) { this.childNodes = [...kids]; }
  // A tap. Unlike a real page, an error thrown by a handler reaches the caller (a real page sends it to window "error").
  click() { if (this.disabled) return; for (const fn of this.listeners.click ?? []) fn({ type: "click", target: this }); }
}

export function installFakeDom() {
  globalThis.Node = FakeNode;
  globalThis.document = {
    createElement: (tag) => new FakeNode(tag),
    createElementNS: (_ns, tag) => new FakeNode(tag),
    createTextNode: (text) => Object.assign(new FakeNode("#text"), { textContent: String(text) }),
    documentElement: new FakeNode("html"),
    querySelectorAll: () => [],
    addEventListener: () => {},
    hidden: false,
  };
  globalThis.window ??= { addEventListener: () => {} };
}
