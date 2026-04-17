import { onInventoryUpdate, registerBaja, onBajasUpdate } from '../services/dbService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { generarTicketPDF } from '../utils/pdfGenerator.js';

let availableProducts = [];
let currentBajas = [];
let unsubscribeInventory = null;
let unsubscribeBajas = null;

export const initBajas = () => {
    const form = document.getElementById('form-baja');
    const select = document.getElementById('baja-producto');
    const tableBody = document.getElementById('bajas-table-body');
    const searchInput = document.getElementById('bajas-search');

    const imageFileInput = document.getElementById('baja-image-file');
    const imagePreview = document.getElementById('baja-preview-container');
    const uploadStatus = document.getElementById('baja-upload-status');

    if (!form || !select || !tableBody) return;

    if (imageFileInput) {
        imageFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        };
    }

    const updateSelect = (products) => {
        availableProducts = products.filter(p => p.estado !== 'Baja');
        select.innerHTML = '<option value="">Seleccione un producto...</option>' + 
            availableProducts.map(p => `
                <option value="${p.id}">${p.nombre} (${p.marca})</option>
            `).join('');
    };

    const renderBajasTable = (bajas) => {
        tableBody.innerHTML = bajas.map(b => `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.8rem;">${new Date(b.fecha).toLocaleDateString()}</td>
                <td style="padding: 0.75rem 1rem; font-weight: 500;">${b.productoNombre}</td>
                <td style="padding: 0.75rem 1rem; color: var(--secondary-color); font-size: 0.8rem;">${b.motivo}</td>
                <td style="padding: 0.75rem 1rem; text-align: right; white-space: nowrap;">
                    <button class="btn-ticket-baja" data-id="${b.id}" title="Ver Ticket" style="background: none; border: none; cursor: pointer; margin-right: 8px;">📄</button>
                    ${b.evidenciaImagen ? 
                        `<a href="${b.evidenciaImagen}" target="_blank" style="color: var(--primary-color); font-size: 0.75rem; font-weight: 600;">Ver Foto</a>` : 
                        '<span style="color: #ccc; font-size: 0.75rem;">N/A</span>'}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay registros</td></tr>';

        // Re-asignar eventos
        document.querySelectorAll('.btn-ticket-baja').forEach(btn => {
            btn.onclick = () => {
                const baja = currentBajas.find(bj => bj.id === btn.dataset.id);
                generarTicketPDF({
                    nombre: baja.productoNombre,
                    fecha: baja.fecha,
                    responsable: "Administrador",
                    tipo: 'Registro de Baja'
                });
            };
        });
    };

    if (searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = currentBajas.filter(b => 
                b.productoNombre.toLowerCase().includes(term) || 
                b.motivo.toLowerCase().includes(term)
            );
            renderBajasTable(filtered);
        };
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const productoId = select.value;
        const motivo = document.getElementById('baja-motivo').value;
        const submitBtn = form.querySelector('button');
        const imageFile = imageFileInput.files[0];

        const producto = availableProducts.find(p => p.id === productoId);
        if (!producto) return alert("Seleccione un producto válido");

        if (!confirm(`¿Dar de baja definitiva a "${producto.nombre}"?`)) return;

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Registrando...';

            let evidenciaURL = "";
            if (imageFile) {
                uploadStatus.style.display = 'block';
                evidenciaURL = await uploadImage(imageFile);
            }

            const bajaData = {
                productoId,
                productoNombre: producto.nombre,
                motivo,
                evidenciaImagen: evidenciaURL,
                fecha: new Date().toISOString()
            };

            await registerBaja(bajaData);

            if (confirm('¿Deseas descargar el ticket de baja?')) {
                generarTicketPDF({
                    nombre: bajaData.productoNombre,
                    fecha: bajaData.fecha,
                    responsable: "Administrador",
                    tipo: 'Registro de Baja'
                });
            }

            form.reset();
            imagePreview.innerHTML = `<span style="font-size: 1.2rem; color: var(--text-muted);">📷</span>`;
            alert("Baja registrada correctamente.");
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Registrar Baja Definitiva';
            uploadStatus.style.display = 'none';
        }
    };

    if (unsubscribeInventory) unsubscribeInventory();
    unsubscribeInventory = onInventoryUpdate(updateSelect);

    if (unsubscribeBajas) unsubscribeBajas();
    unsubscribeBajas = onBajasUpdate((bajas) => {
        currentBajas = bajas;
        renderBajasTable(bajas);
    });
};
