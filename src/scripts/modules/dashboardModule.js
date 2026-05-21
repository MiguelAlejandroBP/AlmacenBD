import { getInventory } from '../services/dbService.js';

export const initDashboard = async () => {
    const totalExistenciasEl = document.getElementById('total-existencias');
    const totalBajasEl = document.getElementById('total-bajas');
    const totalServiciosEl = document.getElementById('total-servicios');

    if (!totalExistenciasEl || !totalBajasEl || !totalServiciosEl) {
        console.warn("Dashboard elements not found");
        return;
    }

    try {
        const products = await getInventory();
        
        const total = products.length;
        const bajas = products.filter(p => p.estado === 'Baja').length;
        const enServicio = total - bajas;

        totalExistenciasEl.innerText = total;
        totalBajasEl.innerText = bajas;
        totalServiciosEl.innerText = enServicio;

    } catch (error) {
        console.error("Error al inicializar dashboard:", error);
    }
};
