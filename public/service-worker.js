const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/manifest.webmanifest"
]

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v2";

let transaction; 

self.addEventListener('install',(event)=>
{
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache)=>
        {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    console.log("pageReloaded");
    event.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
              console.log(key);
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  

  self.addEventListener("fetch", function(event) {
    // cache successful requests to the API
    if (event.request.url.includes("/api/")) {
        event.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(event.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {

              // Network request failed, try to get it from the cache.
              return cache.match(event.request);

            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    event.respondWith(
        caches.match(event.request).then((response)=>
        {
            return response || fetch(event.request);
        })
    );
});
