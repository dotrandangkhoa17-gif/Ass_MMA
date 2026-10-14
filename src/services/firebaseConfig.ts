import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-ignore - Metro resolves RN bundle which exports getReactNativePersistence
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth with React Native AsyncStorage persistence
let auth: Auth;
try {
  if (typeof getReactNativePersistence === 'function') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  // If already initialized in hot reload / fast refresh
  auth = getAuth(app);
}

export { app, db, auth };

