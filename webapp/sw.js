const appCacheName = 'goto.Sydney-PWA=x0121';
const serverUrl = 'https://gotosydneyaustralia.herokuapp.com/api/';
const ui5CDN = 'https://openui5.hana.ondemand.com/1.63.0/resources/';
const filesToCache = [
  '.',
  './index.html',
  './manifest-pwa.json',
  './sw.js',
  './sw-reg.js',
  './Component.js',
  './Component-preload.js',
  './manifest.json',
  './manifest.json?sap-language=EN',
  './controller/App.controller.js',
  './controller/BaseController.js',
  './controller/Map.controller.js',
  './controller/Master.controller.js',
  './controller/NoMap.controller.js',
  './controller/Stops.controller.js',
  './controller/TimetableDialog.js',
  './controller/Trips.controller.js',
  './i18n/i18n.properties',
  './i18n/i18n_en.properties',
  './images/favicon.ico',
  './images/logo-32x32.png',
  './images/logo-48x48.png',
  './images/logo-144x144.png',
  './images/logo-192x192.png',
  './images/logo-512x512.png',
  './images/boat.png',
  './images/nsw-ferry.png',
  './images/wheelchair.png',
  './model/formatter.js',
  './model/models.js',
  './openui5/model/json/crud/library-preload.js',
  './view/App.view.xml',
  './view/Map.view.xml',
  './view/Master.view.xml',
  './view/NoMap.view.xml',
  './view/NotFound.view.xml',
  './view/Stops.view.xml',
  './view/TimetableDialog.fragment.xml',
  './view/Trips.view.xml',

  serverUrl + 'agency',
  serverUrl + 'calendar',
  serverUrl + 'routes',
  serverUrl + 'stops',
  serverUrl + 'stoptimes',
  serverUrl + 'trips',
  serverUrl + 'tripdirections',

  ui5CDN + 'sap-ui-version.json',
  ui5CDN + 'sap-ui-core.js',
  ui5CDN + 'sap/ui/core/library-preload.js',
  ui5CDN + 'sap/ui/core/messagebundle_en.properties',
  ui5CDN + 'sap/ui/core/themes/sap_belize/library.css',
  ui5CDN + 'sap/ui/core/themes/sap_belize/fonts/72-Regular.woff2',
  ui5CDN + 'sap/ui/core/themes/sap_belize/fonts/72-Bold.woff2',
  ui5CDN + 'sap/ui/core/themes/base/fonts/SAP-icons.woff2',
  ui5CDN + 'sap/m/library-preload.js',
  ui5CDN + 'sap/m/messagebundle_en.properties',
  ui5CDN + 'sap/m/themes/sap_belize/library.css'
];

self.addEventListener('install', function(evt) {
  'use strict';
  evt.waitUntil(
    caches.open(appCacheName)
      .then(function(cache) {
        return cache.addAll(filesToCache);
      })
      .catch(function(err) {
        console.error(err);
      })
  );
});

self.addEventListener('activate', function(evt) {
  'use strict';
  evt.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName !== appCacheName;
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
      .catch(function(err) {
        console.error(err);
      })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(evt) {
  'use strict';
  evt.respondWith(
    caches.match(evt.request)
      .then(function(response) {
        return response || fetch(evt.request);
      })
      .catch(function(err) {
        console.error(evt.request.url);
        console.error(err);
      })
  );
});

