import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyC1Hng58HaYjP4gZuf3tZSIZ-lpk-VkZcE",
  authDomain: "elephant-8abf3.firebaseapp.com",
  projectId: "elephant-8abf3",
  storageBucket: "elephant-8abf3.firebasestorage.app",
  messagingSenderId: "1064527777276",
  appId: "1:1064527777276:web:55ef21c76a7c7842ac7679",
  measurementId: "G-P441YZT73F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence for offline support
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const firestore = getFirestore(app);

export { auth, app, firestore };
