import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database"; // or getFirestore for Firestore

const firebaseConfig = {
  apiKey: "AIzaSyD47dKmbh4POPm76OVOxZK8RAv2axJEE-I",
  authDomain: "collaborative-whiteboard-e2cfc.firebaseapp.com",
  databaseURL: "https://collaborative-whiteboard-e2cfc-default-rtdb.firebaseio.com",
  projectId: "collaborative-whiteboard-e2cfc",
  storageBucket: "collaborative-whiteboard-e2cfc.firebasestorage.app",
  messagingSenderId: "731824949795",
  appId: "1:731824949795:web:4aaf50947756fe42d0bf96",
  measurementId: "G-3ZY0RYVEEB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app); // or getFirestore(app)
