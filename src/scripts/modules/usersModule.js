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
        
        const modalTitle = modal.querySelector('h2');
        const modalSubtitle = modal.querySelector('p');
        const passwordContainer = document.getElementById('password-field-container');
        const emailInput = document.getElementById('u-email');
        const passwordInput = document.getElementById('u-password');
        const roleInput = document.getElementById('u-rol');
        const idInput = document.getElementById('u-id');
        const btnSubmit = form.querySelector('button[type="submit"]');

        if (!tableBody || !modal || !form || !btnOpen) {
            console.error("No se encontraron elementos de la UI de usuarios");
            return;
        }

        const openModal = (user = null) => {
            if (user) {
                // Modo Edición
                modalTitle.innerText = 'Editar Rol';
                modalSubtitle.innerText = 'Actualice los permisos del usuario';
                emailInput.value = user.email;
                emailInput.disabled = true;
                passwordContainer.style.display = 'none';
                passwordInput.required = false;
                roleInput.value = user.rol || 'Usuario Estándar';
                idInput.value = user.id;
                btnSubmit.innerText = 'Guardar Cambios';
            } else {
                // Modo Registro
                modalTitle.innerText = 'Nuevo Usuario';
                modalSubtitle.innerText = 'Cree nuevas credenciales de acceso';
                emailInput.value = '';
                emailInput.disabled = false;
                passwordContainer.style.display = 'block';
                passwordInput.required = true;
                roleInput.value = 'Usuario Estándar';
                idInput.value = '';
                btnSubmit.innerText = 'Registrar Acceso';
            }
            modal.style.display = 'flex';
        };

        const closeModal = () => {
            modal.style.display = 'none';
            form.reset();
        };

        btnOpen.onclick = () => openModal();
        btnClose.onclick = closeModal;
        btnCancel.onclick = closeModal;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const role = roleInput.value;
            const userId = idInput.value;

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerText = userId ? 'Guardando...' : 'Registrando...';
                
                if (userId) {
                    // Actualizar Rol
                    await saveUserInDb(userId, {
                        email,
                        rol: role
                    });
                    alert("Rol actualizado con éxito.");
                } else {
                    // Nuevo Usuario
                    const password = passwordInput.value;
                    // 1. Crear en Firebase Auth
                    const user = await registrarUsuario(email, password);
                    
                    // 2. Guardar metadata en Firestore
                    await saveUserInDb(user.uid, {
                        email: user.email,
                        rol: role,
                        estado: 'Activo'
                    });
                    alert("Usuario registrado con éxito.");
                }

                closeModal();
                await renderList(); 
            } catch (error) {
                alert("Error: " + error.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = userId ? 'Guardar Cambios' : 'Registrar Acceso';
            }
        };

        const renderList = async () => {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Cargando usuarios...</td></tr>';
            
            const users = await getAllUsers();
            
            if (users.length === 0) {
                tableBody.innerHTML = `
                    <tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">No hay usuarios registrados.</td></tr>
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
                    <td style="padding: 1rem 1.5rem; text-align: right; display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn-edit-user" 
                                data-id="${user.id}" 
                                data-email="${user.email}" 
                                data-rol="${user.rol || ''}" 
                                style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" 
                                title="Editar Rol">
                            ✏️
                        </button>
                        <button class="btn-delete-user" 
                                data-id="${user.id}" 
                                style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" 
                                title="Eliminar Usuario">
                            🗑️
                        </button>
                    </td>
                </tr>
            `).join('');

            // Asignar eventos de edición
            document.querySelectorAll('.btn-edit-user').forEach(btn => {
                btn.onclick = () => {
                    const user = {
                        id: btn.dataset.id,
                        email: btn.dataset.email,
                        rol: btn.dataset.rol
                    };
                    openModal(user);
                };
            });

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


