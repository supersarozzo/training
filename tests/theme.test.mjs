// Light and dark mode (docs/checks/2026-11-18-dark-mode.md). The Look choice (Auto / Light / Dark) must reach every
// part of the screen: the page colours, the phone's own parts (keyboard, scroll bars, date wheel: the CSS
// `color-scheme` property), and the bar colour (`theme-color`), at start, after a change in Settings, and when the
// phone itself turns light or dark while Look is Auto. Ideas taken from SimpleHost (status-bar style "default", the
// bar colour = the page colour, `color-scheme` per look, no fade on a switch).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
// Loaded this way so each test reports on its own while app/js/theme.js does not exist yet (tests first).
const { BAR_COLORS = {}, isDark = () => { throw new Error("app/js/theme.js missing"); }, applyThemeTo = () => { throw new Error("app/js/theme.js missing"); } } =
  await import("../app/js/theme.js").catch(() => ({}));

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const css = read("app/css/app.css");
const html = read("app/index.html");

// ---------- small fakes ----------
function fakeDoc() {
  const attrs = {};
  const metas = [
    { media: "(prefers-color-scheme: light)", content: "#000000" },
    { media: "(prefers-color-scheme: dark)", content: "#000000" },
  ].map((m) => ({
    a: { name: "theme-color", media: m.media, content: m.content },
    getAttribute(k) { return this.a[k] ?? null; },
    setAttribute(k, v) { this.a[k] = String(v); },
  }));
  return {
    attrs, metas,
    documentElement: {
      setAttribute(k, v) { attrs[k] = String(v); },
      removeAttribute(k) { delete attrs[k]; },
      getAttribute(k) { return attrs[k] ?? null; },
    },
    querySelectorAll(sel) { return sel === 'meta[name="theme-color"]' ? metas : []; },
  };
}
const barColours = (doc) => doc.metas.map((m) => m.getAttribute("content"));

