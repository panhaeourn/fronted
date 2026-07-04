const COURSE_IMAGE_CACHE = "cito-course-images-v1";
const MAX_CACHED_IMAGES = 80;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("cito-course-images-") && key !== COURSE_IMAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    request.destination !== "image" ||
    !url.pathname.startsWith("/files/")
  ) {
    return;
  }

  event.respondWith(loadCourseImage(request));
});

async function loadCourseImage(request) {
  const cache = await caches.open(COURSE_IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
    await trimCache(cache);
  }
  return response;
}

async function trimCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_CACHED_IMAGES;
  if (excess <= 0) return;

  await Promise.all(keys.slice(0, excess).map((request) => cache.delete(request)));
}
