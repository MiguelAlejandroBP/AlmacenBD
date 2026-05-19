import { registrarUsuario } from '../firebase.js';
import { getAllUsers, saveUserInDb, deleteUserFromDb } from '../services/dbService.js';

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
                
                // 1. Crear en Firebase Auth
                const user = await registrarUsuario(email, password);
                
                // 2. Guardar metadata en Firestore (independientemente del rol)
                await saveUserInDb(user.uid, {
                    email: user.email,
                    rol: 'Usuario Estándar', // Rol por defecto
                    estado: 'Activo'
                });

                alert("Usuario registrado con éxito.");
                closeModal();
                await renderList(); 
            } catch (error) {
                alert("Error al registrar: " + error.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Registrar';
            }
        };

        const renderList = async () => {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Cargando usuarios...</td></tr>';
            
            const users = await getAllUsers();
            
            if (users.length === 0) {
                tableBody.innerHTML = `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 1rem 1.5rem;">5722110289@utrng.edu.mx</td>
                        <td style="padding: 1rem 1.5rem;">Administrador Maestro</td>
                        <td style="padding: 1rem 1.5rem;"><span style="color: #10b981; font-weight: 600;">Activo</span></td>
                        <td style="padding: 1rem 1.5rem; text-align: right; color: var(--text-muted);">Principal</td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = users.map(user => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 1rem 1.5rem;">${user.email}</td>
                    <td style="padding: 1rem 1.5rem;">${user.rol || 'Sin Rol'}</td>
                    <td style="padding: 1rem 1.5rem;">
                        <span style="color: ${user.estado === 'Activo' ? '#10b981' : '#ef4444'}; font-weight: 600;">
                            ${user.estado || 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.5rem; text-align: right;">
                        <button class="btn-delete-user" data-id="${user.id}" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">🗑️</button>
                    </td>
                </tr>
            `).join('');

            // Asignar eventos de eliminación
            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('¿Estás seguro de eliminar este acceso?')) {
                        try {
                            await deleteUserFromDb(btn.dataset.id);
                            await renderList();
                        } catch (error) {
                            alert("Error al eliminar: " + error.message);
                        }
                    }
                };
            });
        };

        renderList();
    }, 100);
};


