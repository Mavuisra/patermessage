import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { ownerApi } from "../api/client";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function isConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export async function initFCM(
  onForegroundMessage?: (payload: { title?: string; body?: string }) => void
): Promise<void> {
  if (!isConfigured() || !("Notification" in window)) return;

  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const { vapid_key } = await ownerApi.getFcmConfig();
    const vapidKey = vapid_key || import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;

    const swReg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      await ownerApi.registerDevice(token);
    }

    onMessage(messaging, (payload) => {
      onForegroundMessage?.({
        title: payload.notification?.title,
        body: payload.notification?.body,
      });
    });
  } catch (err) {
    console.warn("FCM init:", err);
  }
}
