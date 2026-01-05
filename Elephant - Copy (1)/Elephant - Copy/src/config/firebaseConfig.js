import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyBPGJyoxyybYtpJAFeVr5kzje4H4v9kQDU",
  authDomain: "original-9bded.firebaseapp.com",
  projectId: "original-9bded",
  storageBucket: "original-9bded.firebasestorage.app",
  messagingSenderId: "832603627994",
  appId: "1:832603627994:web:02565252ed6cc5b53d20e3",
  measurementId: "G-DWRBD9HHHQ"
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
