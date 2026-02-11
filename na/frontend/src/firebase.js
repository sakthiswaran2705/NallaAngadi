// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 🔹 ENV based config
const firebaseConfig = {
  apiKey: "AIzaSyATXff_DRUrGxR7pDZdSx_isFKDRtV0UeA",
  authDomain: "nallaangadi.firebaseapp.com",
  projectId: "nallaangadi",
  storageBucket: "nallaangadi.firebasestorage.app",
  messagingSenderId: "771085583172",
  appId: "1:771085583172:web:f827741ae80d1a4493cd11",
  measurementId: "G-XXQMNSZFEL"
};

const app = initializeApp(firebaseConfig);

// ✅ ONLY THIS is needed for OTP
export const auth = getAuth(app);

// Your web app's Firebase configuration
