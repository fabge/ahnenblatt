# TODO

- [ ] **Re-enable PWA service worker caching.** `vite.config.ts` currently sets `selfDestroying: true` on `VitePWA(...)` so the shipped SW unregisters itself and clears its caches — added because iOS clients were stuck on old precached bundles during early development. Once every active device has loaded the site at least once with `selfDestroying: true`, remove that flag so the real Workbox SW takes over again (offline support, install banner, etc.). Bump the version / do a noticeable change in the same release so it's easy to verify the new SW is live.


---

lets not have this warning message pop up:
Sollen wirklich alle Dateien von "9911 Ahnentafel" hochgeladen werden? Erlauben Sie dies nur, wenn Sie der Website vertrauen.

Known limitations (intentional v1 cuts)

- Photo fullscreen is tap-to-close only (no pinch zoom — viewport has user-scalable=no for the tree, and I didn't wire a separate gesture handler for the fullscreen
viewer).
- Tree layout uses the same algorithms as the iOS app, so it inherits the same quirks (no spouse rendering on ancestor mode, single-spouse only on descendant mode).
- No "Stammbaum"-tab toolbar to change root from inside tree view; you change root from a person's detail page (matches iOS behavior).
