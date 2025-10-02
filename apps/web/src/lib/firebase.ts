import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.error("Messaging not supported", e);
      }
    } else {
      console.warn("This browser does not support Firebase Messaging.");
    }
  });
}

export { messaging, getToken, onMessage };
