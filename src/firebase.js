import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZFKLBolMtkyEOMyINT794MfNfnSdBUw0",
  authDomain: "gulden-af0a4.firebaseapp.com",
  projectId: "gulden-af0a4",
  storageBucket: "gulden-af0a4.firebasestorage.app",
  messagingSenderId: "320531744272",
  appId: "1:320531744272:web:1c8d354f99a2def6f92c95",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
