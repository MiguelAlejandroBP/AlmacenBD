import { onInventoryUpdate, registerBaja, onBajasUpdate } from '../services/dbService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { generarTicketPDF } from '../utils/pdfGenerator.js';
import { state } from '../app.js';

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

    const getStatusBadge = (status) => {
        const styles = {
            'Por Procesar': 'background: rgba(245,158,11,0.1); color: #f59e0b;',
            'En Revisión': 'background: rgba(59,130,246,0.1); color: #3b82f6;',
            'Procesada': 'background: rgba(16,185,129,0.1); color: #10b981;',
            'Rechazada': 'background: rgba(239,68,68,0.1); color: #ef4444;'
        };
        return `<span style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; ${styles[status] || ''}">${status}</span>`;
    };

    const renderBajasTable = (bajas) => {
        const isAdmin = state.user?.rol === 'Admin';
        
        tableBody.innerHTML = bajas.map(b => `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem 1.5rem; color: var(--text-muted); font-size: 0.8rem;">${new Date(b.fecha).toLocaleDateString()}</td>
                <td style="padding: 1rem 1.5rem; font-weight: 600; color: white;">${b.productoNombre}</td>
                <td style="padding: 1rem 1.5rem;">
                    ${isAdmin ? `
                        <select class="change-baja-status" data-id="${b.id}" style="padding: 4px 8px; border-radius: 8px; background: var(--bg-color); color: white; border: 1px solid var(--border-color); font-size: 0.8rem;">
                            <option value="Por Procesar" ${b.estado === 'Por Procesar' ? 'selected' : ''}>Por Procesar</option>
                            <option value="En Revisión" ${b.estado === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
                            <option value="Procesada" ${b.estado === 'Procesada' ? 'selected' : ''}>Procesada</option>
                            <option value="Rechazada" ${b.estado === 'Rechazada' ? 'selected' : ''}>Rechazada</option>
                        </select>
                    ` : getStatusBadge(b.estado || 'Por Procesar')}
                </td>
                <td style="padding: 1rem 1.5rem; color: var(--text-main); font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${b.motivo}">
                    ${b.motivo}
                </td>
                <td style="padding: 1rem 1.5rem; text-align: right; white-space: nowrap;">
                    <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
                        <button class="btn-ticket-baja" data-id="${b.id}" title="Ver Ticket" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">📄</button>
                        ${b.evidenciaImagen ? 
                            `<a href="${b.evidenciaImagen}" target="_blank" style="text-decoration: none; font-size: 1.1rem;" title="Ver Evidencia">🖼️</a>` : 
                            '<span style="opacity: 0.3; font-size: 1.1rem;">🖼️</span>'}
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="padding: 3rem; text-align: center; color: var(--text-muted);">No se encontraron registros de bajas.</td></tr>';

        // Re-asignar eventos de ticket
        document.querySelectorAll('.btn-ticket-baja').forEach(btn => {
            btn.onclick = () => {
                const baja = currentBajas.find(bj => bj.id === btn.dataset.id);
                generarTicketPDF({
                    nombre: baja.productoNombre,
                    fecha: baja.fecha,
                    responsable: state.user?.email || "Usuario",
                    tipo: 'Registro de Baja',
                    estado: baja.estado || 'Por Procesar'
                });
            };
        });

        // Eventos para cambiar estado (solo Admin)
        if (isAdmin) {
            document.querySelectorAll('.change-baja-status').forEach(selectEl => {
                selectEl.onchange = async (e) => {
                    const id = selectEl.dataset.id;
                    const newStatus = e.target.value;
                    try {
                        const { updateBajaStatus } = await import('../services/dbService.js');
                        await updateBajaStatus(id, newStatus);
                        // El snapshot se encargará de refrescar la lista
                    } catch (error) {
                        alert("Error al actualizar estado: " + error.message);
                    }
                };
            });
        }
    };

    const statusFilter = document.getElementById('filter-baja-status');
    const applyFilters = () => {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const selectedStatus = statusFilter?.value || '';

        const filtered = currentBajas.filter(b => {
            const matchesSearch = b.productoNombre.toLowerCase().includes(searchTerm) || 
                                  b.motivo.toLowerCase().includes(searchTerm);
            const matchesStatus = selectedStatus === '' || b.estado === selectedStatus;
            return matchesSearch && matchesStatus;
        });
        renderBajasTable(filtered);
    };

    if (searchInput) searchInput.oninput = applyFilters;
    if (statusFilter) statusFilter.onchange = applyFilters;

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
                fecha: new Date().toISOString(),
                estado: 'Por Procesar' // Estado inicial por defecto
            };

            await registerBaja(bajaData);

            if (confirm('¿Deseas descargar el ticket de baja?')) {
                generarTicketPDF({
                    nombre: bajaData.productoNombre,
                    fecha: bajaData.fecha,
                    responsable: state.user?.email || "Usuario",
                    tipo: 'Registro de Baja',
                    estado: 'Por Procesar'
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
