import { Sidebar } from '../components/sidebar.js';
import { Navbar } from '../components/navbar.js';
import { onAuthUpdate } from './firebase.js';
import { initInventory } from './modules/inventoryModule.js';
import { initUsers } from './modules/usersModule.js';
import { initBajas } from './modules/bajasModule.js';
import { initProductDetail } from './modules/productDetailModule.js';
import { AuthModule } from './modules/authModule.js';

import { initGlobalErrorLogging } from './services/logService.js';

// Inicializar Logs Globales
initGlobalErrorLogging();

// Registro de Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado con éxito', reg))
            .catch(err => console.error('Error al registrar Service Worker', err));
    });
}

// Estado global
const state = {
    user: null,
    currentRoute: window.location.hash || '#dashboard'
};

const appContainer = document.getElementById('app');

/**
 * Orquestador de vistas
 */
const renderPage = async () => {
    try {
        const fullHash = window.location.hash || '#dashboard';
        const pageName = fullHash.split('?')[0].replace('#', '');
        
        if (!state.user && pageName !== 'login') {
            window.location.hash = '#login';
            return;
        }

        if (state.user && pageName === 'login') {
            window.location.hash = '#dashboard';
            return;
        }

        state.currentRoute = fullHash;

        if (pageName === 'login') {
            const response = await fetch(`src/pages/login.html`);
            const html = await response.text();
            appContainer.innerHTML = html;
            AuthModule.initLogin();
            return;
        }

        // --- Layout Protegido con Overlay para Móvil ---
        appContainer.innerHTML = `
            <div id="overlay" class="overlay"></div>
            ${Sidebar(fullHash.split('?')[0])}
            <div class="main-wrapper">
                ${Navbar({ name: state.user?.email?.split('@')[0] || "Usuario", role: 'Administrador' })}
                <main id="content" class="content-area">
                    <div class="loading">Cargando...</div>
                </main>
            </div>
        `;

        // --- Lógica de Menú Colapsable ---
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('sidebar-toggle');

        const toggleMenu = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        };

        if (toggleBtn) toggleBtn.onclick = toggleMenu;
        if (overlay) overlay.onclick = toggleMenu;

        // Cerrar menú al navegar (importante en móvil)
        document.querySelectorAll('.nav-item').forEach(link => {
            link.onclick = () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            };
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.onclick = AuthModule.handleLogout;

        const contentArea = document.getElementById('content');
        const pageResponse = await fetch(`src/pages/${pageName}.html`);
        
        if (!pageResponse.ok) {
            contentArea.innerHTML = `<div class="card"><h1>404</h1><p>Página no encontrada.</p></div>`;
            return;
        }

        const pageHtml = await pageResponse.text();
        contentArea.innerHTML = pageHtml;
        
        if (pageName === 'dashboard') {
            const dateEl = document.getElementById('current-date');
            if (dateEl) dateEl.innerText = new Date().toLocaleDateString();
        } else if (pageName === 'inventario') {
            initInventory();
        } else if (pageName === 'usuarios') {
            initUsers();
        } else if (pageName === 'bajas') {
            initBajas();
        } else if (pageName === 'producto') {
            initProductDetail();
        }

    } catch (error) {
        console.error("Error en renderPage:", error);
    }
};

onAuthUpdate((user) => {
    state.user = user;
    renderPage();
});

window.addEventListener('hashchange', renderPage);
if (!window.location.hash) window.location.hash = '#dashboard';
else renderPage();
