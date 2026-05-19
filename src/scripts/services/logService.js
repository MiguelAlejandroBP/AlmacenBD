// src/scripts/services/logService.js
import { db, auth } from '../firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const LOGS_COLLECTION = 'system_logs';

/**
 * Registra un evento o error en la base de datos para monitoreo.
 * Ahora incluye el usuario actual para trazabilidad (Audit Log).
 */
export const logEvent = async (level, message, detail = {}) => {
    try {
        const user = auth?.currentUser;
        const logData = {
            level: level, // 'INFO', 'WARNING', 'ERROR', 'AUDIT'
            message: message,
            detail: typeof detail === 'object' ? JSON.stringify(detail) : detail,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            userEmail: user ? user.email : 'Anónimo',
            userId: user ? user.uid : 'N/A'
        };

        // Guardar en Firestore
        await addDoc(collection(db, LOGS_COLLECTION), logData);
        
        // También imprimir en consola en desarrollo
        if (level === 'ERROR') {
            console.error(`[LOG ERROR]: ${message}`, detail);
        } else {
            console.log(`[LOG ${level}]: ${message}`);
        }
    } catch (err) {
        console.error("No se pudo guardar el log en Firebase:", err);
    }
};

/**
 * Decorador para capturar errores globales.
 */
export const initGlobalErrorLogging = () => {
    window.onerror = (message, source, lineno, colno, error) => {
        logEvent('ERROR', 'Error Global de Aplicación', {
            message, source, lineno, colno, stack: error?.stack
        });
    };

    window.onunhandledrejection = (event) => {
        logEvent('ERROR', 'Promesa no capturada', {
            reason: event.reason
        });
    };
};
