// Changer VERSION à chaque modification, sinon les téléphones gardent l'ancienne version.
const VERSION = 'fdm-v1.22.0';
const FICHIERS = ['./', 'index.html', 'engine.js', 'data.js', 'app.js', 'tapisserie.js', 'sync.js', 'progression.js', 'activites.js', 'chant1.js', 'epreuves.js', 'emojis.js', 'son.js', 'voix.js', 'cinematique.js', 'manifest.json', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSION).map(n => caches.delete(n))))); self.clients.claim(); });
// Réseau d'abord ; ce qui vient du jeu (dont les images art/) est gardé en cache pour jouer hors ligne
self.addEventListener('fetch', e => {
  const local = e.request.method === 'GET' && new URL(e.request.url).origin === self.location.origin;
  // no-cache : on revalide toujours auprès du serveur, pour ne jamais garder une ancienne version en cache navigateur
  e.respondWith(fetch(local ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : e.request).then(r => {
    if (local && r.status === 200) { const copie = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
