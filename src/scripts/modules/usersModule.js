import { registrarUsuario, db } from '../firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const initUsers = async () => {
    // Asegurarnos de que el DOM esté listo antes de buscar elementos
    setTimeout(() => {
        const tableBody = document.getElementById('users-table-body');
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-registration-form');
        const btnOpen = document.getElementById('btn-open-user-modal');
        const btnClose = document.getElementById('btn-close-user-modal');
        const btnCancel = document.getElementById('btn-cancel-user');

        if (!tableBody || !modal || !form || !btnOpen) {
            console.error("No se encontraron elementos de la UI de usuarios");
            return;
        }

        const openModal = () => {
            modal.style.display = 'flex';
        };

        const closeModal = () => {
            modal.style.display = 'none';
            form.reset();
        };

        btnOpen.onclick = openModal;
        btnClose.onclick = closeModal;
        btnCancel.onclick = closeModal;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('u-email').value;
            const password = document.getElementById('u-password').value;
            const btnSubmit = form.querySelector('button[type="submit"]');

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerText = 'Registrando...';
                await registrarUsuario(email, password);
                alert("Usuario registrado con éxito.");
                closeModal();
                renderList(); 
            } catch (error) {
                alert("Error al registrar: " + error.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Registrar';
            }
        };

        const renderList = () => {
            tableBody.innerHTML = `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 1rem 1.5rem;">5722110289@utrng.edu.mx</td>
                    <td style="padding: 1rem 1.5rem;">Administrador Maestro</td>
                    <td style="padding: 1rem 1.5rem;"><span style="color: #10b981; font-weight: 600;">Activo</span></td>
                    <td style="padding: 1rem 1.5rem; text-align: right; color: var(--text-muted);">Principal</td>
                </tr>
            `;
        };

        renderList();
    }, 100); // Pequeño delay para asegurar carga de HTML
};
