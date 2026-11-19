// Version 0.7.7 (worker 8.44): built-in UK foods in the Diet search (Rosario, answer 97: "add"; answers 104 a and 105 a,
// 2026-11-18). Source: McCance and Widdowson's Composition of Foods Integrated Dataset 2021 (CoFID), Public Health
// England, Open Government Licence v3.0. Research: docs/research/2026-11-18-uk-food-tables.md.
// - app/data/uk-foods.json is made by tests/tools/build-uk-foods.py from the gov.uk Excel file (plain foods only):
//   1,395 foods, about 82 KB. It ships with the app (in the sw.js FILES list), so it works with no signal.
// - While you type, "Common UK foods (built in, work offline)" shows under Your foods: up to 8 rows, then "Show all N".
//   Every typed word must match the start of a word in the name, in any order; names that start with the first word
//   come first, then shorter names.
// - A tap opens the food sheet like a saved food; saving keeps it in Your foods with the id fu-<code> (one record on
//   every phone, like a barcode food) and the source "uk". The synced file format does not change.
// - The licence credit line on the search sheet, the UK food sheet and the foot of the Diet tab. No new network address;
//   the CSP is unchanged.
// Written BEFORE the build (most fail until it). Food numbers come from the tables; no body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { install, byText } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.requestAnimationFrame = () => 0;
globalThis.window.navigator = { standalone: true, onLine: true };
Object.assign(globalThis.location, { hostname: "localhost", search: "?date=2026-11-18", hash: "#/diet" });
if (!Object.getOwnPropertyDescriptor(globalThis.Node.prototype, "firstChild")) {
  Object.defineProperty(globalThis.Node.prototype, "firstChild", { get() { return this.childNodes[0] ?? null; } });
}
const DATA_PATH = new URL("../app/data/uk-foods.json", import.meta.url);
const raw = existsSync(DATA_PATH) ? readFileSync(DATA_PATH) : Buffer.from("{}");
const data = JSON.parse(raw.toString("utf8"));
// The page reads the list as a JSON module (no fetch call); any fetch here would be a network call, so it fails loudly.
const fetched = [];
globalThis.fetch = async (url) => { fetched.push(String(url)); throw new Error(`no network in this test: ${url}`); };

const UK = await import("../app/js/food/ukfoods.js").catch(() => ({}));
await import("../app/js/ui/app.js");
const S = await import("../app/js/diet/sheets.js");
const { food: fm, foodStore } = await import("../app/js/diet/foodapp.js");
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 10)); };
const sheetNow = () => body.querySelectorAll("[data-sheet]").at(-1);
const closeAll = () => { for (const s of body.querySelectorAll("[data-sheet]")) s.remove(); };
const CREDIT = "Contains public sector information licensed under the Open Government Licence v3.0.";

// ---------- the data file ----------

test("UK-1 the data file: its source, licence and credit, 1,395 foods of 6 values, made by the rebuild script", () => {
  assert.equal(data.source, "McCance and Widdowson's Composition of Foods Integrated Dataset 2021, Public Health England");
  assert.equal(data.licence, "OGL-3.0");
  assert.equal(data.credit, CREDIT);
  assert.equal(data.version, "CoFID 2021");
  assert.deepEqual(data.fields, ["code", "name", "kcal", "protein_g", "carbs_g", "fat_g"]);
  assert.equal(data.foods.length, 1395);
  assert.ok(raw.length < 500 * 1024, `${raw.length} bytes, under 500 KB`);
  // The file is exactly what tests/tools/build-uk-foods.py makes from the gov.uk file (sha256 recorded in the script run).
  assert.equal(createHash("sha256").update(raw).digest("hex"), "c34fc8b174e46c1656d90e2670efdcd85feac2740841f10780357a60b70807ce");
  assert.ok(existsSync(new URL("./tools/build-uk-foods.py", import.meta.url)), "the rebuild script is kept");
});

