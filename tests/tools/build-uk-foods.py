"""Build the built-in UK foods list (app 0.7.7) from the CoFID 2021 Excel file.

Source: McCance and Widdowson's Composition of Foods Integrated Dataset 2021,
Public Health England, Open Government Licence v3.0. Download page:
https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid

Standard library only. The Excel file is untrusted data: keep it in its own folder,
keep this script elsewhere, and run Python isolated:

    python -I tests/tools/build-uk-foods.py <cofid2021.xlsx> app/data/uk-foods.json [--report]

Rule (Rosario, answer 104 a, 2026-11-18): plain foods only, no dishes or recipes.
Only the sheet "1.3 Proximates" is read; only 6 columns are kept per food:
[code, name, kcal, protein_g, carbs_g, fat_g], per 100 g edible part.
"Tr" (trace) becomes 0. A food with "N" (not known) or an empty value in any
of the four numbers is left out, never guessed.
"""
import hashlib
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter

EXPECTED_SHA256 = "436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d"
SHEET = "1.3 Proximates"
# Columns in "1.3 Proximates" (checked against the header rows below).
COL = {"code": 0, "name": 1, "group": 3, "protein": 9, "fat": 10, "carbs": 11, "kcal": 12, "alcohol": 23}
HEADERS = {0: "Food Code", 1: "Food Name", 3: "Group", 9: "Protein (g)", 10: "Fat (g)",
           11: "Carbohydrate (g)", 12: "Energy (kcal) (kcal)", 23: "Alcohol (g)"}

# Plain-food groups (CoFID group codes). Left out on purpose: dishes and recipes
# (A, AB, AE, AM-AS, BP, BR, BV, CD*, DR, JR, MR, MIG, W*), alcohol (Q*),
# powders and supplements (PAA), confectionery and snacks (SEA, SEC, SN*),
# herbs and spices (H: eaten in pinches), offal and game (MG, MCG-MCM, MEA),
# flavoured or children's yogurts (BNH, BNS), cream substitutes (BJP, BJS).
GROUPS = {
    # cereals: porridge oats (in the mixed group A), grains and flours, rice, pasta and noodles, bread, rolls,
    # breakfast cereals
    "A", "AA", "AC", "AD", "AF", "AG", "AI", "AT",
    # milk, cheese, yogurt, cream
    "BA", "BAB", "BAE", "BAH", "BAK", "BAR", "BC", "BJC", "BL", "BN", "BNE",
    # eggs
    "CA",
    # potatoes, chips, beans and pulses, peas, vegetables, dried vegetables
    "DA", "DAE", "DAM", "DAP", "DAR", "DB", "DF", "DG", "DI",
    # fruit, juices, nuts and seeds
    "F", "FA", "FC", "G", "GA",
    # fish and seafood (not fish dishes)
    "J", "JA", "JC", "JK", "JM",
    # meat cuts, poultry, burgers, meat products like ham and sausages
    "MAA", "MAC", "MAE", "MAG", "MAI", "MBG", "MCA", "MCC", "MCE", "MCO", "MEC", "MEE", "MI",
    # fats and oils
    "OA", "OB", "OC", "OF",
    # coffee, tea, soft drinks, squash, juices
    "P", "PA", "PAC", "PCA", "PCC", "PE",
    # sugars, honey, jams, spreads
    "SC",
}
# In these groups only names that start like this are plain foods.
ONLY_STARTING = {"A": ("Porridge oats",), "AT": ("Couscous", "Bulgur"), "AD": ("Noodles", "Pasta", "Spaghetti", "Macaroni, ", "Lasagne sheets", "Tagliatelle")}
# Names with these words are dishes, recipes, or weights that include bone, skin or shell.
DROP_WORDS = re.compile(r"homemade|takeaway|weighed with|weighed as|human|in batter|battered|in breadcrumbs|"
                        r"coated|pasties|pies?\b|pastry|samosa|stuffing|in sauce|curry|"
                        r"skin only|fried with|stir-fried with|with vegetables|with rice|"
                        # near-repeats that only add length to the list
                        r"microwaved|from steakhouse|fat only|, fat, |extra trimmed|"
                        # ready-made dishes that sit in plain groups
                        r"with bun|goujons|sauce mixes|filled with|ravioli|with pork sausages|wine sauce|"
                        r"ice cream sauce|batter", re.I)
MAX_NAME = 120


def open_book(path):
    z = zipfile.ZipFile(path)
    for i in z.infolist():
        if i.file_size > 200 * 1024 * 1024:
            raise SystemExit(f"entry too big: {i.filename}")
    return z


NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def shared_strings(z):
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")) for si in root.findall("m:si", NS)]


def sheet_path(z, name):
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    target = {r.get("Id"): r.get("Target") for r in rels}
    for s in wb.find("m:sheets", NS):
        if s.get("name") == name:
            t = target[s.get(f"{{{NS['r']}}}id")].lstrip("/")
            return t if t.startswith("xl/") else "xl/" + t
    raise SystemExit(f"sheet not found: {name}")


