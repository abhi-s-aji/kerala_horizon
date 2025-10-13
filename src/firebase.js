// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwYQkRJJL8ZlHc9aunSpcLwjf6eJmfopU",
  authDomain: "kerala-horizon.firebaseapp.com",
  projectId: "kerala-horizon",
  storageBucket: "kerala-horizon.firebasestorage.app",
  messagingSenderId: "891793399159",
  appId: "1:891793399159:web:f0bcbf62954d29d826d572",
  measurementId: "G-2D8T01EH18"
};

// Google Places API configuration
export const GOOGLE_PLACES_API_KEY = "AIzaSyCvGOy7l9_XkVlO5S47WcuIRz-aJcEFGcM";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

export default app;