test("UK-2 every food: a code like 13-669b, a plain-text name up to 120 letters, kcal 0 to 900, macros 0 to 100 g", () => {
  const codes = new Set();
  for (const row of data.foods) {
    assert.equal(row.length, 6, JSON.stringify(row));
    const [code, name, kcal, p, c, f] = row;
    assert.match(code, /^\d{2}-\d{1,4}[a-h]?$/);
    assert.ok(!codes.has(code), `code ${code} once`);
    codes.add(code);
    assert.equal(typeof name, "string");
    assert.ok(name.length > 0 && name.length <= 120 && name === name.trim(), name);
    assert.doesNotMatch(name, /[\u0000-\u001f\u007f<>]/, name);
    assert.ok(Number.isInteger(kcal) && kcal >= 0 && kcal <= 900, `${name} kcal ${kcal}`);
    for (const x of [p, c, f]) assert.ok(Number.isFinite(x) && x >= 0 && x <= 100, `${name} ${x}`);
    assert.ok(p + c + f <= 101, `${name}: protein + carbs + fat ${p + c + f} (one food at 100.4 from rounding in the source)`);
  }
  const names = data.foods.map((r) => r[1].toLowerCase());
  assert.deepEqual(names, names.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), "sorted by name");
  // Plain foods only (answer 104 a): no dishes, takeaways, recipes, bone or skin weights, no alcohol.
  for (const n of data.foods.map((r) => r[1])) assert.doesNotMatch(n, /homemade|takeaway|weighed with|weighed as|in batter|\bbeer\b|\bwine\b(?! vinegar)|lager|whisky|vodka|\bgin\b/i, n);
  // Foods people log every day are there.
  for (const want of ["Bananas, flesh only", "Chicken, breast, grilled without skin, meat only", "Eggs, chicken, whole, boiled", "Porridge oats, unfortified",
    "Rice, white, long grain, boiled in unsalted water", "Milk, semi-skimmed, pasteurised, average", "Cheese, Cheddar, English"]) {
    assert.ok(data.foods.some((r) => r[1] === want), want);
  }
  assert.ok(codes.has("13-669") && codes.has("13-669b"), "the one code CoFID uses twice gets a letter");
});

// ---------- parsing and search ----------

test("UK-3 parseUkFoods: the rows become foods with per-100 g numbers; bad rows are left out, never guessed", () => {
  const list = UK.parseUkFoods(data);
  assert.equal(list.length, 1395);
  const chicken = list.find((x) => x.name === "Chicken, breast, grilled without skin, meat only");
  assert.deepEqual({ code: chicken.code, id: chicken.id, per100g: chicken.per100g }, { code: "18-323", id: "fu-18-323", per100g: { kcal: 148, protein_g: 32, carbs_g: 0, fat_g: 2.2 } });
  const junk = { foods: [["11-1", "Good food", 100, 1, 2, 3], ["11-2", "Too many kcal", 1000, 1, 2, 3], ["11-3", "Minus", 10, -1, 2, 3], ["11-4", "", 10, 1, 2, 3],
    ["11-5", "Short row", 10, 1], ["bad code!", "Odd code", 10, 1, 2, 3], ["11-6", "Text number", "10", 1, 2, 3], ["11-7", "x".repeat(121), 10, 1, 2, 3], null, "row", ["11-8", "NaN", NaN, 1, 2, 3]] };
  assert.deepEqual(UK.parseUkFoods(junk).map((x) => x.name), ["Good food"]);
  for (const bad of [null, undefined, "text", 3, [], {}, { foods: "no" }]) assert.deepEqual(UK.parseUkFoods(bad), []);
  assert.equal(UK.ukFoodId("13-669b"), "fu-13-669b");
});

test("UK-4 searchUk: every typed word matches the start of a word, any order; first-word matches first, then shorter names", () => {
  const list = UK.parseUkFoods(data);
  const names = (q, o) => UK.searchUk(list, q, o).rows.map((x) => x.name);
  assert.deepEqual(names("chick breast"), names("breast chicken"), "any order");
  assert.ok(names("chick breast").includes("Chicken, breast, grilled without skin, meat only"));
  assert.equal(UK.searchUk(list, "chick breast").total, 6);
  assert.deepEqual(names("hick"), [], "the start of a word only, never the middle");
  assert.deepEqual(names("CHICK, Breast!"), names("chick breast"), "case and signs do not matter");
  assert.deepEqual(names(""), []);
  assert.deepEqual(names("   "), []);
  const r = UK.searchUk(list, "chick");
  assert.equal(r.rows.length, 8, "at most 8 rows");
  assert.equal(r.total, 60);
  assert.equal(UK.searchUk(list, "chick", { limit: 100 }).rows.length, 60);
  const lens = r.rows.map((x) => x.name.length);
  assert.deepEqual(lens, lens.slice().sort((a, b) => a - b), "shorter names first");
  const egg = names("egg boiled");
  assert.ok(egg.indexOf("Eggs, chicken, whole, boiled") < egg.findIndex((n) => n.startsWith("Noodles")), "names that start with the first word come first");
  const ex = UK.searchUk(list, "chick breast", { exclude: new Set(["fu-18-323"]) });
  assert.equal(ex.total, 5, "a food already saved shows only under Your foods");
  assert.ok(!ex.rows.some((x) => x.id === "fu-18-323"));
});

