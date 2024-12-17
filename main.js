// Definir la configuración de accesos por rol
const ROLE_ACCESS = {
    'PERSONAL DE SEGURIDAD': ['registro.html', 'ronda_interna.html'],
    'SUPERVISOR': ['registro.html', 'ronda.html', 'ronda_interna.html', 'reporteResguardo.html'],
    'OPERADOR': ['registro.html', 'control_unidades.html', 'control_rondas.html', 'control_rondas_internas.html', 'admin_unidades.html', 'admin_puntos_ronda.html', 'reporteResguardo.html', 'transporte.html', 'controlcustodias.html', 'control_asistencias.html'],
    'COORDINADOR': ['registro.html', 'control_unidades.html', 'control_rondas.html', 'control_rondas_internas.html', 'reporteResguardo.html', 'ronda_coordinador.html', 'admin_puntos_ronda.html', 'control_asistencias.html'],
    'ADMINISTRADOR': ['registro.html', 'ronda.html', 'ronda_interna.html', 'control_unidades.html', 'admin_unidades.html', 'control_rondas.html', 'control_rondas_internas.html', 'admin_puntos_ronda.html', 'reporteResguardo.html', 'transporte.html', 'controlcustodias.html', 'ronda_coordinador.html','control_ronda_coordinador.html', 'control_asistencias.html'],
    'COMERCIAL': ['transporte.html', 'controlcustodias.html'],
    'RESGUARDO': ['reporteResguardo.html']
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
    'ronda_coordinador.html': {
        icon: 'fas fa-clipboard-list',
        title: 'Ronda de Coordinador',
        description: 'Ronda integral de supervisión - Coordinadores'
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
    'reporteResguardo.html': {
        icon: 'fas fa-gun',
        title: 'Reporte durante Custodias',
        description: 'Reporta novedades durante el servicio(Solo Resguardos)'
    },
    'transporte.html': {
        icon: 'fas fa-truck',
        title: 'Asignación de Servicios',
        description: 'Crea servicios // Asigna resguardos'
    },
    'control_ronda_coordinador.html': {
        icon: 'fas fa-shield',
        title: 'Control de Rondas - Coordinadores',
        description: 'Controla las rondas de los coordinadores'
    },
    'controlcustodias.html': {
        icon: 'fas fa-shield',
        title: 'Control de Custodias',
        description: 'Controla el servicio de custodia'
    },
    'admin_puntos_ronda.html': {
        icon: 'fas fa-map-marker-alt',
        title: 'Puntos de Ronda',
        description: 'Administración de puntos de control para rondas'
    },
    'control_asistencias.html': {
        icon: 'fas fa-user-clock',
        title: 'Control de Asistencias',
        description: 'Monitoreo y análisis de asistencias del personal'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Cargado'); // Debug

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

// Configurar el botón de pánico
const panicButton = document.getElementById('panicButton');
if (panicButton) {
    console.log('Configurando botón de pánico');
    
    panicButton.addEventListener('click', function() {
        console.log('Botón de pánico clickeado');
        
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            console.log('No hay datos de usuario');
            return;
        }
        
        // Obtener el iframe
        const frame = document.getElementById('contentFrame');
        
        if (frame) {
            console.log('Frame encontrado, esperando carga completa');
            
            // Asegurarse de que el iframe esté cargado
            if (frame.contentWindow) {
                try {
                    // Esperar a que el iframe esté completamente cargado
                    if (frame.contentDocument.readyState === 'complete') {
                        frame.contentWindow.postMessage({
                            type: 'panicAlert',
                            data: {
                                username: userData.usuario,
                                timestamp: new Date().toISOString()
                            }
                        }, '*');
                        console.log('Mensaje enviado al iframe');
                    } else {
                        console.log('Frame no está completamente cargado, esperando...');
                        frame.onload = function() {
                            frame.contentWindow.postMessage({
                                type: 'panicAlert',
                                data: {
                                    username: userData.usuario,
                                    timestamp: new Date().toISOString()
                                }
                            }, '*');
                            console.log('Mensaje enviado al iframe después de carga');
                        };
                    }
                } catch (error) {
                    console.error('Error al enviar mensaje:', error);
                }
            } else {
                console.error('contentWindow no disponible en el frame');
            }
        } else {
            console.error('Frame no encontrado');
        }
    });
    
    console.log('Evento click agregado exitosamente');
} else {
    console.error('ERROR: Botón de pánico no encontrado en el DOM');
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

// El resto de las funciones se mantienen igual
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
