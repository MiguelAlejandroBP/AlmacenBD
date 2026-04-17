// src/scripts/services/dbService.js
import { db } from '../firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const COLLECTION_NAME = 'productos';
const BAJAS_COLLECTION = 'bajas';

/**
 * Obtiene el inventario completo una sola vez.
 */
export const getInventory = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('nombre'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error obteniendo inventario:", error);
        return [];
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
