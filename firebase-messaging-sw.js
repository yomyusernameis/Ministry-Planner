// Ministry Planner service worker.
// v2: offline app shell (cache-first for same-origin files, so the app
// opens even with no signal at the territory) + Firebase Cloud Messaging
// background handling, so push notifications show while the app is closed.
// Cross-origin requests (Firestore, gstatic, weather APIs) are never cached.
const CACHE = "mp-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js", "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
  firebase.initializeApp({apiKey:"AIzaSyA0jo1X28QVNsSmbacAEJqtDo4hINfhKCk", authDomain:"mp-app-21042.firebaseapp.com", projectId:"mp-app-21042", storageBucket:"mp-app-21042.firebasestorage.app", messagingSenderId:"1977223375", appId:"1:1977223375:web:a8447e410d37100e454fba"});
  firebase.messaging().onBackgroundMessage(payload => {
    const n = (payload && payload.notification) || {};
    return self.registration.showNotification(n.title || "Ministry Planner", {body: n.body || "", icon: "icon-192.png", badge: "icon-192.png"});
  });
} catch(e){ /* messaging unavailable — offline cache still works */ }
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
