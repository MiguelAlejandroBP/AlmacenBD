export const Sidebar = (activeRoute) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventario', label: 'Inventario', icon: '📦' },
        { id: 'bajas', label: 'Bajas de Material', icon: '📉' }
    ];

    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                ALMACÉN CONTROL
            </div>
            <nav class="sidebar-nav">
                ${menuItems.map(item => `
                    <a href="#${item.id}" class="nav-item ${activeRoute === '#' + item.id ? 'active' : ''}">
                        <span style="margin-right: 12px;">${item.icon}</span>
                        ${item.label}
                    </a>
                `).join('')}
            </nav>
        </aside>
    `;
};