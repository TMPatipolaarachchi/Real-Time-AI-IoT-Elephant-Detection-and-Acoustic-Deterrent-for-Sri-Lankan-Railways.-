import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyBreIlucOEVO1wfNjLR4jChz7NbvaH67Jo",
  authDomain: "elephant-dab0d.firebaseapp.com",
  projectId: "elephant-dab0d",
  storageBucket: "elephant-dab0d.firebasestorage.app",
  messagingSenderId: "703135929850",
  appId: "1:703135929850:web:6c46f4c8bf6cb5b8960043",
  measurementId: "G-7N22M2EFHZ"
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
