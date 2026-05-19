export const Navbar = (user) => {
    return `
        <header class="navbar">
            <div style="display: flex; align-items: center; gap: 12px;">
                <button id="sidebar-toggle" class="btn" style="padding: 8px; background: transparent; color: var(--text-main); font-size: 1.5rem; display: none;">
                    ☰
                </button>
                <div style="color: var(--text-main); font-weight: 700; font-size: 1.1rem;" class="nav-title">
                    Panel Administrativo
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="text-align: right;" class="user-info">
                    <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${user.name}</div>
                    <div style="font-size: 0.7rem; color: var(--secondary-color);">Administrador</div>
                </div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--text-main); font-weight: bold;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <button id="logout-btn" class="btn" style="border: 1px solid var(--border-color); background: white; color: var(--error-color); padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600; border-radius: 10px;">
                    Cerrar Sesión
                </button>
            </div>
        </header>

        <style>
            @media (max-width: 768px) {
                #sidebar-toggle { display: block !important; }
                .nav-title { display: none !important; }
                .user-info { display: none !important; }
            }
        </style>
    `;
};
