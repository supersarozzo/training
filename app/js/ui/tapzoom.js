// No double-tap zoom (0.7.4; Rosario: "you need to disable double tap in the app so it doesnt zoom").
// The first line is the CSS `touch-action: manipulation` on every element (css/app.css, 0.7.1 P4). This is the second
// line, for an iPhone that still zooms: on a quick second tap (within 300 ms and 40 px of the first) the touchend is
// cancelled, so iOS does not zoom, and the click is replayed on the tapped element, so the tap still counts (a fast
// second + on a stepper). A single tap, a scroll, a pinch and every typing field (input, textarea, select, editable
// text: a double tap there selects a word) are left alone. Pinch zoom stays: the viewport has no maximum-scale.

export const DOUBLE_TAP_MS = 300;
export const DOUBLE_TAP_PX = 40;
const MOVE_PX = 10; // a finger that moved more than this was scrolling, not tapping

const ok = (n) => typeof n === "number" && Number.isFinite(n);

// prev and now: { t (ms), x, y }.
export function isDoubleTap(prev, now) {
  if (!prev || !now || ![prev.t, prev.x, prev.y, now.t, now.x, now.y].every(ok)) return false;
  const dt = now.t - prev.t;
  return dt >= 0 && dt <= DOUBLE_TAP_MS && Math.hypot(now.x - prev.x, now.y - prev.y) <= DOUBLE_TAP_PX;
}

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const EDITABLE = new Set(["", "true", "plaintext-only"]);
const up = (node) => node.parentElement ?? null;

// Is the tap inside a typing field? A text node counts as its element.
export function isTypingTarget(node) {
  let n = node && node.nodeType === 3 ? up(node) : node;
  for (let depth = 0; n && depth < 50; depth++, n = up(n)) {
    if (TYPING_TAGS.has(String(n.tagName).toUpperCase())) return true;
    if (n.isContentEditable === true) return true;
    const ce = typeof n.getAttribute === "function" ? n.getAttribute("contenteditable") : null;
    if (ce !== null) return EDITABLE.has(String(ce).toLowerCase());
  }
  return false;
}

// A disabled button (or one inside a disabled fieldset-like parent) gets no replayed click, as with a real tap.
function inDisabled(node) {
  for (let n = node, depth = 0; n && depth < 50; depth++, n = up(n)) if (n.disabled === true) return true;
  return false;
}

export function guardDoubleTap(doc = document) {
  let start = null; // where the current single-finger touch began
  let prev = null; // the last tap: { t, x, y }
  doc.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) { start = null; prev = null; return; } // a pinch: never ours
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  doc.addEventListener("touchend", (e) => {
    const began = start;
    start = null;
    if (!began || (e.touches && e.touches.length > 0) || !e.changedTouches || e.changedTouches.length !== 1) { prev = null; return; }
    const p = e.changedTouches[0];
    const now = { t: e.timeStamp, x: p.clientX, y: p.clientY };
    if (Math.hypot(now.x - began.x, now.y - began.y) > MOVE_PX) { prev = null; return; } // a scroll
    if (isTypingTarget(e.target)) { prev = null; return; }
    const second = isDoubleTap(prev, now);
    prev = now;
    if (!second) return;
    if (e.cancelable === false) return; // the phone's own click still comes: no second click from us (auditor)
    e.preventDefault(); // no zoom; this also stops the browser's own click for this tap...
    // No replay on a button that left the screen between finger down and up (the rest timer ended: checker).
    if (!inDisabled(e.target) && e.target.isConnected !== false && typeof e.target.dispatchEvent === "function") {
      // ...so the tap is replayed: one click on the tapped element, bubbling to its handler like a real one.
      e.target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: now.x, clientY: now.y, view: globalThis.window ?? null }));
    }
  }, { passive: false });
}
