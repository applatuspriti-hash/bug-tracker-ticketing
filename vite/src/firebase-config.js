// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL CONFIGURATION VALUES
export const firebaseConfig = {
    apiKey: "AIzaSyDgllOKzbOWhKVoZIiOrqzmNyq8tBH9RuY",
    authDomain: "applatus-project-tracking.firebaseapp.com",
    projectId: "applatus-project-tracking",
    storageBucket: "applatus-project-tracking.firebasestorage.app",
    messagingSenderId: "694591391104",
    appId: "1:694591391104:web:b8385dd7c9acf46bcced65",
    measurementId: "G-Y5C28767K7"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export default app;


