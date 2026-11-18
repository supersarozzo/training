// A richer fake page for driving the food sheet (openCheck) in Node: querySelector, input events, isConnected.
// From the 0.7.4 checker's probe (worker 8.41 review, 2026-11-18). Test helper only; never loaded by the app.
class N {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.childNodes = []; this.attributes = {}; this.dataset = {}; this.listeners = {}; this.className = ""; this.disabled = false; this._text = ""; this.parent = null; this.style = {}; this.value = ""; }
  get textContent() { return this.tagName === "#TEXT" ? this._text : (this.childNodes.length ? this.childNodes.map((c) => c.textContent).join("") : this._text); }
  set textContent(t) { this.childNodes.forEach((c) => (c.parent = null)); this.childNodes = []; this._text = String(t); }
  get classList() { const s = () => new Set(this.className.split(/\s+/).filter(Boolean)); return { contains: (x) => s().has(x), add: (...c) => { const q = s(); c.forEach((x) => q.add(x)); this.className = [...q].join(" "); }, remove: (...c) => { const q = s(); c.forEach((x) => q.delete(x)); this.className = [...q].join(" "); }, toggle: () => {} }; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); }
  removeEventListener() {}
  append(...k) { for (const c of k) { if (c.parent) c.remove(); c.parent = this; this.childNodes.push(c); } }
  replaceChildren(...k) { this.childNodes.forEach((c) => (c.parent = null)); this.childNodes = []; this._text = ""; this.append(...k); }
  remove() { if (this.parent) { this.parent.childNodes = this.parent.childNodes.filter((c) => c !== this); this.parent = null; } }
  get isConnected() { let n = this; while (n) { if (n === globalThis.document.body) return true; n = n.parent; } return false; }
  *walk() { for (const c of this.childNodes) { yield c; yield* c.walk(); } }
  matches(sel) {
    if (sel.startsWith(".")) return this.classList.contains(sel.slice(1));
    const m = sel.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
    if (m) { if (m[1].startsWith("data-")) { const k = m[1].slice(5); return k in this.dataset; } return m[2] === undefined ? m[1] in this.attributes : this.attributes[m[1]] === m[2]; }
    return this.tagName === sel.toUpperCase();
  }
  querySelectorAll(sel) { const parts = sel.split(",").map((s) => s.trim()); return [...this.walk()].filter((n) => parts.some((p) => n.matches(p))); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  click() { if (this.disabled) return; for (const fn of this.listeners.click ?? []) fn({ type: "click", target: this }); }
  input(v) { this.value = v; for (const fn of this.listeners.input ?? []) fn({ type: "input", target: this }); }
  focus() {} blur() {}
}
export function install() {
  globalThis.Node = N;
  const body = new N("body");
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  globalThis.window = { localStorage: globalThis.localStorage, addEventListener() {}, matchMedia: () => ({ matches: true }) };
  globalThis.matchMedia = globalThis.window.matchMedia;
  globalThis.location = { hash: "#/diet" };
  globalThis.document = { body, createElement: (t) => new N(t), createElementNS: (_n, t) => new N(t), createTextNode: (t) => Object.assign(new N("#text"), { _text: String(t) }), documentElement: new N("html"), querySelectorAll: (s) => body.querySelectorAll(s), querySelector: (s) => body.querySelector(s), addEventListener() {}, hidden: false };
  return { body, mem };
}
export const byText = (root, tag, text) => root.querySelectorAll(tag).find((n) => n.textContent.includes(text));
