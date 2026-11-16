// Changer VERSION à chaque modification, sinon les téléphones gardent l'ancienne version.
const VERSION = 'fdm-v1.4.0';
const FICHIERS = ['./', 'index.html', 'engine.js', 'data.js', 'app.js', 'tapisserie.js', 'sync.js', 'progression.js', 'epreuves.js', 'manifest.json', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSION).map(n => caches.delete(n))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
