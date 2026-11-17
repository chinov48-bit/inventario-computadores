// Copia local para que la app abra sin internet y rápido: muestra al instante lo guardado
// y en segundo plano baja la versión nueva (se ve en la siguiente apertura).
var CACHE = "inv-computadores-v3";
var ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return; // no tocar la planilla ni otros sitios
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (guardado) {
        var red = fetch(e.request).then(function (r) {
          if (r && r.ok && r.type === "basic") c.put(e.request, r.clone()); // nunca guarda errores (404, 500)
          return r;
        });
        if (guardado) { red.catch(function () {}); return guardado; }
        return red.catch(function () { return c.match("./index.html"); });
      });
    })
  );
});
