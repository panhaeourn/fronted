import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./lib/auth-context";
import { LanguageProvider } from "./lib/language";
import "./index.css";
import "./App.css";
import "./styles.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register("/course-image-cache-sw.js").catch(() => {
    // The app remains fully usable when service workers are unavailable.
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
