"""Builds judge/mockup.html (one self-contained page) from mockup.template.html.

Injects: the two body drawings (B: body-muscles, Apache-2.0; A: react-body-highlighter, MIT) as JSON, and every
picture as a data: URI (OLD screenshots from judge/shots, exercise thumbs from app/media). Run from anywhere:
    python redesign/plan-diet/judge/build/build.py
"""
import base64, io, json, re, sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
JUDGE = HERE.parent
PD = JUDGE.parent
ROOT = PD.parent.parent


def js_array(src, name):
    m = re.search(r"export const " + name + r"\s*=\s*(\[.*?\]);\s*(?:\n|$)", src, re.S)
    if not m:
        sys.exit(f"{name} not found")
    return json.loads(m.group(1))


def uri(img, q=74):
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def shot(name):
    p = JUDGE / "shots" / f"{name}.jpg"
    im = Image.open(p)
    if name.endswith("-tabbar"):
        return uri(im)
    return uri(im.resize((600, round(im.height * 600 / im.width))), 72)


def thumb(ex):
    im = Image.open(ROOT / "app" / "media" / "exercises" / ex / "0.jpg")
    s = min(im.size)
    l, t = (im.width - s) // 2, (im.height - s) // 2
    return uri(im.crop((l, t, l + s, t + s)).resize((128, 128)), 78)


def main():
    # tab bar crops from the live screenshots
    for th in ("light", "dark"):
        im = Image.open(JUDGE / "shots" / f"old-plan-top-{th}.jpg")
        im.crop((0, im.height - 128, im.width, im.height)).save(JUDGE / "shots" / f"old-{th}-tabbar.jpg", quality=80)

    tpl = (HERE / "mockup.template.html").read_text(encoding="utf-8")
    b = (PD / "b" / "js" / "data" / "bodyshapes.js").read_text(encoding="utf-8")
    a = (PD / "a" / "js" / "proto" / "bodyshapes.js").read_text(encoding="utf-8")
    shapes_b = {"front": js_array(b, "FRONT"), "back": js_array(b, "BACK")}
    shapes_a = {"front": js_array(a, "FRONT"), "back": js_array(a, "BACK")}
    tpl = tpl.replace("/*SHAPES_B*/null", json.dumps(shapes_b, separators=(",", ":")))
    tpl = tpl.replace("/*SHAPES_A*/null", json.dumps(shapes_a, separators=(",", ":")))

    tpl = re.sub(r'src="shots/([a-z0-9-]+)\.jpg"', lambda m: f'src="{shot(m.group(1))}"', tpl)
    cache = {}
    def th(m):
        ex = m.group(1)
        if ex not in cache:
            cache[ex] = thumb(ex)
        return f'src="{cache[ex]}"'
    tpl = re.sub(r'src="img/([a-z_]+)\.jpg"', th, tpl)
    # thumbs referenced from script (data-th) become one JS map
    used = sorted(set(re.findall(r'data-(?:th|ex)="([a-z_]+)"', tpl)))
    thumbs = {ex: cache.get(ex) or thumb(ex) for ex in used}
    tpl = tpl.replace("/*THUMBS*/null", json.dumps(thumbs, separators=(",", ":")))

    out = JUDGE / "mockup.html"
    out.write_text(tpl, encoding="utf-8")
    print(out, f"{out.stat().st_size/1e6:.2f} MB", "thumbs:", len(thumbs))
    # local preview only (not committed): the same page inside the skeleton the artifact host adds
    if "--preview" in sys.argv:
        skel = ('<!doctype html><html><head><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
                '<style>:root{color-scheme:light;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}'
                'body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
                '</head><body>')
        (HERE / "preview.html").write_text(skel + tpl + "</body></html>", encoding="utf-8")


if __name__ == "__main__":
    main()
