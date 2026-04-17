// src/scripts/utils/helpers.js

/**
 * Formatea una fecha a estilo institucional (DD/MM/YYYY)
 */
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

/**
 * Formatea moneda
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};