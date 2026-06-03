/* Enregistrez ce service worker avec la config Firebase en production.
   Remplacez les placeholders par vos clés depuis la console Firebase. */
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Black Pater";
  const options = {
    body: payload.notification?.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});
