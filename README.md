# FSI — Global Marketing Impact Report (Q2 2026)

Static marketing-impact deck on the shared **Global MI Pack** framework.
Open `index.html` in a browser — there is no build step.

## Where things live
- `index.html` — the deck (funnel-structured pages). Brand name + mark are inline here.
- `brand.css` — **the brand accent colour** (`--c-us`). Change one line to re-skin.
- `mi-data.js` — all numbers & copy (`window.MIDATA`); each dataset maps to the Marketing Data Hub API catalogue.
- `mi.css` / `present.css` — shared visual system (identical across all brand packs).
- `image-slot.js`, `mi-charts.js`, `mi-app.js`, `mi-present.js` — shared engine.

## Editing
- **Accent colour:** edit `--c-us` in `brand.css`.
- **Brand name / mark:** edit the `.brandmark` text in `index.html`.
- **Data / copy:** edit `mi-data.js`.

What's in the files is what renders — safe to edit in Lovable or any editor.
