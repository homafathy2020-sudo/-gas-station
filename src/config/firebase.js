import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD-hbFNfXZHCEnJPiwavxwtCQoqNz6hTgc",
  authDomain: "gas-station-10000.firebaseapp.com",
  projectId: "gas-station-10000",
  storageBucket: "gas-station-10000.firebasestorage.app",
  messagingSenderId: "134512204371",
  appId: "1:134512204371:web:82bc0a29697fb4a7cc04a6",
  measurementId: "G-6GVF0V2R2T"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);