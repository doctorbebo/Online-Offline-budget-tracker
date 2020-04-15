const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/manifest.webmanifest"
]

const CACHE_NAME = "static-cache-v4";
const DATA_CACHE_NAME = "data-cache-v1";

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
  

  self.addEventListener('fetch', (event) =>
  {
    console.log(event.request.url);
    event.respondWith(
        caches.match(event.request).then((response)=>
        {
            return response || fetch(event.request);
        })
    )
  });