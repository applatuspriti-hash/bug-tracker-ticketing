importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyDgllOKzbOWhKVoZIiOrqzmNyq8tBH9RuY",
    authDomain: "applatus-project-tracking.firebaseapp.com",
    projectId: "applatus-project-tracking",
    storageBucket: "applatus-project-tracking.firebasestorage.app",
    messagingSenderId: "694591391104",
    appId: "1:694591391104:web:b8385dd7c9acf46bcced65",
    measurementId: "G-Y5C28767K7"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
