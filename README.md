# Namjooning: An Indigo Archive

A Progressive Web App — lifestyle companion for mindfulness, nature, art & reading.

## How to use
1. Open `index.html` in a browser — works fully offline after first load.
2. To install as a PWA, serve the folder via any static server:
   - VS Code Live Server extension, OR
   - Run: `npx serve namjooning`
   Then visit the URL and tap "Add to Home Screen."

## Structure
namjooning/
├── index.html       ← App shell
├── style.css        ← Indigo design system
├── script.js        ← Full CRUD + Web Audio ambient player
├── manifest.json    ← PWA manifest
├── sw.js            ← Service worker (offline cache)
└── icons/           ← All icon sizes (72–512px)
