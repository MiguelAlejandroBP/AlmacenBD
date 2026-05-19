// src/scripts/services/dbService.js
import { db } from '../firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    setDoc,
    deleteDoc, 
    query, 
    orderBy, 
    onSnapshot,
    limit,
    startAfter 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { logEvent } from './logService.js';

const COLLECTION_NAME = 'productos';
const BAJAS_COLLECTION = 'bajas';
const USERS_COLLECTION = 'usuarios';
const CACHE_KEY = 'inventory_cache';

/**
 * Obtiene todos los usuarios registrados en la colección de Firestore.
 */
export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        logEvent('ERROR', 'Error obteniendo usuarios', { message: error.message });
        return [];
    }
};

/**
 * Guarda o actualiza la información de un usuario en Firestore.
 */
export const saveUserInDb = async (uid, userData) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        
        // Intentamos actualizar primero
        try {
            await updateDoc(userRef, {
                ...userData,
                lastUpdate: new Date().toISOString()
            });
        } catch (err) {
            // Si falla (probablemente porque no existe), creamos el documento
            await setDoc(userRef, {
                ...userData,
                createdAt: new Date().toISOString(),
                estado: 'Activo'
            });
        }
        return true;
    } catch (error) {
        logEvent('ERROR', 'Error guardando usuario en DB', { message: error.message });
        throw error;
    }
};



/**
 * Elimina un usuario de Firestore.
 */
export const deleteUserFromDb = async (uid) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        return await deleteDoc(userRef);
    } catch (error) {
        logEvent('ERROR', 'Error eliminando usuario de DB', { message: error.message });
        throw error;
    }
};


/**
 * Obtiene el inventario con soporte de caché local.
 */
export const getInventory = async () => {
    try {
        // Primero intentar obtener de caché para rapidez
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            logEvent('INFO', 'Cargando datos desde caché local');
        }

        const q = query(collection(db, COLLECTION_NAME), orderBy('nombre'));
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Guardar en caché para la próxima vez
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        
        return products;
    } catch (error) {
        logEvent('ERROR', 'Error obteniendo inventario', { message: error.message });
        const cachedData = localStorage.getItem(CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : [];
    }
};

/**
 * Obtiene el inventario de forma paginada.
 */
export const getInventoryPaginated = async (pageSize = 10, lastDoc = null) => {
    try {
        let q;
        if (lastDoc) {
            q = query(collection(db, COLLECTION_NAME), orderBy('nombre'), startAfter(lastDoc), limit(pageSize));
        } else {
            q = query(collection(db, COLLECTION_NAME), orderBy('nombre'), limit(pageSize));
        }
        
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        return { products, lastDoc: newLastDoc };
    } catch (error) {
        logEvent('ERROR', 'Error en paginación de inventario', { message: error.message });
        throw error;
    }
};

/**
 * Suscribe a los cambios del inventario en tiempo real.
 */
export const onInventoryUpdate = (callback) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('fechaRegistro', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const productos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(productos);
    });
};

/**
 * Agrega un nuevo producto.
 */
export const addProduct = async (productData) => {
    try {
        return await addDoc(collection(db, COLLECTION_NAME), {
            ...productData,
            fechaRegistro: productData.fechaRegistro || new Date().toISOString()
        });
    } catch (error) {
        console.error("Error al agregar producto:", error);
        throw error;
    }
};

/**
 * Actualiza un producto existente.
 */
export const updateProduct = async (id, productData) => {
    try {
        const productRef = doc(db, COLLECTION_NAME, id);
        return await updateDoc(productRef, productData);
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
};

/**
 * Elimina un producto.
 */
export const deleteProduct = async (id) => {
    try {
        const productRef = doc(db, COLLECTION_NAME, id);
        return await deleteDoc(productRef);
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
    }
};

/**
 * Registra una nueva baja y actualiza el estado del producto.
 */
export const registerBaja = async (bajaData) => {
    try {
        // 1. Registrar la baja
        await addDoc(collection(db, BAJAS_COLLECTION), {
            ...bajaData,
            fecha: new Date().toISOString()
        });

        // 2. Actualizar el estado del producto a "Baja"
        const productRef = doc(db, COLLECTION_NAME, bajaData.productoId);
        await updateDoc(productRef, {
            estado: 'Baja'
        });
        
        return true;
    } catch (error) {
        console.error("Error al registrar baja:", error);
        throw error;
    }
};

/**
 * Suscribe a las bajas en tiempo real.
 */
export const onBajasUpdate = (callback) => {
    const q = query(collection(db, BAJAS_COLLECTION), orderBy('fecha', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bajas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(bajas);
    });
};
