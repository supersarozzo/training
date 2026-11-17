# body-muscles: what we changed

This folder holds a part of **body-muscles** by Ivan Vulović, https://github.com/vulovix/body-muscles, version 1.0.0, commit `15c8085ee97cb94c51f92c75224416b15f955b5c` (2026-04-16). It is used under the **Apache License 2.0** (`LICENSE`, copied unchanged). The `NOTICE` file is copied unchanged, as section 4 d of the licence asks.

Copied into the Training app on 2026-11-17 by worker 8.31 (build step 1, Rosario's answer 71 b).

## Files

| File | What it is |
|---|---|
| `LICENSE` | The Apache License 2.0 text, unchanged from the source repo. |
| `NOTICE` | The source repo's NOTICE file, unchanged. |
| `shapes.js` | The body shapes, made from the source's `src/data/muscles.front.ts` and `src/data/muscles.back.ts`. |
| `CHANGES.md` | This note. |

## What we changed (Apache-2.0 section 4 b)

- We kept only each part's `id` and its SVG `path` string, as two plain JavaScript lists (`FRONT`, `BACK`). The path strings are copied character for character. The part names, the TypeScript types, the comments and all of the library's code (`BodyChart`, colour helpers, filters) are not copied.
- We added the view boxes the source uses (front `0 0 35 93`, back `37 0 35 93`, both `0 0 72 93`) as `VIEWBOX`.
- We group the parts into our own muscle groups in our own file, `app/js/plan/muscles.js` (`partMuscle`). Parts we do not group (head, hands, feet, knees, shins, hip flexors, serratus) are drawn as plain body.
- Our own code draws the shapes (inline SVG, our colours; built in build step 2). Nothing is loaded from another site.
