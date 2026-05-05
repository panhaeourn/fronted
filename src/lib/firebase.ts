import { initializeApp } from "firebase/app";
import { getAuth, initializeRecaptchaConfig } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebasePhoneAuthConfigured = () =>
  Object.values(firebaseConfig).every((value) => value.trim().length > 0);

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

let recaptchaConfigPromise: Promise<void> | null = null;

export function ensureFirebaseRecaptchaConfig() {
  if (!recaptchaConfigPromise) {
    recaptchaConfigPromise = initializeRecaptchaConfig(firebaseAuth).catch((error) => {
      recaptchaConfigPromise = null;

      if (import.meta.env.DEV) {
        console.warn("Firebase reCAPTCHA config preload failed; continuing with verifier setup.", error);
      }
    });
  }

  return recaptchaConfigPromise;
}
