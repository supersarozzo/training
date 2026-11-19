# Built-in UK food list from the UK food tables (CoFID)

Date: 2026-11-18. Worker 8.44 (phase 1, research only). Asked by Rosario in the master chat (answer "97 yes", relayed by the Training Agent): app 0.7.7 gets a built-in list of plain UK foods (rice, banana, chicken breast, boiled egg...) that Diet search finds offline.

Status: research done (2026-11-18); list made and built into app 0.7.7 by worker 8.44 (2026-11-19). Built as designed below, with these changes: the list is read as a JSON module (no fetch), "Show all" shows at most 100 rows, "Your foods" also match words in any order, and the credit line also shows on a saved UK food. DESIGN.md section 15.11 is the rule now. Mock-up: https://claude.ai/artifact/Y2WQ8xGZS7EntFb9QrsmfV

## 1. The source (official, read 2026-11-18)

| What | Value |
|---|---|
| Name | McCance and Widdowson's The Composition of Foods Integrated Dataset 2021 ("CoFID") |
| Page | https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid (read 2026-11-18) |
| Publisher on the page | Public Health England (published 25 March 2015, last updated 19 March 2021) |
| Data file | "McCance and Widdowson's composition of foods integrated dataset", Excel, 4.42 MB: https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx |
| User guide | PDF, 759 KB, 37 pages: https://assets.publishing.service.gov.uk/media/60538e66d3bf7f03249bac58/McCance_and_Widdowsons_Composition_of_Foods_integrated_dataset_2021.pdf (read 2026-11-18) |
| Also on the page | "composition of foods: old foods", Excel, 634 KB (foods no longer in the main set: not used) |

What the user guide says (read 2026-11-18, its own words in quotes):
- Sheets of the workbook include "Factors", "Proximates", "Inorganics", "Vitamins" and fatty acid sheets. Each sheet has "column headings in rows 1 to 3", then one row per food, and the same food code sits on the same row in every sheet.
- Numbers: "Nutrient values are expressed per 100g of the food except in the case of alcoholic beverages which are presented per 100ml." A trace is written "Tr"; "N" means present but no reliable number.
- Columns the app needs (codes from the guide): food code, `NAME` (food name), `DESC`, `GROUP` (a 1 to 3 letter food group code, list in its Appendix B), `PROT` (protein g), `FAT` (fat g), `CHO` (available carbohydrate g), `KCALS` (energy kcal: "protein 4 kcal/g, fat 9 kcal/g, carbohydrate ... 3.75 kcal/g and alcohol 7 kcal/g"). `EDPOR` (edible part) is on the Factors sheet: values are for the edible part (no peel, stones, bones).
- The guide ends with "© Crown copyright 2021".

## 2. Licence: Open Government Licence v3.0

