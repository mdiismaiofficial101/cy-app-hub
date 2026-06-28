const CACHE_NAME = 'cy-app-hub-v1';
const urlsToCache = [
  '/cy-app-hub/',
  '/cy-app-hub/index.html',
  '/cy-app-hub/app-details.html',
  '/cy-app-hub/css/style.css',
  '/cy-app-hub/css/app-details.css',
  '/cy-app-hub/css/admin.css',
  '/cy-app-hub/js/github-api.js',
  '/cy-app-hub/js/main.js',
  '/cy-app-hub/js/app-details.js',
  '/cy-app-hub/js/admin.js',
  '/cy-app-hub/apps.json',
  '/cy-app-hub/settings.json',
  '/cy-app-hub/manifest.json',
  '/cy-app-hub/assets/icons/default-app.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
});
