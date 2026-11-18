# zxing-wasm: where it comes from and what we changed

This folder holds the **reader build** of **zxing-wasm 3.1.7** by Ze-Zheng Wu, https://github.com/Sec-ant/zxing-wasm. It reads the barcode on a food pack from the camera or from a photo (Rosario's answer 63 a: a self-hosted open-source reader). Copied into the Training app on 2026-11-18 by worker 8.38 (build step 8).

## Where it comes from

- npm registry: `https://registry.npmjs.org/zxing-wasm/-/zxing-wasm-3.1.7.tgz`
- Integrity of that file (checked on download): `sha512-LI94ndlOY+xoqlkNcc0EwByrMpUXKrCX171EQ38kGWqpiRq/gcnC+ZrbRipvxI3uV4LaDtNlKo1p9Uayg1sesQ==`
- SHA-256 of `reader/zxing_reader.wasm`: `33c8c50be17d0bb05454b4fd3ffb5b5ab9a8e8d1c0ebeb21a1adf4a89c1a8b59`. The library holds the same value as `ZXING_WASM_SHA256`, and `tests/barcode.test.mjs` checks both.

## Files

| File | From the package | What it is |
|---|---|---|
| `reader/index.js` | `dist/es/reader/index.js` | The reader's JavaScript (ES module). Imports only `../share.js`. |
| `share.js` | `dist/es/share.js` | Code shared by the reader and writer builds. |
| `reader/zxing_reader.wasm` | `dist/reader/zxing_reader.wasm` | The reader itself (zxing-cpp, compiled to WebAssembly). |
| `LICENSE` | `LICENSE` | MIT License of zxing-wasm, unchanged. |
| `LICENSE-zxing-cpp` | zxing-cpp `LICENSE` at commit f19f7c6 | Apache License 2.0, unchanged. |
| `LICENSE-zxing-wasm-cpp` | zxing-wasm `src/cpp/LICENSE` at tag v3.1.7 | Apache License 2.0, unchanged. |
| `NOTICE` | written by us | Who made what, and under which licence. |
| `CHANGES.md` | written by us | This note. |

## What we changed

- **Nothing inside the files.** All three code files are byte for byte the package's files.
- We copied only the reader build (no writer, no full build, no CommonJS or IIFE copies, no type files, no README).
- By default the library would download its `.wasm` from jsDelivr. Our own code (`app/js/food/scanner.js`) calls `prepareZXingModule` with `locateFile` pointed at our own `reader/zxing_reader.wasm`, so nothing is loaded from another site. The page's Content Security Policy would also block jsDelivr.
- The files are in the service worker's offline list, so the scanner works with no signal after the first open.
