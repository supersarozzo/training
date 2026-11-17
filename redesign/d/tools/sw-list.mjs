// Rewrites the FILES list in app/sw.js from the files in app/ (run: node tools/sw-list.mjs from redesign/d).
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
const appDir = new URL("../app/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const all = (dir) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? all(f) : [relative(appDir, f).split(sep).join("/")]; });
const files = ["./", ...all(appDir).filter((f) => f !== "sw.js").sort()];
const swPath = join(appDir, "sw.js");
const sw = readFileSync(swPath, "utf8");
const a = sw.indexOf("const FILES = [");
const b = sw.indexOf("];", a) + 2;
writeFileSync(swPath, `${sw.slice(0, a)}const FILES = [\n${files.map((f) => `  "${f}",`).join("\n")}\n];${sw.slice(b)}`);
console.log(files.length, "files listed");
