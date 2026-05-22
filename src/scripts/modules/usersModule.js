import { registrarUsuario } from '../firebase.js';
import { getAllUsers, saveUserInDb, deleteUserFromDb } from '../services/dbService.js';
import { state } from '../app.js';

export const initUsers = async () => {
    // Asegurarnos de que el DOM esté listo antes de buscar elementos
    setTimeout(() => {
        const tableBody = document.getElementById('users-table-body');
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-registration-form');
        const btnOpen = document.getElementById('btn-open-user-modal');
        const btnClose = document.getElementById('btn-close-user-modal');
        const btnCancel = document.getElementById('btn-cancel-user');
        
        const modalTitle = modal?.querySelector('h2');
        const modalSubtitle = modal?.querySelector('p');
        const passwordContainer = document.getElementById('password-field-container');
        const emailInput = document.getElementById('u-email');
        const passwordInput = document.getElementById('u-password');
        const roleInput = document.getElementById('u-rol');
        const estadoInput = document.getElementById('u-estado');
        const idInput = document.getElementById('u-id');
        const btnSubmit = form?.querySelector('button[type="submit"]');

        if (!tableBody || !modal || !form || !btnOpen) {
            console.error("No se encontraron elementos de la UI de usuarios");
            return;
        }

        // FORZADO TEMPORAL: Permitir gestión a todos para configuración inicial
        const canManageUsers = true;

        if (!canManageUsers) {
            btnOpen.style.display = 'none';
        }

        const openModal = (user = null) => {
            if (!canManageUsers) {
                alert("No tiene permisos para realizar esta acción.");
                return;
            }
            if (user) {
                // Modo Edición
                modalTitle.innerText = 'Editar Usuario';
                modalSubtitle.innerText = 'Actualice los datos del perfil';
                emailInput.value = user.email;
                emailInput.disabled = true;
                passwordContainer.style.display = 'none';
                passwordInput.required = false;
                roleInput.value = user.rol || 'Empleado';
                estadoInput.value = user.estado || 'Activo';
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
                roleInput.value = 'Empleado';
                estadoInput.value = 'Activo';
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
            if (!canManageUsers) return;

            const email = emailInput.value;
            const role = roleInput.value;
            const estado = estadoInput.value;
            const userId = idInput.value;

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerText = userId ? 'Guardando...' : 'Registrando...';
                
                if (userId) {
                    // Actualizar Usuario
                    await saveUserInDb(userId, {
                        email,
                        rol: role,
                        estado: estado
                    });
                    alert("Usuario actualizado con éxito.");
                } else {
                    // Nuevo Usuario
                    const password = passwordInput.value;
                    // 1. Crear en Firebase Auth
                    const user = await registrarUsuario(email, password);
                    
                    // 2. Guardar metadata en Firestore
                    await saveUserInDb(user.uid, {
                        email: user.email,
                        rol: role,
                        estado: estado || 'Activo'
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
                    <td style="padding: 1rem 1.5rem;">
                        <div style="font-weight: 600; color: white;">${user.email}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${user.id}</div>
                    </td>
                    <td style="padding: 1rem 1.5rem;">
                        <span style="padding: 4px 10px; border-radius: 20px; background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 0.85rem; font-weight: 600;">
                            ${user.rol || 'Sin Rol'}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.5rem;">
                        <span style="display: flex; align-items: center; gap: 6px; color: ${user.estado === 'Activo' ? '#10b981' : '#ef4444'}; font-weight: 600;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor;"></span>
                            ${user.estado || 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.5rem; text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            ${canManageUsers ? `
                            <button class="btn-edit-user" 
                                    data-id="${user.id}" 
                                    data-email="${user.email}" 
                                    data-rol="${user.rol || ''}" 
                                    data-estado="${user.estado || 'Activo'}"
                                    style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" 
                                    title="Editar Usuario">
                                ✏️
                            </button>
                            <button class="btn-delete-user" 
                                    data-id="${user.id}" 
                                    style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" 
                                    title="Eliminar Usuario">
                                🗑️
                            </button>
                            ` : '---'}
                        </div>
                    </td>
                </tr>
            `).join('');

            if (canManageUsers) {
                // Asignar eventos de edición
                document.querySelectorAll('.btn-edit-user').forEach(btn => {
                    btn.onclick = () => {
                        const user = {
                            id: btn.dataset.id,
                            email: btn.dataset.email,
                            rol: btn.dataset.rol,
                            estado: btn.dataset.estado
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
            }
        };

        renderList();
    }, 100);
};



