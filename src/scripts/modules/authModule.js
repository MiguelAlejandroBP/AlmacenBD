import { login, logout, onAuthUpdate } from '../firebase.js';

/**
 * Módulo de Autenticación
 */
export const AuthModule = {
    initLogin: () => {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const submitBtn = loginForm.querySelector('button');

            try {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Autenticando...';
                await login(email, password);
                // El observador en app.js se encargará de redirigir
            } catch (error) {
                alert("Error: " + error.message);
                submitBtn.disabled = false;
                submitBtn.innerText = 'Entrar al Sistema';
            }
        };
    },

    handleLogout: async () => {
        if (confirm('¿Cerrar sesión?')) {
            try {
                await logout();
                window.location.hash = '#login';
            } catch (error) {
                console.error("Error al cerrar sesión", error);
            }
        }
    }
};
