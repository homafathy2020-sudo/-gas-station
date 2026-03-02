import { useState, useCallback, useContext, createContext, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, getDocs, query, where } from "firebase/firestore";

// ==================== STAGING/PRODUCTION MODE ====================
const IS_STAGING = process.env.REACT_APP_ENV === 'staging' || 
                   (typeof window !== 'undefined' && localStorage.getItem('app_mode') === 'staging');

export const COLLECTION_PREFIX = IS_STAGING ? 'test_' : '';

if (typeof window !== 'undefined') {
  console.log(`🔥 App Mode: ${IS_STAGING ? 'STAGING 🧪' : 'PRODUCTION 🚀'}`);
  console.log(`📦 Using collections: ${COLLECTION_PREFIX}owners, ${COLLECTION_PREFIX}workers`);
}
