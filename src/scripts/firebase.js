/**
 * CONFIGURACIÓN DE FIREBASE - ALMACENCONTROL
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    createUserWithEmailAndPassword,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqGHRy9v-FEwCzK42j_4csuoUpQ2Q-qmA",
  authDomain: "almacenbd-f59e2.firebaseapp.com",
  projectId: "almacenbd-f59e2",
  storageBucket: "almacenbd-f59e2.firebasestorage.app",
  messagingSenderId: "442654900004",
  appId: "1:442654900004:web:29d2219a4c8eef4a0afdb1",
  measurementId: "G-BZTJN16BZ6"
};
// Inicialización segura
let app;
export let auth;
export let db;
export let storage;

try {
    if (firebaseConfig.apiKey !== "TU_API_KEY_AQUÍ") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } else {
        console.warn("Firebase: Credenciales no configuradas. El sistema funcionará en modo limitado.");
    }
} catch (error) {
    console.error("Firebase: Error de inicialización:", error);
}

/**
 * FUNCIONES BASE DE AUTENTICACIÓN
 */

export const login = async (email, password) => {
    if (!auth) throw new Error("Firebase no configurado");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const logout = async () => {
    if (!auth) return;
    await signOut(auth);
};

export const registrarUsuario = async (email, password) => {
    if (!auth) throw new Error("Firebase no configurado");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const onAuthUpdate = (callback) => {
    if (!auth) {
        // Si no hay Firebase, simulamos que no hay usuario para permitir ver el login
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};
