// src/scripts/services/logService.js
import { db } from '../firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const LOGS_COLLECTION = 'system_logs';

/**
 * Registra un evento o error en la base de datos para monitoreo.
 */
export const logEvent = async (level, message, detail = {}) => {
    try {
        const logData = {
            level: level, // 'INFO', 'WARNING', 'ERROR'
            message: message,
            detail: typeof detail === 'object' ? JSON.stringify(detail) : detail,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
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
