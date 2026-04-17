import { db } from '../firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const initGlobalSearch = () => {
    const searchInput = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsList = document.getElementById('search-results-list');

    if (!searchInput || !resultsContainer || !resultsList) return;

    let allData = {
        productos: [],
        bajas: []
    };

    /**
     * Carga inicial de datos para búsqueda rápida
     */
    const loadSearchData = async () => {
        try {
            const [prodSnap, bajaSnap] = await Promise.all([
                getDocs(collection(db, 'productos')),
                getDocs(collection(db, 'bajas'))
            ]);

            allData.productos = prodSnap.docs.map(doc => ({ id: doc.id, type: 'Producto', ...doc.data() }));
            allData.bajas = bajaSnap.docs.map(doc => ({ id: doc.id, type: 'Baja', ...doc.data() }));
        } catch (error) {
            console.error("Error cargando datos de búsqueda:", error);
        }
    };

    const performSearch = (term) => {
        if (!term) {
            resultsContainer.style.display = 'none';
            return;
        }

        const searchTerm = term.toLowerCase();
        
        // Filtrar productos
        const filteredProds = allData.productos.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) || 
            (p.numeroSerie && p.numeroSerie.toLowerCase().includes(searchTerm)) ||
            p.marca.toLowerCase().includes(searchTerm)
        );

        // Filtrar bajas
        const filteredBajas = allData.bajas.filter(b => 
            b.productoNombre.toLowerCase().includes(searchTerm) || 
            b.motivo.toLowerCase().includes(searchTerm)
        );

        renderResults([...filteredProds, ...filteredBajas]);
    };

    const renderResults = (results) => {
        if (results.length === 0) {
            resultsList.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">No se encontraron resultados</div>';
        } else {
            resultsList.innerHTML = results.map(item => `
                <div class="search-item" style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s; border-radius: 4px;" 
                     onclick="window.location.hash = '${item.type === 'Producto' ? '#inventario' : '#bajas'}'; document.getElementById('search-results-container').style.display='none';">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                        <span style="font-weight: 600; font-size: 0.9rem;">${item.type === 'Producto' ? item.nombre : item.productoNombre}</span>
                        <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${item.type === 'Producto' ? '#dbeafe' : '#fee2e2'}; color: ${item.type === 'Producto' ? '#1e40af' : '#991b1b'};">
                            ${item.type}
                        </span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--secondary-color);">
                        ${item.type === 'Producto' ? `S/N: ${item.numeroSerie || '---'} | Estado: ${item.estado}` : `Motivo: ${item.motivo}`}
                    </div>
                </div>
            `).join('');

            // Hover effect
            document.querySelectorAll('.search-item').forEach(el => {
                el.onmouseover = () => el.style.background = '#f8fafc';
                el.onmouseout = () => el.style.background = 'transparent';
            });
        }
        resultsContainer.style.display = 'block';
    };

    // Eventos
    searchInput.oninput = (e) => performSearch(e.target.value);

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });

    // Cargar datos al iniciar
    loadSearchData();
};
