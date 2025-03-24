import { initializeApp } from 'firebase/app';

const firebaseConfig = {
 apiKey: "AIzaSyDEtvW5PS-v7BtJInGz9nhj8OVUB-kjK7U",
  authDomain: "tune-monkey.firebaseapp.com",
  projectId: "tune-monkey",
  storageBucket: "tune-monkey.firebasestorage.app",
  messagingSenderId: "490505954158",
  appId: "1:490505954158:web:bb80cccc6200dca53a177f",
  measurementId: "G-SQMF7D012E"
};

const app = initializeApp(firebaseConfig);
export default app;
