import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../firebase"; // Import db
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import Firestore functions

import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // New State for Role
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 1. Signup (Updated to create User Document in Firestore)
  async function signup(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a document in 'users' collection with default role 'user'
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "user", // Default role
      createdAt: new Date()
    });

    // Send Welcome Email
    try {
      await axios.post(`${API_URL}/api/send-welcome`, {
        email: user.email,
        name: user.email.split('@')[0]
      });
    } catch (e) { console.error("Email failed", e); }
    
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  // Check User & Fetch Role on Load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch the user's role from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        } else {
          // If logged in via Google for the first time, create the doc
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "user",
            createdAt: new Date()
          });
          setUserRole("user");
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole, // Export the role so pages can check it
    signup,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}