"use strict";

/** 
    Source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
*/

// variable definitions 
var CACHE_NAME = 'scanettePWA-v3';

var contentToCache = [
  './index.html',    
  './scanettePWA.webmanifest',    
  './style.css', 
  './produits.csv', 
  './js/app.js', 
  './js/DecoderWorker.js', 
  './js/exif.js', 
  './js/job.js', 
  './images/logo.png', 
  './images/barcode-scanner.png', 
  './images/icon-cart.png', 
  './images/icon-setup.png', 
  './images/icon-transmit.png', 
  './favicon.ico',
  './icons/icon-32.png',
  './icons/icon-64.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-168.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-512.png'
];

var updatableContent = ['index.html', 'style.css', 'app.js', 'produits.csv'];

// service worker installation
self.addEventListener('install', function(e) {
    console.log('[Service Worker] Install');
    e.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
        console.log('[Service Worker] Caching application content & data');
        return cache.addAll(contentToCache);
    }));
});

// fecthing data
self.addEventListener('fetch', function(evt) {

    // discard requests that are not related to the loading of application data
    if (! evt.request.url.startsWith('http')) return;
    
    // if requested on an updatable content, load it from the network and cache it
    if (updatableContent.some(function(uc) { return evt.request.url.includes(uc); })) {
        console.log('[Service Worker] Fetching (data) ', evt.request.url);
        evt.respondWith(
            caches.open(CACHE_NAME).then(function(cache) {
                return fetch(evt.request)
                    .then(function (response) {
                    // If the response was OK, clone it and store it in the cache.
                    if (response.status === 200) {
                        console.log("[Service worker] --> Network available, caching current version");
                        cache.put(evt.request.url, response.clone());
                    }
                    return response;
                }).catch(function (err) {
                    // Network request failed, try to get it from the cache.
                    console.log("[Service worker] --> Network unavailable, using cached version");
                    return cache.match(evt.request);
                });
            }));
        return;
    }
    
    // otherwise load from cache by default, or fetch it if not present (and update cache)
    evt.respondWith(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.match(evt.request)
                .then(function(response) {
                    return response || fetch(evt.request);
            })
        })
    );
});


self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
        if(CACHE_NAME.indexOf(key) === -1) {
            console.log("[Service Worker] Cleaning old cache");
            return caches.delete(key);
        }
      }));
    })
  );
});