// ---------- saving a UK food ----------

test("UK-5 saving a UK food: id fu-<code>, source uk, one record however often it is saved; the entry carries the numbers", () => {
  foodStore.save({ ...fm.doc(), foods: [], food_log: [] });
  const row = UK.parseUkFoods(data).find((x) => x.id === "fu-18-323");
  const first = fm.saveAndLog(UK.ukFields(row), { date: "2026-11-18", meal: "lunch", amount_g: 150 });
  assert.equal(first.food.id, "fu-18-323");
  assert.equal(first.food.source, "uk");
  assert.deepEqual(first.food.per100g, { kcal: 148, protein_g: 32, carbs_g: 0, fat_g: 2.2 });
  assert.equal(first.entry.food, "fu-18-323");
  assert.equal(first.entry.kcal, 222);
  assert.equal(first.entry.protein_g, 48);
  assert.equal(first.entry.source, "uk");
  fm.saveFood({ ...UK.ukFields(row), per100g: { kcal: 150, protein_g: 31, carbs_g: 0, fat_g: 2.5 } });
  const foods = fm.doc().foods.filter((f) => f.id === "fu-18-323");
  assert.equal(foods.length, 1, "one record");
  assert.equal(foods[0].per100g.kcal, 150, "you can change anything");
  assert.equal(foods[0].source, "uk", "still from the UK tables");
  const again = fm.logAgain("fu-18-323", { date: "2026-11-18", meal: "dinner" });
  assert.equal(again.source ?? again.entry?.source, "uk");
  // An id that only looks like one is never taken as given.
  const odd = fm.saveFood({ id: "fu-<b>", name: "Made-up odd id", per100g: { kcal: 10, protein_g: 1, carbs_g: 1, fat_g: 1 }, source: "uk" });
  assert.match(odd.id, /^fo-\d{8}-[a-z0-9]{6}$/);
  // Other sources still save as before.
  assert.equal(fm.saveFood({ name: "Made-up own food", per100g: { kcal: 10, protein_g: 1, carbs_g: 1, fat_g: 1 }, source: "magic" }).source, "own");
});

// ---------- the search sheet ----------

test("UK-6 the search sheet: the built-in group while typing, up to 8 rows, Show all, the credit line; Search still only on tap", async () => {
  closeAll();
  foodStore.save({ ...fm.doc(), foods: [], food_log: [] });
  fetched.length = 0;
  S.openSearch();
  await settle();
  const sheet = sheetNow();
  assert.ok(!sheet.textContent.includes("Common UK foods"), "an empty box shows no list of 1,395 foods");
  assert.ok(sheet.textContent.includes(CREDIT), "the licence credit line");
  sheet.querySelector("input").input("chick");
  await settle();
  const group = byText(sheet, "h3", "Common UK foods (built in, work offline)");
  assert.ok(group, "the built-in group");
  const rows = () => sheet.querySelectorAll("button").filter((b) => b.className.includes("fl") && b.textContent.includes("UK food tables"));
  assert.equal(rows().length, 8);
  assert.ok(rows()[0].textContent.includes("kcal / 100 g"));
  const all = sheet.querySelectorAll("button").find((b) => b.textContent === "Show all 60");
  assert.ok(all, "Show all 60");
  all.click();
  await settle();
  assert.equal(rows().length, 60);
  assert.deepEqual(fetched, [], "no network call: typing never searches online, and the list is the app's own file");
  const mineAt = sheet.textContent.indexOf("Your foods (work offline)");
  assert.ok(mineAt >= 0 && mineAt < sheet.textContent.indexOf("Common UK foods"), "Your foods first");
  closeAll();
});

