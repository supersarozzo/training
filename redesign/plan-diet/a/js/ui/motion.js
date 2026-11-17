// Motion helpers. CSS and the Web Animations API only; transform and opacity only, so it stays smooth.
// Every helper does nothing when the phone asks for less motion (Settings > Accessibility > Motion > Reduce Motion)
// or when the app's own Settings > Animations is off (device only, <html data-motion="off">, builder D's system).
export function reduced() {
  try {
    if (document.documentElement.dataset.motion === "off") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch { return true; }
}

// A small "pop" on a number that just changed (stepper values, counters).
export function bump(el) {
  if (!el || reduced() || !el.animate) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 220, easing: "cubic-bezier(.34,1.4,.64,1)" });
}

// Count a number up from 0 when it first shows (Finish and Progress tiles). The final text is set at once for screen readers.
export function countUp(el, to, { decimals = 0, ms = 700 } = {}) {
  if (!el) return;
  const final = decimals ? to.toFixed(decimals) : String(Math.round(to));
  el.textContent = final;
  if (reduced() || !Number.isFinite(to) || to === 0) return;
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    const eased = 1 - (1 - k) ** 3;
    el.textContent = k < 1 ? (to * eased).toFixed(decimals) : final;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Draw an SVG line in from left to right (charts), once it is on the page.
export function drawIn(path, ms = 900) {
  if (!path || reduced() || !path.animate) return;
  requestAnimationFrame(() => {
    let len = 0;
    try { len = path.getTotalLength(); } catch { return; }
    if (!len) return;
    path.style.strokeDasharray = String(len);
    const a = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: ms, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    a.onfinish = () => { path.style.strokeDasharray = ""; a.cancel(); };
  });
}

// Fade and lift a list of elements in, one after the other.
export function stagger(els, { step = 45, ms = 360 } = {}) {
  if (reduced()) return;
  [...els].forEach((el, i) => {
    if (!el.animate) return;
    el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: ms, delay: i * step, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
  });
}

// Run `fn` once the element is on the page (after the router has mounted the screen).
export function onMount(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}
