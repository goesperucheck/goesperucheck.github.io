// Definir la URL del API
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    
    // Cargar unidades
    cargarUnidades();
});

// Función corregida para usar JSONP
function cargarUnidades() {
    const script = document.createElement('script');
    const callback = 'callback_' + Math.random().toString(36).substr(2, 9);

    window[callback] = function(response) {
        if (response.success) {
            const select = document.getElementById('unidad');
            select.innerHTML = '<option value="">Seleccione una unidad</option>';
            
            response.data.forEach(unidad => {
                const option = document.createElement('option');
                option.value = unidad.nombre;
                option.textContent = unidad.nombre;
                select.appendChild(option);
            });
        } else {
            mostrarError('Error al cargar unidades: ' + response.message);
        }
        delete window[callback];
        document.body.removeChild(script);
    };

    script.src = `${API_URL}?action=obtenerUnidades&callback=${callback}`;
    document.body.appendChild(script);
}

// El resto del código se mantiene igual...

function consultarControl() {
    const fecha = document.getElementById('fecha').value;
    const unidad = document.getElementById('unidad').value;
    
    if (!fecha || !unidad) {
        mostrarError('Por favor seleccione fecha y unidad');
        return;
    }

    mostrarCargando(true);
    ocultarError();

    const script = document.createElement('script');
    const callback = 'callback_' + Math.random().toString(36).substr(2, 9);

    window[callback] = function(response) {
        mostrarCargando(false);
        if (response.success) {
            mostrarResultados(response.data);
        } else {
            mostrarError(response.message);
        }
        delete window[callback];
        document.body.removeChild(script);
    };

    script.src = `${API_URL}?action=controlarAsistencia&fecha=${fecha}&unidad=${unidad}&callback=${callback}`;
    document.body.appendChild(script);
}

// Agregar función que faltaba
function mostrarCargando(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Agregar función que faltaba
function ocultarError() {
    document.getElementById('error-message').style.display = 'none';
}

function mostrarResultados(reporte) {
    const container = document.getElementById('resultados');
    container.innerHTML = '';
    
    Object.entries(reporte.turnos).forEach(([turno, datos]) => {
        const porcentaje = (datos.presentes / datos.esperados) * 100;
        const status = porcentaje >= 100 ? 'ok' : 
                      porcentaje >= 80 ? 'warning' : 'error';
        
        container.innerHTML += `
            <div class="status-card status-${status}">
                <h3>Turno ${turno}</h3>
                <p>Personal Esperado: ${datos.esperados}</p>
                <p>Personal Presente: ${datos.presentes}</p>
                <p>Porcentaje: ${porcentaje.toFixed(1)}%</p>
                <div class="status-indicator">
                    <div class="indicator-dot" style="background-color: ${getStatusColor(status)}"></div>
                    <span>${getStatusText(status)}</span>
                </div>
            </div>
        `;
    });
}

function getStatusColor(status) {
    switch(status) {
        case 'ok': return '#28a745';
        case 'warning': return '#ffc107';
        case 'error': return '#dc3545';
        default: return '#6c757d';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'ok': return 'Completo';
        case 'warning': return 'Atención';
        case 'error': return 'Crítico';
        default: return 'Desconocido';
    }
}

function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    } else {
        alert(mensaje);
    }
}