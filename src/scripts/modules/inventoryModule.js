import { 
    onInventoryUpdate, 
    addProduct, 
    updateProduct, 
    deleteProduct 
} from '../services/dbService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { generarTicketPDF } from '../utils/pdfGenerator.js';
import { ScannerService } from '../utils/scannerService.js';

let currentProducts = [];
let unsubscribe = null;

export const initInventory = () => {
    const tableBody = document.getElementById('inventory-table-body');
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const searchInput = document.getElementById('inventory-search');

    const btnScanBarcode = document.getElementById('btn-scan-barcode');
    const scannerModal = document.getElementById('scanner-modal');
    const btnCloseScanner = document.getElementById('btn-close-scanner');

    const imageFileInput = document.getElementById('p-image-file');
    const imagePreview = document.getElementById('image-preview-container');
    const uploadStatus = document.getElementById('upload-status');
    const hiddenImageUrl = document.getElementById('p-imagenURL');

    if (!tableBody || !modal || !form) return;

    if (btnScanBarcode) {
        btnScanBarcode.onclick = () => {
            scannerModal.style.display = 'flex';
            ScannerService.start('#scanner-container', (code) => {
                scannerModal.style.display = 'none';
                const productExists = currentProducts.find(p => p.id === code);
                if (productExists) {
                    window.location.hash = `#producto?id=${code}`;
                } else {
                    searchInput.value = code;
                    const event = new Event('input', { bubbles: true });
                    searchInput.dispatchEvent(event);
                }
            });
        };
    }

    if (btnCloseScanner) {
        btnCloseScanner.onclick = () => {
            scannerModal.style.display = 'none';
            ScannerService.stop();
        };
    }

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

    const openModal = (product = null) => {
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('modal-title').innerText = 'Agregar Producto';
        imagePreview.innerHTML = `<span style="font-size: 1.2rem; color: var(--text-muted);">📷</span>`;
        hiddenImageUrl.value = '';

        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('modal-title').innerText = 'Editar Producto';
            document.getElementById('p-nombre').value = product.nombre || '';
            document.getElementById('p-marca').value = product.marca || '';
            document.getElementById('p-modelo').value = product.modelo || '';
            document.getElementById('p-color').value = product.color || '';
            document.getElementById('p-numeroSerie').value = product.numeroSerie || '';
            document.getElementById('p-estado').value = product.estado || 'Nuevo';
            document.getElementById('p-tipo').value = product.tipo || 'activo';
            document.getElementById('p-responsable').value = product.responsable || '';
            hiddenImageUrl.value = product.imagenURL || '';
            
            if (product.imagenURL) {
                imagePreview.innerHTML = `<img src="${product.imagenURL}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        }
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    const renderTable = (products) => {
        // En móvil, td:before usa data-label para el encabezado
        tableBody.innerHTML = products.map(p => `
            <tr>
                <td data-label="Nombre" style="padding: 0.75rem 1rem; font-weight: 600;">
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
                        ${p.imagenURL ? `<img src="${p.imagenURL}" style="width: 28px; height: 28px; border-radius: 4px; object-fit: cover;">` : '<div style="width: 28px; height: 28px; background: #f1f5f9; border-radius: 4px;"></div>'}
                        ${p.nombre}
                    </div>
                </td>
                <td data-label="Marca/Modelo" style="padding: 0.75rem 1rem;">${p.marca} / ${p.modelo || 'N/A'}</td>
                <td data-label="S/N" style="padding: 0.75rem 1rem; font-family: monospace;">${p.numeroSerie || '---'}</td>
                <td data-label="Tipo" style="padding: 0.75rem 1rem; text-transform: capitalize;">${p.tipo}</td>
                <td data-label="Estado" style="padding: 0.75rem 1rem;">
                    <span style="background: ${getStatusColor(p.estado)}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">
                        ${p.estado}
                    </span>
                </td>
                <td data-label="Responsable" style="padding: 0.75rem 1rem;">${p.responsable || 'Sin asignar'}</td>
                <td class="actions-cell" style="padding: 0.75rem 1rem; text-align: right; white-space: nowrap;">
                    <button class="btn-ticket" data-id="${p.id}" title="Ticket" style="background: none; border: none; font-size: 1.25rem;">📄</button>
                    <button class="btn-edit" data-id="${p.id}" title="Editar" style="background: none; border: none; color: var(--primary-color); font-size: 1.25rem;">✏️</button>
                    <button class="btn-delete" data-id="${p.id}" title="Eliminar" style="background: none; border: none; color: var(--error-color); font-size: 1.25rem;">🗑️</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" style="padding: 2rem; text-align: center;">No hay registros</td></tr>';

        document.querySelectorAll('.btn-ticket').forEach(btn => {
            btn.onclick = () => {
                const product = currentProducts.find(prod => prod.id === btn.dataset.id);
                generarTicketPDF({
                    id: product.id,
                    nombre: product.nombre,
                    fecha: product.fechaRegistro || new Date().toISOString(),
                    responsable: product.responsable,
                    tipo: 'Registro de Alta'
                });
            };
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => {
                const product = currentProducts.find(prod => prod.id === btn.dataset.id);
                openModal(product);
            };
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('¿Eliminar producto?')) await deleteProduct(btn.dataset.id);
            };
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Nuevo': return '#10b981';
            case 'Buen Estado': return '#3b82f6';
            case 'Regular': return '#f59e0b';
            case 'Dañado': return '#ef4444';
            case 'Baja': return '#64748b';
            default: return '#64748b';
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const imageFile = imageFileInput.files[0];

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Guardando...';

            let finalImageUrl = hiddenImageUrl.value;
            if (imageFile) {
                uploadStatus.style.display = 'block';
                finalImageUrl = await uploadImage(imageFile);
            }

            const productData = {
                nombre: document.getElementById('p-nombre').value,
                marca: document.getElementById('p-marca').value,
                modelo: document.getElementById('p-modelo').value,
                color: document.getElementById('p-color').value,
                numeroSerie: document.getElementById('p-numeroSerie').value,
                estado: document.getElementById('p-estado').value,
                tipo: document.getElementById('p-tipo').value,
                responsable: document.getElementById('p-responsable').value,
                imagenURL: finalImageUrl,
                fechaRegistro: new Date().toISOString()
            };

            if (id) {
                await updateProduct(id, productData);
            } else {
                const docRef = await addProduct(productData);
                if (confirm('¿Deseas descargar el ticket?')) {
                    generarTicketPDF({
                        id: docRef.id,
                        nombre: productData.nombre,
                        fecha: productData.fechaRegistro,
                        responsable: productData.responsable,
                        tipo: 'Registro de Alta'
                    });
                }
            }
            closeModal();
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Guardar';
            uploadStatus.style.display = 'none';
        }
    };

    btnOpenModal.onclick = () => openModal();
    btnCloseModal.onclick = closeModal;
    btnCancel.onclick = closeModal;

    searchInput.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentProducts.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            (p.numeroSerie && p.numeroSerie.toLowerCase().includes(term)) ||
            p.marca.toLowerCase().includes(term)
        );
        renderTable(filtered);
    };

    if (unsubscribe) unsubscribe();
    unsubscribe = onInventoryUpdate((products) => {
        currentProducts = products;
        renderTable(products);
    });
};
