import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./lib/auth-context";
import { LanguageProvider } from "./lib/language";
import "./index.css";
import "./App.css";
import "./styles.css";

const legacyCourseImageWorker = "course-image-cache-sw.js";
const legacyCourseImageCachePrefix = "cito-course-images-";

async function removeLegacyCourseImageCache() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) =>
          [registration.active, registration.waiting, registration.installing].some((worker) =>
            worker?.scriptURL.includes(legacyCourseImageWorker)
          )
        )
        .map((registration) => registration.unregister())
    );
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(legacyCourseImageCachePrefix))
        .map((cacheName) => caches.delete(cacheName))
    );
  }
}

void removeLegacyCourseImageCache().catch(() => {
  // Cleanup failure must never prevent the application from starting.
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
