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

    // ... (botones de scanner e imagen omitidos para brevedad en el mapeo)

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

    // ... (resto de funciones openModal, closeModal, renderTable iguales)

