const cacheName = "sw5e-character-viewer-v20";
const shell = [
  "./index.html", "./styles/sheet.css", "./manifest.webmanifest",
  "./icons/sw5e-d20.ico", "./icons/sw5e-d20-16.png", "./icons/sw5e-d20-32.png",
  "./icons/sw5e-d20-180.png", "./icons/sw5e-d20-192.png",
  "./icons/sw5e-d20-512.png", "./icons/sw5e-d20-512-maskable.png",
  "./pwa.js",
  "./catalogs/classes.js",
  "./catalogs/class-options.js", "./catalogs/archetypes.js", "./catalogs/species.js", "./catalogs/backgrounds.js",
  "./catalogs/powers.js", "./catalogs/combat-options.js",
  "./catalogs/equipment.js", "./catalogs/properties.js", "./catalogs/feats.js", "./catalogs/conditions.js",
  "./application/document.js", "./application/symbols.js", "./application/rules.js", "./application/effect-engine.js",
  "./application/conditions.js", "./application/consumables.js", "./application/casting.js", "./application/combat-options.js",
  "./application/importers/sw5e-website.js", "./application/state.js",
  "./application/active-effects.js", "./application/dashboard.js",
  "./application/skills.js", "./application/combat.js", "./application/collections.js",
  "./application/rests.js", "./application/character-audit.js",
  "./application/import-dialog.js", "./application/viewer.js"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shell)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("sw5e-character-viewer-") && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(event.request)) ||
      (event.request.mode === "navigate" && await cache.match("./index.html")) ||
      Response.error();
  }));
});
