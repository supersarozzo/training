// Light and dark: plain functions with no screen code, so Node tests can run them (tests/theme.test.mjs).
// The Look choice (Auto / Light / Dark, prefs.js) is shown by `data-theme` on <html> (app.css has the three colour
// maps) and by the two `theme-color` tags in index.html (one per phone setting). boot.js repeats the same few lines
// before the first paint (it is a plain script and cannot import this file). docs/checks/2026-11-18-dark-mode.md.

// The bar colours = the page canvas of each look (app.css --bg-canvas), so the phone's top strip matches the page.
export const BAR_COLORS = Object.freeze({ light: "#f2f3f5", dark: "#08090c" });

// Light and Dark are fixed; Auto (or anything unknown) follows the phone.
export function isDark(choice, phoneDark) {
  if (choice === "dark") return true;
  if (choice === "light") return false;
  return phoneDark === true;
}

// doc: the page's document (or a fake one in tests). A fixed choice writes its colour into both tags; Auto gives each
// tag the colour of its own phone setting, so the browser follows the phone by itself, with no code running.
export function applyThemeTo(doc, choice) {
  const fixed = choice === "light" || choice === "dark" ? choice : null;
  const root = doc.documentElement;
  if (fixed) root.setAttribute("data-theme", fixed); else root.removeAttribute("data-theme");
  for (const meta of doc.querySelectorAll('meta[name="theme-color"]')) {
    const own = String(meta.getAttribute("media") || "").includes("dark") ? "dark" : "light";
    meta.setAttribute("content", BAR_COLORS[fixed || own]);
  }
}
