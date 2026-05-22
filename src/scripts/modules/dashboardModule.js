import { onInventoryUpdate } from '../services/dbService.js';

let unsubscribeInventory = null;

export const initDashboard = () => {
    const totalExistenciasEl = document.getElementById('total-existencias');
    const totalBajasEl = document.getElementById('total-bajas');
    const totalServiciosEl = document.getElementById('total-servicios');

    if (!totalExistenciasEl || !totalBajasEl || !totalServiciosEl) {
        console.warn("Dashboard elements not found");
        return;
    }

    if (unsubscribeInventory) unsubscribeInventory();

    unsubscribeInventory = onInventoryUpdate((products) => {
        try {
            const total = products.length;
            const bajas = products.filter(p => p.estado === 'Baja').length;
            const enServicio = products.filter(p => p.estado !== 'Baja').length;

            totalExistenciasEl.innerText = total;
            totalBajasEl.innerText = bajas;
            totalServiciosEl.innerText = enServicio;

            // Actualizar fecha
            const dateEl = document.getElementById('current-date');
            if (dateEl) dateEl.innerText = new Date().toLocaleDateString();

        } catch (error) {
            console.error("Error al procesar datos del dashboard:", error);
        }
    });
};
