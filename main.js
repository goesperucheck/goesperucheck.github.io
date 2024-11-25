// Definir la configuración de accesos por rol
const ROLE_ACCESS = {
    'PERSONAL DE SEGURIDAD': ['registro.html', 'ronda_interna.html'],
    'SUPERVISOR': ['registro.html', 'ronda.html', 'ronda_interna.html'],
    'OPERADOR': ['registro.html', 'control_unidades.html', 'control_rondas.html', 'control_rondas_internas.html', 'admin_unidades.html', 'admin_puntos_ronda.html'],
    'COORDINADOR': ['registro.html', 'control_unidades.html', 'control_rondas.html', 'control_rondas_internas.html'],
    'ADMINISTRADOR': ['registro.html', 'ronda.html', 'ronda_interna.html', 'control_unidades.html', 'admin_unidades.html', 'control_rondas.html', 'control_rondas_internas.html', 'admin_puntos_ronda.html']
};

// Mapeo de URLs a información del menú
const MENU_ITEMS = {
    'registro.html': {
        icon: 'fas fa-qrcode',
        title: 'Registrar Asistencia',
        description: 'Escanea el código QR de tu unidad'
    },
    'ronda.html': {
        icon: 'fas fa-clipboard-check',
        title: 'Ronda de Supervisión',
        description: 'Registra la inspección de la unidad'
    },
    'ronda_interna.html': {
        icon: 'fas fa-walking',
        title: 'Ronda Interna',
        description: 'Registra la ronda interna de la unidad'
    },
    'control_unidades.html': {
        icon: 'fas fa-building',
        title: 'Control de Unidades',
        description: 'Monitorea la asistencia en las unidades'
    },
    'admin_unidades.html': {
        icon: 'fas fa-cogs',
        title: 'Administración de Unidades',
        description: 'Gestiona la configuración de las unidades'
    },
    'control_rondas.html': {
        icon: 'fas fa-clipboard-check',
        title: 'Control de Rondas',
        description: 'Monitoreo y análisis de rondas de supervisión'
    },
    'control_rondas_internas.html': {
        icon: 'fas fa-route',
        title: 'Control de Rondas Internas',
        description: 'Monitoreo y gestión de rondas internas'
    },
    'admin_puntos_ronda.html': {
        icon: 'fas fa-map-marker-alt',
        title: 'Puntos de Ronda',
        description: 'Administración de puntos de control para rondas'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Verificar usuario logueado
    const userData = localStorage.getItem('user');
    if (!userData) {
        console.log('No hay datos de usuario en localStorage');
        window.location.href = 'index.html';
        return;
    }

    try {
        const user = JSON.parse(userData);
        console.log('Datos del usuario recuperados:', user);
        console.log('Nombre:', user.nombre);
        console.log('Usuario:', user.usuario);
        console.log('Rol:', user.rol);
        
        // Cargar información del usuario en el sidebar
        cargarInfoUsuario(user);
    } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        window.location.href = 'index.html';
        return;
    }

    // Manejar el toggle del sidebar
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const toggleIcon = sidebarToggle.querySelector('i');

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
        
        // Guardar estado
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
    }

    sidebarToggle.addEventListener('click', toggleSidebar);

    // Restaurar estado del sidebar
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'collapsed') {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
    }

    // Mostrar menú por defecto
    showMenu();
});

function cargarInfoUsuario(user) {
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement && userRoleElement) {
        // Mostrar nombre de usuario
        userNameElement.textContent = user.username || 'Usuario';
        
        // Mostrar rol del usuario
        let rolTexto = '';
        switch(user.role?.toUpperCase()) {
            case 'PERSONAL DE SEGURIDAD':
                rolTexto = 'Personal de Seguridad';
                break;
            case 'SUPERVISOR':
                rolTexto = 'Supervisor';
                break;
            case 'OPERADOR':
                rolTexto = 'Operador';
                break;
            case 'RESGUARDO':
                rolTexto = 'Resguardo';
                break;
            case 'COORDINADOR':
                rolTexto = 'Coordinador';
                break;
            case 'ADMINISTRADOR':
            case 'ADMIN':
                rolTexto = 'Administrador';
                break;
            default:
                rolTexto = user.role || 'Usuario';
        }
        userRoleElement.textContent = rolTexto;
        
        console.log('Usuario cargado:', {
            nombre: userNameElement.textContent,
            rol: rolTexto
        });
    } else {
        console.error('Elementos de información de usuario no encontrados');
    }
}

function showMenu() {
    const frame = document.getElementById('contentFrame');
    const menuContent = document.getElementById('menuContent');
    const menuContainer = menuContent.querySelector('.menu-container');
    
    // Limpiar menú existente
    menuContainer.innerHTML = '';
    
    // Obtener rol del usuario
    const userData = JSON.parse(localStorage.getItem('user'));
    const userRole = userData.role?.toUpperCase();
    
    // Obtener accesos permitidos para el rol
    const allowedUrls = ROLE_ACCESS[userRole] || [];
    
    // Crear elementos del menú según permisos
    allowedUrls.forEach(url => {
        const menuInfo = MENU_ITEMS[url];
        if (menuInfo) {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.onclick = () => loadFrame(url);
            menuItem.innerHTML = `
                <i class="${menuInfo.icon}"></i>
                <div class="menu-item-content">
                    <div class="menu-item-title">${menuInfo.title}</div>
                    <div class="menu-item-description">${menuInfo.description}</div>
                </div>
                <i class="fas fa-chevron-right"></i>
            `;
            menuContainer.appendChild(menuItem);
        }
    });
    
    // Mostrar el menú y ocultar el frame
    frame.style.display = 'none';
    frame.src = '';
    menuContent.style.display = 'block';
    
    // Activar el botón de menú
    updateNavButtons(true);
}

function loadFrame(url) {
    const frame = document.getElementById('contentFrame');
    const menuContent = document.getElementById('menuContent');
    
    frame.style.display = 'block';
    frame.style.width = '100%';
    frame.style.height = '100%';
    frame.classList.add('active');
    menuContent.style.display = 'none';
    
    frame.src = url;
    
    frame.onload = function() {
        console.log('Frame cargado:', url);
        frame.style.visibility = 'visible';
    };

    updateNavButtons(false);
}

function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('sidebarState');
        window.location.href = 'index.html';
    }
}

function updateNavButtons(isMenu) {
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        if ((button.querySelector('span').textContent === 'Menú' && isMenu) ||
            (button.querySelector('span').textContent === 'Volver' && !isMenu)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function goBack() {
    showMenu();
}

window.addEventListener('message', function(event) {
    if (event.data.action === 'goBack') {
        goBack();
    }
});