test("UK-7 a tap opens the UK food sheet: heading, source line, amount first, credit; Save and add keeps it in Your foods", async () => {
  closeAll();
  foodStore.save({ ...fm.doc(), foods: [], food_log: [] });
  S.openSearch();
  await settle();
  sheetNow().querySelector("input").input("chick breast grilled without");
  await settle();
  const row = sheetNow().querySelectorAll("button").find((b) => b.textContent.includes("Chicken, breast, grilled without skin, meat only"));
  assert.ok(row);
  row.click();
  const uk = sheetNow();
  assert.equal(uk.querySelector("h2").textContent, "From the UK food tables");
  assert.ok(uk.textContent.includes("From the UK food tables. Numbers per 100 g, edible part. You can change anything."));
  assert.ok(!uk.textContent.includes("check before saving"), "no Open Food Facts warning");
  assert.ok(uk.textContent.includes(CREDIT));
  assert.ok(uk.textContent.indexOf("How much did you have?") < uk.textContent.indexOf("Food details"), "amount and Save first, details under");
  assert.ok(uk.querySelectorAll("button").some((b) => b.textContent === "Save without adding"));
  const save = uk.querySelectorAll("button").find((b) => b.textContent.startsWith("Save and add"));
  save.click();
  const saved = fm.doc().foods.find((f) => f.id === "fu-18-323");
  assert.ok(saved && saved.source === "uk", "kept in Your foods");
  assert.equal(fm.doc().food_log.filter((e) => e.food === "fu-18-323").length, 1, "and logged");
  closeAll();
  // Next time it shows under Your foods only.
  S.openSearch();
  await settle();
  sheetNow().querySelector("input").input("chick breast grilled without");
  await settle();
  const sheet = sheetNow();
  const hits = sheet.querySelectorAll("button").filter((b) => b.textContent.includes("Chicken, breast, grilled without skin, meat only"));
  assert.equal(hits.length, 1, "once, under Your foods");
  assert.ok(!hits[0].textContent.includes("UK food tables · ") && sheet.textContent.indexOf("Your foods (work offline)") < sheet.textContent.indexOf("Chicken, breast, grilled without"));
  hits[0].click();
  const mine = sheetNow();
  assert.equal(mine.querySelector("h2").textContent, "Your food");
  assert.ok(mine.textContent.includes(CREDIT), "a saved UK food keeps its credit line");
  closeAll();
});

test("UK-8 the list fails to load: one plain line; your foods and Search still work", async () => {
  closeAll();
  UK.setUkLoader(async () => { throw new TypeError("offline"); });
  S.openSearch();
  await settle();
  sheetNow().querySelector("input").input("chick");
  await settle();
  assert.ok(sheetNow().textContent.includes("The built-in UK foods did not load. Your foods and Search still work."));
  closeAll();
  UK.setUkLoader(null);
});

test("UK-9 the credit line at the foot of the Diet tab, with the licence link; Open Food Facts line kept", async () => {
  const { renderDiet } = await import("../app/js/diet/diet.js");
  const out = renderDiet();
  const root = Array.isArray(out) ? out[0] : out;
  assert.ok(root.textContent.includes(CREDIT));
  assert.ok(root.textContent.includes("Contains data from Open Food Facts"));
  const a = root.querySelectorAll("a").find((x) => x.textContent === "Open Government Licence v3.0");
  assert.equal(a.getAttribute("href"), "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/");
  assert.equal(a.getAttribute("rel"), "noopener noreferrer");
});

// ---------- the app files ----------

