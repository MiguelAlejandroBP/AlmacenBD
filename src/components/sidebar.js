export const Sidebar = (activeRoute) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventario', label: 'Inventario', icon: '📦' },
        { id: 'bajas', label: 'Bajas de Material', icon: '📉' },
        { id: 'usuarios', label: 'Usuarios', icon: '👥' }
    ];

    return `
        <aside class="sidebar">
            <div class="sidebar-header" style="height: auto; padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #22c55e, #15803d);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.2rem;
                    font-weight: bold;
                    box-shadow: 0 8px 15px rgba(34,197,94,0.3);
                ">
                    GDB
                </div>
                <div style="font-size: 0.9rem; font-weight: 700; letter-spacing: 1px; color: white;">
                    ALMACÉN CONTROL
                </div>
            </div>
            <nav class="sidebar-nav" style="padding-top: 1rem;">
                ${menuItems.map(item => `
                    <a href="#${item.id}" class="nav-item ${activeRoute === '#' + item.id ? 'active' : ''}">
                        <span style="margin-right: 12px; font-size: 1.1rem;">${item.icon}</span>
                        ${item.label}
                    </a>
                `).join('')}
            </nav>
        </aside>
    `;
};