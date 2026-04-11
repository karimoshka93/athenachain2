import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9Xia4Z7zDdIuLRyaxu-acS5c97ViPAKU",
  authDomain: "digital-gold-34c3d.firebaseapp.com",
  projectId: "digital-gold-34c3d",
  storageBucket: "digital-gold-34c3d.firebasestorage.app",
  messagingSenderId: "744838132321",
  appId: "1:744838132321:web:8a670415da2773fc0b3020",
  measurementId: "G-6JBKHDZNX4"
};

const app = initializeApp(firebaseConfig);
export const legacyAuth = getAuth(app);
export const legacyDb = getFirestore(app);
