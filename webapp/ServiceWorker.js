"use strict";

// variable definitions 
var cacheName = 'scanettePWA-v1';
var contentToCache = [
  './index.html',    
  './style.css', 
  './produits.csv', 
  './js/app.js', 
  './js/DecoderWorker.js', 
  './js/exif.js', 
  './js/job.js', 
  './images/logo.png', 
  './images/icon-cart.png', 
  './images/icon-setup.png', 
  './images/icon-transmit.png', 
  './icons/icon-32.png',
  './icons/icon-64.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-168.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-512.png'
];


// service worker installation
self.addEventListener('install', function(e) {
    console.log('[Service Worker] Install');
    e.waitUntil(caches.open(cacheName).then(function(cache) {
        console.log('[Service Worker] Caching application content & data');
        return cache.addAll(contentToCache);
    }));
});

// fecthing data
self.addEventListener('fetch', function(e) {
    e.respondWith(
        // if data exists in the cache
        caches.match(e.request).then(function(r) {
            console.log('[Service Worker] Fetching resource: ' + e.request.url);
            // return it or... request it from server if not present in the cache 
            return r || fetch(e.request).then(function(response) {
                return caches.open(cacheName).then(function(cache) {
                    console.log('[Service Worker] Caching new resource: ' + e.request.url);
                    // caches the downloaded resource
                    cache.put(e.request, response.clone());
                    // and eventually return it
                    return response;
                });
            });
        })
    );
});

