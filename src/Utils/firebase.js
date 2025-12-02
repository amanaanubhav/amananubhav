import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Using environment variables ( prefix is standard for Vite)
const firebaseConfig = {
  // Use  environment variables provided by Vercel settings
  apiKey: import.meta.env.FIREBASE_API,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.FIREBASE_APP_ID
};

// Initialize Firebase services
let app;
let auth;
let db;

try {
  // Check if API key is present before initializing (Vercel provides this)
  if (!firebaseConfig.apiKey) {
      console.warn("Firebase initialization skipped: API Key is missing from Vercel Environment Variables.");
      auth = null;
      db = null;
  } else {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log("Firebase initialized successfully");
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  auth = null;
  db = null;
}

export { auth, db };