def col_index(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def rows(z, path, sst):
    data = ET.fromstring(z.read(path)).find("m:sheetData", NS)
    for row in data.findall("m:row", NS):
        vals = {}
        for c in row.findall("m:c", NS):
            t, v = c.get("t"), c.find("m:v", NS)
            if t == "s" and v is not None:
                val = sst[int(v.text)]
            elif t == "inlineStr":
                val = "".join(x.text or "" for x in c.iter(f"{{{NS['m']}}}t"))
            else:
                val = v.text if v is not None else ""
            vals[col_index(c.get("r"))] = val
        yield [vals.get(i, "") for i in range(max(vals) + 1 if vals else 0)]


def number(text, limit):
    """'Tr' -> 0; 'N', empty or anything odd -> None (food left out)."""
    s = (text or "").strip()
    if s == "Tr":
        return 0
    if not re.fullmatch(r"\d+(\.\d+)?", s):
        return None
    x = round(float(s), 1)
    if x < 0 or x > limit:
        return None
    return int(x) if x == int(x) else x


def clean_name(text):
    s = re.sub(r"[\x00-\x1f\x7f]", "", text or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s if 0 < len(s) <= MAX_NAME else None


def build(xlsx):
    z = open_book(xlsx)
    sst = shared_strings(z)
    all_rows = list(rows(z, sheet_path(z, SHEET), sst))
    head = all_rows[0]
    for i, h in HEADERS.items():
        if i >= len(head) or head[i].strip() != h:
            raise SystemExit(f"column {i} is {head[i] if i < len(head) else ''!r}, expected {h!r}")
    data = [r for r in all_rows[3:] if r and r[0].strip()]
    foods, why = [], Counter()
    for r in data:
        r = r + [""] * (24 - len(r))
        g = r[COL["group"]].strip()
        name = clean_name(r[COL["name"]])
        if g not in GROUPS:
            why["group not plain"] += 1
            continue
        if not name:
            why["name empty or too long"] += 1
            continue
        if g in ONLY_STARTING and not name.startswith(ONLY_STARTING[g]):
            why["dish in a mixed group"] += 1
            continue
        if DROP_WORDS.search(name):
            why["dish word"] += 1
            continue
        if r[COL["alcohol"]].strip() not in ("", "0", "0.0", "Tr", "N"):
            why["has alcohol"] += 1
            continue
        k = number(r[COL["kcal"]], 900)
        p = number(r[COL["protein"]], 100)
        c = number(r[COL["carbs"]], 100)
        f = number(r[COL["fat"]], 100)
        if None in (k, p, c, f):
            why["a number not known"] += 1
            continue
        code = r[COL["code"]].strip()
        if not re.fullmatch(r"[0-9A-Za-z-]{1,12}", code):
            why["odd code"] += 1
            continue
        foods.append([code, name, round(k), p, c, f, g])
    # "boiled in salted water" has a twin "boiled in unsalted water" with almost the same
    # numbers; keep only the unsalted one when both exist.
    names = {x[1] for x in foods}
    kept = []
    for x in foods:
        if "in salted water" in x[1] and x[1].replace("in salted water", "in unsalted water") in names:
            why["salted-water twin of an unsalted food"] += 1
            continue
        kept.append(x)
    foods = kept
    # CoFID 2021 gives one code to two foods (13-669: roasted aubergine and watercress).
    # The code is the food's id in the app, so a repeat gets a letter: 13-669b.
    seen = set()
    for x in foods:
        base, n = x[0], 1
        while x[0] in seen:
            n += 1
            x[0] = base + "abcdefgh"[n - 1]
        if x[0] != base:
            why["repeated code, letter added (kept)"] += 1
        seen.add(x[0])
    return len(data), foods, why


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    xlsx, out = sys.argv[1], sys.argv[2]
    sha = hashlib.sha256(open(xlsx, "rb").read()).hexdigest()
    if sha != EXPECTED_SHA256:
        raise SystemExit(f"not the expected CoFID 2021 file (sha256 {sha})")
    total, foods, why = build(xlsx)
    foods.sort(key=lambda x: x[1].lower())
    doc = {
        "source": "McCance and Widdowson's Composition of Foods Integrated Dataset 2021, Public Health England",
        "licence": "OGL-3.0",
        "credit": "Contains public sector information licensed under the Open Government Licence v3.0.",
        "version": "CoFID 2021",
        "fields": ["code", "name", "kcal", "protein_g", "carbs_g", "fat_g"],
        "foods": [x[:6] for x in foods],
    }
    text = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    with open(out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    size = len(text.encode("utf-8"))
    print(f"foods in CoFID: {total}; kept: {len(foods)}; file: {size} bytes ({size / 1024:.0f} KB)")
    for k, v in why.most_common():
        print(f"  left out, {k}: {v}")
    if "--report" in sys.argv:
        per = Counter(x[6] for x in foods)
        print("kept per group:", " ".join(f"{g}={n}" for g, n in sorted(per.items())))


if __name__ == "__main__":
    main()
