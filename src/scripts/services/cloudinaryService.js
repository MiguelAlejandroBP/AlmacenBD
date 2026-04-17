/**
 * SERVICIO DE CLOUDINARY - ALMACENCONTROL
 * 
 * Este servicio gestiona la subida de imágenes a Cloudinary de forma segura
 * utilizando "Unsigned Upload Presets".
 */

const CLOUD_NAME = "dug68p68p"; // Reemplazar con tu Cloud Name
const UPLOAD_PRESET = "AlmacenBD"; // Reemplazar con tu Unsigned Upload Preset

/**
 * Sube una imagen a Cloudinary.
 * @param {File} file - El archivo de imagen obtenido de un input tipo file.
 * @returns {Promise<string>} - La URL segura (secure_url) de la imagen subida.
 */
export const uploadImage = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Error al subir la imagen');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error en Cloudinary Upload:", error);
        throw error;
    }
};

/**
 * Función para extraer el Public ID de una URL de Cloudinary (Útil para eliminación).
 * @param {string} url 
 */
export const getPublicIdFromUrl = (url) => {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.')[0];
};
