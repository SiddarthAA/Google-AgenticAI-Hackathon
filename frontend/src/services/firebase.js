import { initializeApp } from "firebase/app";
import { getAuth , GoogleAuthProvider} from "firebase/auth";
//import { GoogleGenerativeAI } from "@google/generative-ai";

const firebaseConfig = {
  apiKey: "AIzaSyCGSGfqcvdTAOW-r5acaDdwp6LkAqrEo4k",
  authDomain: "agenticai-467106.firebaseapp.com",
  projectId: "agenticai-467106",
  storageBucket: "agenticai-467106.firebasestorage.app",
  messagingSenderId: "59317430987",
  appId: "1:59317430987:web:189a8896a7d309680e494e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// export const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");