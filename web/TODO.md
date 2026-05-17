# TODO

- [ ] **Re-enable PWA service worker caching.** `vite.config.ts` currently sets `selfDestroying: true` on `VitePWA(...)` so the shipped SW unregisters itself and clears its caches — added because iOS clients were stuck on old precached bundles during early development. Once every active device has loaded the site at least once with `selfDestroying: true`, remove that flag so the real Workbox SW takes over again (offline support, install banner, etc.). Bump the version / do a noticeable change in the same release so it's easy to verify the new SW is live.
