import { db } from '../firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const initProductDetail = async () => {
    // Obtener ID del producto desde el hash #producto?id=XXX
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.split('?')[1]);
    const productId = urlParams.get('id');

    const card = document.getElementById('product-detail-card');
    if (!productId || !card) return;

    try {
        const productRef = doc(db, 'productos', productId);
        const docSnap = await getDoc(productRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Llenar interfaz
            document.getElementById('detail-id').innerText = productId;
            document.getElementById('detail-nombre').innerText = data.nombre;
            document.getElementById('detail-marca-modelo').innerText = `${data.marca} / ${data.modelo || 'N/A'}`;
            document.getElementById('detail-sn').innerText = data.numeroSerie || 'SIN NÚMERO DE SERIE';
            document.getElementById('detail-color').innerText = data.color || 'No especificado';
            document.getElementById('detail-responsable').innerText = data.responsable || 'Sin asignar';
            document.getElementById('detail-fecha').innerText = new Date(data.fechaRegistro).toLocaleString();
            document.getElementById('detail-tipo').innerText = data.tipo;

            // Estado visual
            const estadoEl = document.getElementById('detail-estado');
            estadoEl.innerText = data.estado;
            estadoEl.style.backgroundColor = getStatusColor(data.estado);

            // Imagen
            const imgContainer = document.getElementById('detail-image-container');
            if (data.imagenURL) {
                imgContainer.innerHTML = `<img src="${data.imagenURL}" style="width: 100%; height: 100%; object-fit: contain;">`;
            } else {
                imgContainer.innerHTML = `<p style="color: #ccc; font-size: 3rem;">📷</p>`;
            }

        } else {
            card.innerHTML = `<div style="text-align: center; padding: 3rem;"><h3>Producto no encontrado</h3><p>El ID proporcionado no existe en la base de datos.</p></div>`;
        }
    } catch (error) {
        console.error("Error al cargar detalle:", error);
    }
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
