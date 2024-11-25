const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

// Variables globales para el autocompletado
let usuariosActivos = [];
let sugerenciaSeleccionada = -1;

// Cargar usuarios al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuariosActivos();
});

// Función para cargar usuarios activos
async function cargarUsuariosActivos() {
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        if (response.success) {
            usuariosActivos = response.data;
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    script.src = `${API_URL}?action=obtenerUsuariosActivos&callback=${callback}`;
    document.body.appendChild(script);
}

// Evento input para el campo de usuario
document.getElementById('username').addEventListener('input', function(e) {
    const valor = e.target.value.toLowerCase();
    const sugerenciasContainer = document.getElementById('sugerencias');
    
    if (valor.length < 2) {
        sugerenciasContainer.style.display = 'none';
        return;
    }
    
    const sugerencias = usuariosActivos.filter(user => 
        user.toLowerCase().includes(valor)
    );
    
    if (sugerencias.length > 0) {
        mostrarSugerencias(sugerencias);
    } else {
        sugerenciasContainer.style.display = 'none';
    }
});

// Función para mostrar sugerencias
function mostrarSugerencias(sugerencias) {
    const container = document.getElementById('sugerencias');
    container.innerHTML = '';
    container.style.display = 'block';
    
    sugerencias.forEach((sugerencia, index) => {
        const div = document.createElement('div');
        div.className = 'sugerencia-item';
        div.textContent = sugerencia;
        div.onclick = () => seleccionarSugerencia(sugerencia);
        container.appendChild(div);
    });
}

// Función para seleccionar una sugerencia
function seleccionarSugerencia(sugerencia) {
    document.getElementById('username').value = sugerencia;
    document.getElementById('sugerencias').style.display = 'none';
}

// Navegación con teclado en las sugerencias
document.getElementById('username').addEventListener('keydown', function(e) {
    const container = document.getElementById('sugerencias');
    const items = container.getElementsByClassName('sugerencia-item');
    
    if (container.style.display === 'none') return;
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            sugerenciaSeleccionada = Math.min(sugerenciaSeleccionada + 1, items.length - 1);
            actualizarSeleccion(items);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            sugerenciaSeleccionada = Math.max(sugerenciaSeleccionada - 1, -1);
            actualizarSeleccion(items);
            break;
            
        case 'Enter':
            if (sugerenciaSeleccionada >= 0 && items[sugerenciaSeleccionada]) {
                e.preventDefault();
                seleccionarSugerencia(items[sugerenciaSeleccionada].textContent);
            }
            break;
            
        case 'Escape':
            container.style.display = 'none';
            sugerenciaSeleccionada = -1;
            break;
    }
});

// Función para actualizar la selección visual
function actualizarSeleccion(items) {
    Array.from(items).forEach((item, index) => {
        item.classList.toggle('selected', index === sugerenciaSeleccionada);
        if (index === sugerenciaSeleccionada) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.input-group')) {
        document.getElementById('sugerencias').style.display = 'none';
        sugerenciaSeleccionada = -1;
    }
});

// Manejo del formulario de login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Ocultar mensaje de error previo
    errorMessage.style.display = 'none';
    
    // Crear elemento script para JSONP
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    // Definir callback
    window[callback] = function(response) {
        if (response.success) {
            // Guardar datos completos en localStorage
            localStorage.setItem('user', JSON.stringify({
                username: response.data.username,
                nombre: response.data.nombre,
                role: response.data.rol, // Asegurarnos de usar 'rol' como está en el backend
                usuario: response.data.usuario
            }));
            
            // Redirigir al main
            window.location.href = 'main.html';
        } else {
            errorMessage.textContent = response.message;
            errorMessage.style.display = 'block';
        }
        
        // Limpiar
        document.body.removeChild(script);
        delete window[callback];
    };
    
    // Construir URL
    const url = `${API_URL}?action=login&usuario=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&callback=${callback}`;
    
    // Agregar script al documento
    script.src = url;
    document.body.appendChild(script);
});