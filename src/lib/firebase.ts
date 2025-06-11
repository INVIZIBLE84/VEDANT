
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions"; // Added Functions import

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions; // Added Functions variable

if (!getApps().length) {
  // Log the status of all Firebase config variables for easier debugging
  console.log("Firebase Config Check:");
  console.log(` - NEXT_PUBLIC_FIREBASE_API_KEY: ${firebaseConfig.apiKey ? 'Loaded' : 'MISSING!'}`);
  console.log(` - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${firebaseConfig.authDomain ? 'Loaded' : 'MISSING!'}`);
  console.log(` - NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseConfig.projectId ? 'Loaded' : 'MISSING!'}`);
  console.log(` - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${firebaseConfig.storageBucket ? 'Loaded' : 'MISSING!'}`);
  console.log(` - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${firebaseConfig.messagingSenderId ? 'Loaded' : 'MISSING!'}`);
  console.log(` - NEXT_PUBLIC_FIREBASE_APP_ID: ${firebaseConfig.appId ? 'Loaded' : 'MISSING!'}`);
  // measurementId is optional, so we'll just note if it's present
  console.log(` - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${firebaseConfig.measurementId ? 'Loaded' : 'Not set (optional)'}`);


  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      "CRITICAL Firebase Config Missing: API Key or Project ID is not defined. Please check your NEXT_PUBLIC_FIREBASE_ environment variables. Firebase cannot be initialized correctly."
    );
    // Firebase will still attempt to initialize and throw its own error,
    // but this log provides a more direct hint.
  }
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

auth = getAuth(firebaseApp);
firestore = getFirestore(firebaseApp);
functions = getFunctions(firebaseApp, 'us-central1'); // Initialize functions, specify region if needed

export { firebaseApp, auth, firestore, functions };
