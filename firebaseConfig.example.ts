// Firebase Configuration Example
// Copy this file to src/services/firebaseConfig.ts and replace with your actual Firebase credentials
// Get these values from: Firebase Console > Project Settings > General > Your Apps

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890abcdef',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