- The gov.uk page says: "All content is available under the Open Government Licence v3.0, except where otherwise stated". Nothing on the CoFID page states otherwise.
- The licence text (read 2026-11-18 from the SPDX copy, https://spdx.org/licenses/OGL-UK-3.0.html, because the National Archives page https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/ answered "403 Forbidden" to my reader): you are free to "copy, publish, distribute and transmit the Information", "adapt the Information" and "exploit the Information commercially and non-commercially". **So bundling a subset inside the app (a public GitHub repo and GitHub Pages) is allowed.**
- Condition: acknowledge the source with the provider's attribution statement, or else the fallback: "Contains public sector information licensed under the Open Government Licence v3.0.", and where possible link to the licence. The CoFID page gives no own statement, so the fallback is used, plus the dataset name (National Archives guidance: name the owner and the date).
- Not allowed: suggesting "official status" or that the provider endorses the app. So no government logo, and no words like "approved by the NHS".
- Exemptions that matter here: logos and crests (we use none); "third party rights the Information Provider is not authorised to license": the guide lists outside sources (USDA tables, industry data) for some foods. The gov.uk page puts the whole dataset under the OGL; this is a small, accepted risk (noted in Not verified).

**Credit line for the app** (proposed, like the Open Food Facts line, DESIGN.md 15.10):
"Contains public sector information licensed under the Open Government Licence v3.0. Common foods: McCance and Widdowson's Composition of Foods Integrated Dataset 2021, Public Health England." The words "Open Government Licence v3.0" link to the licence. Shown on the search sheet, on the sheet of a built-in food, and at the foot of the Diet tab.

## 3. Size and the subset

- The full workbook is 4.42 MB with about 30 columns per sheet; the app needs 6 values per food (code, name, kcal, protein, carbs, fat).
- Estimate per food in a compact JSON row, for example `[11xxx,"Rice, white, basmati, boiled in unsalted water",141,2.8,31.1,0.4]`: about 70 to 100 bytes.
- **Real numbers (measured 2026-11-18 from the downloaded file):** the sheet "1.3 Proximates" holds **2,887 foods**. The plain-food subset (Rosario, answer 104 a) has **1,395 foods** and the JSON file is **84,275 bytes (82 KB)** (first run 1,396 / 84,341 bytes; on 2026-11-19 porridge oats were added from the mixed group A and 3 "weighed as whole fruit" rows left out), far under the 500 KB limit. This is more than the earlier guess of "about 800 to 1,200": the guess was mine, made before the download; the rule (plain foods only) decides. The master confirmed on 2026-11-18: keep all that the rule gives.
- **How the subset is made:** `tests/tools/build-uk-foods.py` (standard library only, run as `python -I build-uk-foods.py <cofid2021.xlsx> <out.json> --report`). It checks the Excel file's sha256 first (`436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d`, 4,629,542 bytes), checks the column headings, and gives the same file byte for byte on every run (output sha256 `c34fc8b174e46c1656d90e2670efdcd85feac2740841f10780357a60b70807ce`, held by the test UK-1). RUNBOOK: "Rebuilding the built-in UK foods list".
- **Kept groups (CoFID group codes):** porridge oats (only those, from the mixed group A), grains, flours, rice, pasta and noodles, bread, rolls, breakfast cereals, couscous; milks, cheese, yogurt, cream; eggs; potatoes and chips, beans and pulses, peas, vegetables, dried vegetables; fruit, fruit juices, nuts and seeds; fish and seafood (not fish dishes); meat cuts, poultry, plain burgers, ham, bacon, sausages; fats and oils; coffee, tea, soft drinks, squash, juices; sugars, honey, jams and spreads.
- **Left out (counts from the run):** 1,145 foods in dish, recipe, alcohol, powder, sweets and snack, herb and spice, offal and game groups; 317 more whose names show a dish or a weight with bone, skin or shell ("homemade", "takeaway", "weighed with", "weighed as", "coated", "in batter", "pie", "curry", "filled with", "microwaved" repeats and so on); 18 dishes in mixed groups (the mixed cereal group keeps only porridge oats; pasta and couscous groups keep only plain pasta, noodles and couscous); 7 with "N" or an empty value in one of the 4 numbers; 4 "boiled in salted water" rows whose "unsalted water" twin is kept; 1 drink with alcohol (Irish coffee).
- **One repeat in the source:** CoFID 2021 gives the code 13-669 to two foods (roasted aubergine and watercress). The code is the food's id, so the second one becomes 13-669b.
- **Checks on the output:** every kcal 0 to 899, every macro 0 to 100 g, protein + carbs + fat never above 100.5 g (chocolate spread adds up to 100.4 g, a rounding in the source, so the test allows up to 101 g), longest name 89 letters, plain ASCII names only, no repeated codes. No kept food has kcal far from 4 x protein + 3.75 x carbs + 9 x fat (more than 25 kcal and 20 % off); the 2 that did in an earlier run (Irish coffee, lemon sole goujons) are now left out.
- "Tr" becomes 0 (a trace is under 0.1 g). A food with "N" in kcal, protein, carbs or fat is left out (the app needs all 4).
- Names stay as the tables write them ("Chicken, breast, grilled without skin, meat only"), so they can be checked against the source. A short search word list (aliases) is not added in 0.7.7.
- Alcoholic drinks are per 100 ml in the tables: left out in 0.7.7 (the food sheet works in grams).

## 4. How it works in the app (design; the mock-up shows it)

- **Data file:** `app/data/uk-foods.json` (one file, in the `sw.js` FILES list, so it works offline from the first open). Format: `{ "source": "...", "licence": "OGL-3.0", "credit": "Contains public sector information licensed under the Open Government Licence v3.0.", "version": "CoFID 2021", "fields": ["code", "name", "kcal", "protein_g", "carbs_g", "fat_g"], "foods": [[code, name, kcal, protein_g, carbs_g, fat_g], ...] }`, foods sorted by name. It is our own file, checked by a test (numbers in range, kcal not above 900, macros not above 100 g, name at most 120 letters), and read only as text and numbers (never `innerHTML`).
- **Search sheet** (`app/js/diet/sheets.js` openSearch): while you type, two offline groups filter at once: "Your foods (work offline)" first, then the new **"Common UK foods (built in, work offline)"**: up to 8 rows, each with the name, the small line "UK food tables · per 100 g" and "141 kcal / 100 g" on the right; "Show all 23" when more match. The online search ("From Open Food Facts") still runs only when you tap Search, below these. With an empty box, the built-in group is not shown (no list of 1,000 foods).
- **Matching:** every typed word must match the start of a word in the name, in any order ("chick breast" finds "Chicken, breast, grilled..."). Rows whose name starts with the first word come first, then shorter names. A food you already saved from the list shows only under Your foods.
- **Tap a row:** the food sheet opens like a saved food (amount, Grams | Pieces, meal, Save and add), with the line "From the UK food tables. Numbers per 100 g, edible part." instead of the Open Food Facts "check before saving" warning. "Save and add" saves it to Your foods (so it shows in "Log again" next time) and adds the entry; the numbers are stored in the entry when logged, as today.
- **No new network address:** the list ships with the app; the CSP does not change.
- **0.7.6 note:** worker 8.43 changes the same search sheet in 0.7.6 (new online search address). Phase 2 builds on its committed version only.

## 5. Tests first (phase 2)

Parsing of the data file and its range checks; search matching (word starts, any order, ranking, at most 8 plus "Show all"); per-100 g numbers carried into a saved food and an entry; a food from the list saved once, then found under Your foods; the credit line on the search sheet, the built-in food sheet and the Diet foot; the data file in the `sw.js` FILES list; no `innerHTML`.

## 6. Waiting on

- ~~The download~~: done 2026-11-18 after Rosario's OK (answer 105 a), from https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx into its own scratch folder, read with Python's built-in zip and XML reader under `python -I`. The Excel file never enters the repo; only the made JSON does (phase 2).
- Phase 2 (the build) waits for the master's go, after worker 8.43 commits 0.7.6.

## Not verified

- Whether every kept food is "plain" by Rosario's meaning: the rule is by group and name words; a few borderline products stay (for example baked beans in tomato sauce, porridge made with milk, instant mashed potato), on purpose, because people log them as one food.
- Whether some foods carry third-party rights (the guide names outside sources for some foods; the gov.uk page puts the whole dataset under the OGL).
- The National Archives licence page itself (403 to my reader); the licence words come from the SPDX copy.
- Whether a newer CoFID exists elsewhere: the gov.uk page still shows the 2021 dataset as the latest (last updated 19 March 2021, read 2026-11-18).
