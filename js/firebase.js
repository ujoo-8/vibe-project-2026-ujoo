// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsS5dW0CrHb5yHPZ9v9lk-xuZSE1RYhF8",
  authDomain: "vibe-project-ujoo.firebaseapp.com",
  projectId: "vibe-project-ujoo",
  storageBucket: "vibe-project-ujoo.firebasestorage.app",
  messagingSenderId: "626569777591",
  appId: "1:626569777591:web:0a36dd2d2aa911c99f9832"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);