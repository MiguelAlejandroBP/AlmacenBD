export const Navbar = (user) => {
    return `
        <header class="navbar">
            <div style="display: flex; align-items: center; gap: 10px;">
                <button id="sidebar-toggle" class="btn" style="padding: 5px; background: transparent; color: var(--text-main); font-size: 1.25rem; display: none;">
                    ☰
                </button>
                <div style="color: var(--secondary-color); font-weight: 500; font-size: 0.85rem; display: block;" class="nav-title">
                    Sistema Almacén
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="text-align: right; display: none;" class="user-info">
                    <div style="font-size: 0.8rem; font-weight: 600;">${user.name}</div>
                </div>
                <button id="logout-btn" class="btn" style="border: 1px solid var(--border-color); color: var(--secondary-color); padding: 0.4rem 0.6rem; font-size: 0.75rem;">
                    Salir
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