test("UK-10 the data file is in the sw.js FILES list; no new network address; the CSP is as in 0.7.6", () => {
  const sw = read("../app/sw.js");
  const files = [...sw.slice(sw.indexOf("const FILES"), sw.indexOf("];")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(files.includes("data/uk-foods.json"));
  const csp = read("../app/index.html").match(/Content-Security-Policy" content="([^"]+)"/)[1];
  assert.equal(csp, "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://api.github.com https://world.openfoodfacts.org; object-src 'none'; base-uri 'none'; form-action 'none'");
  const src = read("../app/js/food/ukfoods.js");
  assert.match(src, /import\(DATA_URL, \{ with: \{ type: "json" \} \}\)/, "read as a JSON module: data, never run");
  assert.doesNotMatch(src, /fetch\(/);
  assert.deepEqual([...src.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0]), ["https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"], "only the licence link, never fetched");
  for (const f of ["../app/js/food/ukfoods.js", "../app/js/diet/sheets.js", "../app/js/diet/diet.js"]) assert.doesNotMatch(read(f), /innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function/, f);
});

// ---------- review round 1 (checker): a saved UK food is never overwritten by the table row ----------

test("UK-11 a saved UK food you renamed: no table row for it, and the table row never overwrites your record", async () => {
  closeAll();
  foodStore.save({ ...fm.doc(), foods: [], food_log: [] });
  const row = UK.parseUkFoods(data).find((x) => x.id === "fu-18-323");
  fm.saveFood({ ...UK.ukFields(row), name: "Made-up my chicken", per100g: { kcal: 160, protein_g: 30, carbs_g: 0, fat_g: 4 }, serving_g: 120, serving_label: "piece" });
  const before = JSON.stringify(fm.doc().foods.find((f) => f.id === "fu-18-323"));
  S.openSearch();
  await settle();
  sheetNow().querySelector("input").input("grilled without");
  await settle();
  const sheet = sheetNow();
  assert.ok(!sheet.querySelectorAll("button").some((b) => b.textContent.includes("Chicken, breast, grilled without skin, meat only")),
    "a food already in Your foods (here renamed) is not offered again from the tables");
  closeAll();
  // Even if the table row is opened, the sheet opens your saved record, and saving keeps your name and piece weight.
  S.openCheck({ mode: "uk", food: row });
  const opened = sheetNow();
  assert.equal(opened.querySelector("h2").textContent, "Your food");
  opened.querySelectorAll("button").find((b) => b.textContent === "Save without adding").click();
  const after = fm.doc().foods.find((f) => f.id === "fu-18-323");
  assert.equal(after.name, "Made-up my chicken");
  assert.equal(after.per100g.kcal, 160);
  assert.equal(after.serving_g, 120);
  assert.equal(after.serving_label, "piece");
  assert.ok(JSON.parse(before).name === after.name);
  closeAll();
  // A deleted saved UK food is offered again from the tables.
  fm.removeFood("fu-18-323");
  S.openSearch();
  await settle();
  sheetNow().querySelector("input").input("grilled without");
  await settle();
  assert.ok(sheetNow().querySelectorAll("button").some((b) => b.textContent.includes("Chicken, breast, grilled without skin, meat only") && b.textContent.includes("UK food tables")));
  closeAll();
});

// ---------- review round 1 (auditor): plain words in the UK group ----------

test("UK-12 more than 100 matches: the button says 'Show the first 100 of N'; no match: one plain line; a saved UK food says where it came from", async () => {
  closeAll();
  foodStore.save({ ...fm.doc(), foods: [], food_log: [] });
  const list = UK.parseUkFoods(data);
  const big = UK.searchUk(list, "raw").total;
  assert.ok(big > 100, `${big} foods for "raw"`);
  S.openSearch();
  await settle();
  const sheet = sheetNow();
  sheet.querySelector("input").input("raw");
  await settle();
  assert.ok(sheet.querySelectorAll("button").some((b) => b.textContent === `Show the first 100 of ${big}`));
  assert.ok(!sheet.querySelectorAll("button").some((b) => b.textContent.startsWith("Show all")), "never 'Show all' when only 100 show");
  sheet.querySelector("input").input("zzqx");
  await settle();
  assert.ok(sheet.textContent.includes("No built-in UK food matches."));
  closeAll();
  const row = list.find((x) => x.id === "fu-18-323");
  fm.saveFood(UK.ukFields(row));
  S.openSearch();
  await settle();
  sheetNow().querySelector("input").input("chick breast grilled without");
  await settle();
  const hit = sheetNow().querySelectorAll("button").find((b) => b.textContent.includes("Chicken, breast, grilled without skin, meat only"));
  assert.ok(hit.textContent.includes("UK food tables"), "the saved row's small line says UK food tables");
  closeAll();
});
