# Stammbaum

Family-tree viewers for [Ahnenblatt](https://www.ahnenblatt.de/) GEDCOM exports. Import a folder containing your `.ged` file and photos, browse ancestors and descendants, and view person details — all client-side, no server needed.

This repo contains two implementations:

| Platform | Tech | Status |
|----------|------|--------|
| **Web** (`web/`) | Vite + React + TypeScript + Framework7 PWA | **Primary target** |
| **iOS** (`ios/`) | SwiftUI | Reference / personal use |

## Web (PWA)

The web version is a progressive web app built with **Vite + React + TypeScript + Framework7-React** (iOS theme). It runs entirely in the browser: the user picks a folder, the app parses the GEDCOM file, stores photo Blobs in IndexedDB, and renders interactive ancestor/descendant trees.

### Quick start

```bash
cd web
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve dist/ locally
```

### Deploy

`dist/` is a static bundle. Drop it on Cloudflare Pages, Netlify, GitHub Pages, or any static host. **HTTPS is required** for the service worker and PWA install prompt.

### Features

- **Folder import** — pick the folder that contains both the `.ged` file and photo subfolders (matches Ahnenblatt export layout).
- **GEDCOM parsing** — handles Ahnenblatt's `OBJE/FILE` photo references, including Windows-style absolute paths. Tries UTF-8, falls back to Latin-1.
- **Offline photos** — photo Blobs are cached in IndexedDB by lowercase basename, so everything works offline after the first import.
- **Ancestor & descendant trees** — interactive SVG canvas with pan, pinch-zoom, and double-tap-to-reset.
- **Person details** — facts, relations, photos, and a fullscreen photo viewer.
- **Responsive** — works on mobile and iPad; master-detail split views on larger screens.
- **Dark mode** — follows system preference automatically.

See [`web/CLAUDE.md`](web/CLAUDE.md) for architecture details.

## iOS

A native SwiftUI iOS/iPadOS app with the same feature set. Kept as a reference implementation and for personal use.

### Build & run

```bash
cd ios

# Simulator
xcodebuild -scheme Stammbaum \
  -destination 'platform=iOS Simulator,name=iPhone 17' build

# See ios/CLAUDE.md for install, launch, and physical-device commands
```

See [`ios/CLAUDE.md`](ios/CLAUDE.md) for full build instructions, architecture notes, and gotchas.

## Shared concepts

Both implementations share the same core ideas:

- **Root person** — the tree is centered on a selected person. Defaults to the most ancestral person on first load.
- **Tree modes** — switch between *Vorfahren* (ancestors) and *Nachfahren* (descendants) with configurable generation depth.
- **Photo resolution** — GEDCOM `OBJE/FILE` paths are stripped to their basename and matched case-insensitively against the imported folder contents.
- **No backend** — everything happens on-device.

## License

Private / personal project.