// The body of one CSS rule, found by its exact selector.
function block(selector, text = css) {
  const at = text.indexOf(`${selector} {`);
  assert.ok(at >= 0, `rule ${selector} is in app.css`);
  const start = text.indexOf("{", at) + 1;
  return text.slice(start, text.indexOf("}", start));
}
const decls = (body) => body.split(";").map((d) => d.replace(/\/\*[\s\S]*?\*\//g, "").trim()).filter(Boolean).sort();

// ---------- the CSS ----------
test("each colour map tells the phone which look it is (color-scheme property)", () => {
  assert.match(block(":root"), /color-scheme:\s*light\b/, "light map: color-scheme light");
  const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
  assert.match(block(':root:not([data-theme="light"])', media), /color-scheme:\s*dark\b/, "dark by phone: color-scheme dark");
  assert.match(block(':root[data-theme="dark"]'), /color-scheme:\s*dark\b/, "dark by choice: color-scheme dark");
});

test("the dark map by phone setting and the dark map by choice are the same (no drift)", () => {
  const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
  assert.deepEqual(decls(block(':root:not([data-theme="light"])', media)), decls(block(':root[data-theme="dark"]')));
});

test("a Light choice wins over a dark phone (the phone's dark map skips data-theme=light)", () => {
  assert.match(css, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{/);
});

test("a switch has no fade: transitions are off while the look changes", () => {
  assert.match(css, /html\.theme-switching \*[^{]*\{[^}]*transition:\s*none\s*!important/);
});

test("the bar colours are the page canvas colours of each look (the strip matches the page, like SimpleHost)", () => {
  const canvas = (body) => body.match(/--bg-canvas:\s*(#[0-9a-f]{6})/i)[1].toLowerCase();
  assert.equal(BAR_COLORS.light, canvas(block(":root")));
  assert.equal(BAR_COLORS.dark, canvas(block(':root[data-theme="dark"]')));
});

test("the 0.6.0 style files use the tokens only (no literal colour)", () => {
  for (const f of readdirSync(join(root, "app/css")).filter((n) => n !== "app.css")) {
    const text = read(`app/css/${f}`).replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(text, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, `${f} has a literal colour: use a token from app.css`);
  }
});

// ---------- the page head ----------
test("two theme-color tags, one per phone setting, with the bar colours", () => {
  const tags = [...html.matchAll(/<meta name="theme-color"[^>]*>/g)].map((m) => m[0]);
  assert.equal(tags.length, 2);
  assert.ok(tags.some((t) => t.includes('media="(prefers-color-scheme: light)"') && t.includes(`content="${BAR_COLORS.light}"`)), "light tag");
  assert.ok(tags.some((t) => t.includes('media="(prefers-color-scheme: dark)"') && t.includes(`content="${BAR_COLORS.dark}"`)), "dark tag");
});

test("head order: color-scheme meta and theme-color tags, then boot.js, then the styles", () => {
  assert.match(html, /<meta name="color-scheme" content="light dark">/);
  const lastTag = html.lastIndexOf('name="theme-color"');
  const boot = html.indexOf('src="js/boot.js"');
  const style = html.indexOf('href="css/app.css"');
  assert.ok(lastTag > 0 && lastTag < boot, "boot.js comes after the tags it changes");
  assert.ok(boot < style, "boot.js runs before the first paint");
});

test("status bar style is iOS's own strip (default), never black-translucent", () => {
  assert.match(html, /<meta name="apple-mobile-web-app-status-bar-style" content="default">/);
  assert.doesNotMatch(html, /black-translucent/);
});

test("the manifest fixes no bar colour (one colour cannot be right in both looks)", () => {
  const manifest = JSON.parse(read("app/manifest.webmanifest"));
  assert.equal("theme_color" in manifest, false);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
});

// ---------- the plain functions (app/js/theme.js) ----------
test("isDark: Light and Dark are fixed, Auto follows the phone", () => {
  assert.equal(isDark("dark", false), true);
  assert.equal(isDark("light", true), false);
  assert.equal(isDark("auto", true), true);
  assert.equal(isDark("auto", false), false);
  assert.equal(isDark("purple", true), true, "an unknown choice reads as Auto");
});

test("applyThemeTo: Dark on a light phone", () => {
  const doc = fakeDoc();
  applyThemeTo(doc, "dark");
  assert.equal(doc.documentElement.getAttribute("data-theme"), "dark");
  assert.deepEqual(barColours(doc), [BAR_COLORS.dark, BAR_COLORS.dark]);
});

test("applyThemeTo: Light on a dark phone", () => {
  const doc = fakeDoc();
  applyThemeTo(doc, "light");
  assert.equal(doc.documentElement.getAttribute("data-theme"), "light");
  assert.deepEqual(barColours(doc), [BAR_COLORS.light, BAR_COLORS.light]);
});

test("applyThemeTo: Auto removes the choice and gives each tag its own colour, so the bar follows the phone", () => {
  const doc = fakeDoc();
  applyThemeTo(doc, "dark");
  applyThemeTo(doc, "auto");
  assert.equal(doc.documentElement.getAttribute("data-theme"), null);
  assert.deepEqual(barColours(doc), [BAR_COLORS.light, BAR_COLORS.dark]);
  applyThemeTo(doc, "<b>neon</b>");
  assert.equal(doc.documentElement.getAttribute("data-theme"), null, "an unknown choice reads as Auto");
});

// ---------- boot.js (runs before the first paint) ----------
function runBoot(device, { broken = false } = {}) {
  const doc = fakeDoc();
  const localStorage = { getItem(k) { if (broken) throw new Error("blocked"); return k === "trn.device.v1" ? device : null; } };
  vm.runInNewContext(read("app/js/boot.js"), { document: doc, localStorage, JSON });
  return doc;
}

test("boot.js applies a saved Dark before the first paint, bar colour too", () => {
  const doc = runBoot(JSON.stringify({ theme: "dark", token: "boot-test-key-0001" }));
  assert.equal(doc.attrs["data-theme"], "dark");
  assert.deepEqual(barColours(doc), [BAR_COLORS.dark, BAR_COLORS.dark]);
  assert.equal(doc.attrs["data-motion"], "on");
});

test("boot.js applies a saved Light before the first paint, bar colour too", () => {
  const doc = runBoot(JSON.stringify({ theme: "light", motion_off: true }));
  assert.equal(doc.attrs["data-theme"], "light");
  assert.deepEqual(barColours(doc), [BAR_COLORS.light, BAR_COLORS.light]);
  assert.equal(doc.attrs["data-motion"], "off");
});

test("boot.js: Auto, nothing saved or blocked storage leave the phone in charge", () => {
  for (const doc of [runBoot(JSON.stringify({ theme: "auto" })), runBoot(null), runBoot("{bad json"), runBoot(null, { broken: true })]) {
    assert.equal(doc.attrs["data-theme"], undefined);
    assert.deepEqual(barColours(doc), ["#000000", "#000000"], "the tags in index.html are left as they are");
    assert.equal(doc.attrs["data-motion"], "on");
  }
});

test("boot.js uses the same bar colours as theme.js", () => {
  const hexes = new Set((read("app/js/boot.js").match(/#[0-9a-f]{6}\b/gi) ?? []).map((x) => x.toLowerCase()));
  assert.deepEqual([...hexes].sort(), [BAR_COLORS.dark, BAR_COLORS.light].sort());
});

// ---------- the running app ----------
test("the app listens for the phone turning light or dark (Auto keeps everything in step)", () => {
  const ui = read("app/js/ui/theme.js");
  assert.match(ui, /from "\.\.\/theme\.js"/);
  assert.match(ui, /matchMedia\?*\.?\("\(prefers-color-scheme: dark\)"\)/);
  assert.match(ui, /addEventListener\("change"/);
  assert.match(ui, /theme-switching/);
  assert.match(read("app/js/main.js"), /applyTheme\(\)/, "main.js applies the look at start");
});

test("the phone turning light or dark (Look = Auto) has no fade either (auditor m8)", () => {
  const ui = read("app/js/ui/theme.js");
  const watch = ui.slice(ui.indexOf("function watchPhone"), ui.indexOf("export function applyTheme"));
  const handler = watch.slice(watch.indexOf('addEventListener("change"'));
  assert.ok(handler.length > 0, "watchPhone has a change handler");
  assert.match(handler.slice(0, handler.indexOf("\n")), /withoutFade\(/, "the change handler applies the look through withoutFade");
  const setTheme = ui.slice(ui.indexOf("export function setTheme"), ui.indexOf("export function setMotionOff"));
  assert.match(setTheme, /withoutFade\(/, "a Settings switch uses the same no-fade helper");
  const helper = ui.slice(ui.indexOf("function withoutFade"));
  assert.match(helper, /classList\.add\("theme-switching"\)/);
  assert.match(helper, /requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => root\.classList\.remove\("theme-switching"\)\)\)/);
});

test("picking Auto / Light / Dark in Settings does not redraw the screen (no jump to the top)", () => {
  const settings = read("app/js/ui/settings.js");
  const look = settings.slice(settings.indexOf("function lookCard"), settings.indexOf("export function renderSettings"));
  const at = look.indexOf("choiceRow(THEMES");
  assert.ok(at >= 0, "the Look card has the Auto / Light / Dark row");
  const pickLine = look.slice(at, look.indexOf("\n", at));
  assert.doesNotMatch(pickLine, /rerender\(\)/);
});

test("no colour is written in the app's JavaScript except the bar colours", () => {
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p); else if (p.endsWith(".js")) files.push(p);
    }
  };
  walk("app/js");
  for (const f of files.filter((p) => p !== "app/js/theme.js" && p !== "app/js/boot.js")) {
    assert.doesNotMatch(read(f), /["'`]#[0-9a-f]{6}["'`]/i, `${f} sets a colour: use a CSS class and a token`);
  }
});
