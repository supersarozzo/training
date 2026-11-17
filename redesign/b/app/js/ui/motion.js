// Motion helpers (Web Animations API). transform and opacity only, so it stays smooth on an iPhone.
// Everything here does nothing when the phone asks for reduced motion.
export function reduced() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";

// Screen change. kind: "push" (forward, slides in from the right), "back", "up" (workout step), "fade" (tabs).
export function enterScreen(el, kind = "fade") {
  if (!el || reduced() || typeof el.animate !== "function") return;
  const from = {
    push: { transform: "translateX(28px)", opacity: 0 },
    back: { transform: "translateX(-28px)", opacity: 0 },
    up: { transform: "translateY(18px) scale(0.985)", opacity: 0 },
    fade: { transform: "translateY(6px)", opacity: 0 },
  }[kind] ?? { opacity: 0 };
  el.animate([from, { transform: "none", opacity: 1 }], { duration: kind === "fade" ? 260 : 380, easing: SPRING });
}

// A number that counts up to its value (metrics on Today, Progress, Finish, Weekly). The final text is
// always set at once for screen readers; only the shown digits move.
export function countUp(el, to, { decimals = 0, duration = 700 } = {}) {
  if (!el || !Number.isFinite(to)) return;
  const final = to.toFixed(decimals);
  el.textContent = final;
  if (reduced() || to === 0) return;
  const start = performance.now();
  const step = (t) => {
    if (!el.isConnected && t - start > 50) return;
    const k = Math.min(1, (t - start) / duration);
    const eased = 1 - (1 - k) ** 3;
    el.textContent = k >= 1 ? final : (to * eased).toFixed(decimals);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Draw a chart line from left to right (stroke dash), then fade the dots in.
export function drawIn(svg) {
  if (!svg || reduced()) return;
  requestAnimationFrame(() => {
    svg.querySelectorAll(".chart-line").forEach((path) => {
      let len = 0;
      try { len = path.getTotalLength(); } catch { return; }
      if (!len) return;
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      const a = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 900, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
      a.onfinish = () => { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; a.cancel(); };
    });
    svg.querySelectorAll(".chart-area").forEach((a) => a.animate([{ opacity: 0 }, { opacity: 0.1 }], { duration: 900, easing: "ease-out" }));
    svg.querySelectorAll(".chart-dot, .chart-dot-main, .chart-last").forEach((d, i) => d.animate([{ opacity: 0, transform: "scale(0.3)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 300 + Math.min(i * 12, 500), easing: SPRING, fill: "backwards" }));
  });
}

// A small "pop" on a tapped thing (steppers, picks).
export function pop(el, scale = 1.08) {
  if (!el || reduced() || typeof el.animate !== "function") return;
  el.animate([{ transform: "scale(1)" }, { transform: `scale(${scale})` }, { transform: "scale(1)" }], { duration: 260, easing: SPRING });
}

// Bars that grow from the left (week progress, progress lines).
export function growIn(els) {
  if (reduced()) return;
  els.forEach((el, i) => el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 420, delay: i * 25, easing: SPRING, fill: "backwards" }));
}
