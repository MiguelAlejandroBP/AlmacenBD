import { 
    onInventoryUpdate, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    getInventoryPaginated
} from '../services/dbService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { generarTicketPDF } from '../utils/pdfGenerator.js';
import { ScannerService } from '../utils/scannerService.js';

let currentProducts = [];
let unsubscribe = null;
let lastVisibleDoc = null;
const PAGE_SIZE = 5; // Tamaño pequeño para notar la paginación

export const initInventory = () => {
    const tableBody = document.getElementById('inventory-table-body');
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const searchInput = document.getElementById('inventory-search');

    const btnScan = document.getElementById('btn-scan-barcode');
    const scannerModal = document.getElementById('scanner-modal');
    const btnCloseScanner = document.getElementById('btn-close-scanner');
    const btnScanImage = document.getElementById('btn-scan-image');
    const scanImageInput = document.getElementById('scan-image-input');

    const handleDetectedCode = (code) => {
        scannerModal.style.display = 'none';
        
        // Buscar si el producto existe
        const product = currentProducts.find(p => p.numeroSerie === code);
        
        if (product) {
            alert(`Producto encontrado: ${product.nombre}`);
            openModal(product);
        } else {
            if (confirm(`El producto con S/N: ${code} no existe. ¿Desea registrarlo como nuevo?`)) {
                openModal();
                document.getElementById('p-numeroSerie').value = code;
            }
        }
    };

    if (btnScan) {
        btnScan.onclick = () => {
            scannerModal.style.display = 'flex';
            ScannerService.start('#scanner-container', handleDetectedCode);
        };
        btnCloseScanner.onclick = () => {
            scannerModal.style.display = 'none';
            ScannerService.stop();
        };
    }

    if (btnScanImage && scanImageInput) {
        btnScanImage.onclick = () => scanImageInput.click();
        scanImageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            ScannerService.decodeImage(file, (code) => {
                handleDetectedCode(code);
                scanImageInput.value = ''; // Limpiar input
            });
        };
    }

    // --- Lógica de Imagen ---
    const imageInput = document.getElementById('p-image-file');
    const imagePreview = document.getElementById('image-preview-container');
    const uploadStatus = document.getElementById('upload-status');
    const imagenURLInput = document.getElementById('p-imagenURL');

    if (imageInput) {
        imageInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                uploadStatus.style.display = 'block';
                const url = await uploadImage(file);
                imagenURLInput.value = url;
                imagePreview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
                uploadStatus.innerText = '✅ Imagen lista';
            } catch (err) {
                alert("Error al subir imagen");
                uploadStatus.style.display = 'none';
            }
        };
    }

    const btnImportCsv = document.getElementById('btn-import-csv');
    const csvInput = document.getElementById('csv-file-input');

    if (btnImportCsv && csvInput) {
        btnImportCsv.onclick = () => csvInput.click();
        csvInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target.result;
                const rows = text.split('\n').filter(row => row.trim() !== '');
                const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                
                let successCount = 0;
                let errorCount = 0;

                // Empezar desde la fila 1 (saltar cabecera)
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(',').map(v => v.trim());
                    if (values.length < headers.length) continue;

                    const productData = {};
                    headers.forEach((header, index) => {
                        productData[header] = values[index];
                    });

                    // Validaciones mínimas
                    if (!productData.nombre) continue;

                    try {
                        await addProduct({
                            nombre: productData.nombre,
                            marca: productData.marca || 'Genérico',
                            modelo: productData.modelo || '',
                            color: productData.color || '',
                            numeroSerie: productData.numeroserie || productData.sn || '',
                            estado: productData.estado || 'Nuevo',
                            tipo: productData.tipo || 'activo',
                            responsable: productData.responsable || 'Sin asignar',
                            imagenURL: ''
                        });
                        successCount++;
                    } catch (err) {
                        errorCount++;
                    }
                }

                alert(`Carga masiva finalizada.\nÉxitos: ${successCount}\nErrores: ${errorCount}`);
                loadInventoryData(true);
                csvInput.value = ''; // Limpiar input
            };
            reader.readAsText(file);
        };
    }

    // --- Lógica de Paginación ---
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.innerText = 'Cargar más resultados';
    loadMoreBtn.className = 'btn-secondary';
    loadMoreBtn.style.cssText = 'display: block; margin: 20px auto; width: 200px;';
    
    if (tableBody && !document.getElementById('btn-load-more')) {
        loadMoreBtn.id = 'btn-load-more';
        tableBody.closest('.card').appendChild(loadMoreBtn);
    }

    const loadInventoryData = async (reset = false) => {
        if (reset) {
            lastVisibleDoc = null;
            currentProducts = [];
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>';
        }
        
        try {
            const { products, lastDoc } = await getInventoryPaginated(PAGE_SIZE, lastVisibleDoc);
            lastVisibleDoc = lastDoc;
            
            if (reset) {
                currentProducts = products;
            } else {
                currentProducts = [...currentProducts, ...products];
            }

            renderTable(currentProducts);
            
            if (products.length < PAGE_SIZE) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        } catch (error) {
            console.error("Error cargando inventario:", error);
        }
    };

    loadMoreBtn.onclick = () => loadInventoryData(false);

    // --- Debounce para Búsqueda ---
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    searchInput.oninput = debounce((e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentProducts.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            (p.numeroSerie && p.numeroSerie.toLowerCase().includes(term)) ||
            p.marca.toLowerCase().includes(term)
        );
        renderTable(filtered);
    }, 400);

    // Inicializar carga
    loadInventoryData(true);

    const openModal = (product = null) => {
        const modalTitle = document.getElementById('modal-title');
        const imagePreview = document.getElementById('image-preview-container');
        const uploadStatus = document.getElementById('upload-status');

        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('p-imagenURL').value = '';
        imagePreview.innerHTML = '<span style="font-size: 1.8rem; color: var(--text-muted);">📷</span>';
        uploadStatus.style.display = 'none';

        if (product) {
            modalTitle.innerText = 'Editar Producto';
            document.getElementById('product-id').value = product.id;
            document.getElementById('p-nombre').value = product.nombre || '';
            document.getElementById('p-marca').value = product.marca || '';
            document.getElementById('p-modelo').value = product.modelo || '';
            document.getElementById('p-color').value = product.color || '';
            document.getElementById('p-numeroSerie').value = product.numeroSerie || '';
            document.getElementById('p-estado').value = product.estado || 'Nuevo';
            document.getElementById('p-tipo').value = product.tipo || 'activo';
            document.getElementById('p-responsable').value = product.responsable || '';

            if (product.imagenURL) {
                document.getElementById('p-imagenURL').value = product.imagenURL;
                imagePreview.innerHTML = `<img src="${product.imagenURL}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        } else {
            modalTitle.innerText = 'Agregar Nuevo Producto';
        }
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    btnOpenModal.onclick = () => openModal();
    btnCloseModal.onclick = closeModal;
    btnCancel.onclick = closeModal;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const btnSubmit = form.querySelector('button[type="submit"]');

        const productData = {
            nombre: document.getElementById('p-nombre').value,
            marca: document.getElementById('p-marca').value,
            modelo: document.getElementById('p-modelo').value,
            color: document.getElementById('p-color').value,
            numeroSerie: document.getElementById('p-numeroSerie').value,
            estado: document.getElementById('p-estado').value,
            tipo: document.getElementById('p-tipo').value,
            responsable: document.getElementById('p-responsable').value,
            imagenURL: document.getElementById('p-imagenURL').value
        };

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Guardando...';

            if (id) {
                await updateProduct(id, productData);
            } else {
                await addProduct(productData);
            }

            closeModal();
            loadInventoryData(true);
        } catch (error) {
            alert("Error al guardar: " + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Guardar Producto';
        }
    };

    const userRole = state.user?.rol;
    const canManageInventory = userRole === 'Admin';

    if (!canManageInventory) {
        if (btnOpenModal) btnOpenModal.style.display = 'none';
        if (btnImportCsv) btnImportCsv.style.display = 'none';
    }

    const renderTable = (products) => {
        tableBody.innerHTML = products.map(p => `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--bg-color); overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
                            ${p.imagenURL ? `<img src="${p.imagenURL}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 1.2rem;">📦</span>'}
                        </div>
                        <span style="font-weight: 600; color: white;">${p.nombre}</span>
                    </div>
                </td>
                <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${p.marca} / ${p.modelo || '---'}</td>
                <td style="padding: 1rem 1.5rem; font-family: monospace; color: var(--text-main);">${p.numeroSerie || '---'}</td>
                <td style="padding: 1rem 1.5rem;">
                    <span style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; background: ${p.tipo === 'activo' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${p.tipo === 'activo' ? '#22c55e' : '#f59e0b'}; font-weight: 600; text-transform: uppercase;">
                        ${p.tipo === 'activo' ? 'Activo' : 'Gasto'}
                    </span>
                </td>
                <td style="padding: 1rem 1.5rem;">
                    <span style="display: inline-flex; align-items: center; gap: 6px; color: ${p.estado === 'Nuevo' ? '#10b981' : '#f59e0b'}; font-weight: 600;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor;"></span>
                        ${p.estado}
                    </span>
                </td>
                <td style="padding: 1rem 1.5rem; color: var(--text-main);">${p.responsable || 'Sin asignar'}</td>
                <td style="padding: 1rem 1.5rem; text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-print" data-id="${p.id}" title="Imprimir Ticket" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🖨️</button>
                        ${canManageInventory ? `
                            <button class="btn-edit" data-id="${p.id}" title="Editar" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">✏️</button>
                            <button class="btn-delete" data-id="${p.id}" title="Eliminar" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Asignar eventos
        if (canManageInventory) {
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.onclick = () => {
                    const product = products.find(p => p.id === btn.dataset.id);
                    openModal(product);
                };
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('¿Desea eliminar este producto?')) {
                        try {
                            await deleteProduct(btn.dataset.id);
                            loadInventoryData(true);
                        } catch (error) {
                            alert("Error al eliminar");
                        }
                    }
                };
            });
        }

        document.querySelectorAll('.btn-print').forEach(btn => {
            btn.onclick = () => {
                const product = products.find(p => p.id === btn.dataset.id);
                generarTicketPDF(product);
            };
        });
    };
};

