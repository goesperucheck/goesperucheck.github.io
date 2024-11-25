// Configuración inicial
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';
let todasLasRondas = [];
let graficoUsuarios = null;
let graficoTurnos = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada, iniciando cargarRondas()');
    
    // Cargar las rondas iniciales
    cargarRondas();
    
    // Event listeners para los filtros
    document.getElementById('btnFiltrar')?.addEventListener('click', () => {
        console.log('Aplicando filtros...');
        aplicarFiltros();
    });
    
    document.getElementById('btnLimpiar')?.addEventListener('click', () => {
        console.log('Limpiando filtros...');
        document.getElementById('fechaInicio').value = '';
        document.getElementById('fechaFin').value = '';
        document.getElementById('filtroUsuario').value = '';
        document.getElementById('filtroUnidad').value = '';
        aplicarFiltros();
    });

    // Filtrado en tiempo real para campos de texto
    ['filtroUsuario', 'filtroUnidad'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            console.log(`Filtrando por ${id}...`);
            aplicarFiltros();
        });
    });

    // Filtrado al cambiar las fechas
    ['fechaInicio', 'fechaFin'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            console.log(`Filtrando por ${id}...`);
            aplicarFiltros();
        });
    });
});

// Función para aplicar los filtros
function aplicarFiltros() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const usuario = document.getElementById('filtroUsuario').value.toLowerCase();
    const unidad = document.getElementById('filtroUnidad').value.toLowerCase();

    console.log('Filtros actuales:', { fechaInicio, fechaFin, usuario, unidad });

    const rondasFiltradas = todasLasRondas.filter(ronda => {
        const fechaRonda = new Date(ronda.fecha);
        const cumpleFechaInicio = !fechaInicio || fechaRonda >= new Date(fechaInicio);
        const cumpleFechaFin = !fechaFin || fechaRonda <= new Date(fechaFin + 'T23:59:59');
        const cumpleUsuario = !usuario || ronda.usuario.toLowerCase().includes(usuario);
        const cumpleUnidad = !unidad || ronda.unidad.toLowerCase().includes(unidad);

        return cumpleFechaInicio && cumpleFechaFin && cumpleUsuario && cumpleUnidad;
    });

    console.log('Rondas filtradas:', rondasFiltradas.length);
    actualizarTabla(rondasFiltradas);
    actualizarGraficas(rondasFiltradas);
    actualizarResumen(rondasFiltradas);
}

function cargarRondas() {
    console.log('Iniciando carga de rondas...');
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    // Definir el callback antes de hacer la petición
    window[callback] = function(response) {
        console.log('Callback ejecutado');
        console.log('Respuesta completa:', response);
        
        if (response && response.success) {
            console.log('Datos de rondas:', response.data);
            mostrarRondas(response.data);
        } else {
            console.error('Error en la respuesta:', response ? response.message : 'No hay respuesta');
        }
        
        // Limpieza
        document.body.removeChild(script);
        delete window[callback];
    };
    
    const params = new URLSearchParams({
        action: 'obtenerRondas',
        callback: callback
    });
    
    const url = `${API_URL}?${params.toString()}`;
    console.log('URL de la petición:', url);
    
    script.onerror = function(error) {
        console.error('Error al cargar el script:', error);
    };
    
    script.src = url;
    document.body.appendChild(script);
}
// Función para mostrar las rondas en la tabla
function mostrarRondas(rondas) {
    console.log('Mostrando rondas:', rondas);
    todasLasRondas = rondas;
    actualizarTabla(rondas);
    actualizarGraficas(rondas);
    actualizarResumen(rondas);
}

// Función para actualizar las gráficas
function actualizarGraficas(rondas) {
    actualizarGraficoUsuarios(rondas);
    actualizarGraficoTurnos(rondas);
}

function actualizarGraficoUsuarios(rondas) {
    const rondasPorUsuario = rondas.reduce((acc, ronda) => {
        acc[ronda.usuario] = (acc[ronda.usuario] || 0) + 1;
        return acc;
    }, {});

    const datos = {
        labels: Object.keys(rondasPorUsuario),
        datasets: [{
            label: 'Cantidad de Rondas',
            data: Object.values(rondasPorUsuario),
            backgroundColor: '#FF8C00',
            borderColor: '#FF8C00',
            borderWidth: 1
        }]
    };

    if (graficoUsuarios) {
        graficoUsuarios.destroy();
    }

    graficoUsuarios = new Chart(document.getElementById('graficoUsuarios'), {
        type: 'bar',
        data: datos,
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function actualizarGraficoTurnos(rondas) {
    const rondasPorTurno = rondas.reduce((acc, ronda) => {
        const hora = new Date(ronda.fecha).getHours();
        let turno;
        if (hora >= 6 && hora < 14) turno = 'Día';
        else if (hora >= 14 && hora < 22) turno = 'Tarde';
        else turno = 'Noche';
        
        acc[turno] = (acc[turno] || 0) + 1;
        return acc;
    }, {});

    const datos = {
        labels: Object.keys(rondasPorTurno),
        datasets: [{
            data: Object.values(rondasPorTurno),
            backgroundColor: [
                '#FFD700', // Amarillo para Día
                '#C4A484', // Marrón claro para Tarde
                '#1E90FF'  // Azul para Noche
            ]
        }]
    };

    if (graficoTurnos) {
        graficoTurnos.destroy();
    }

    graficoTurnos = new Chart(document.getElementById('graficoTurnos'), {
        type: 'pie',
        data: datos,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function actualizarResumen(rondas) {
    const totalRondas = rondas.length;
    const usuariosUnicos = new Set(rondas.map(r => r.usuario)).size;
    const unidadesUnicas = new Set(rondas.map(r => r.unidad)).size;

    document.getElementById('resumenRondas').innerHTML = `
        <div class="resumen-item">
            <div class="resumen-numero">${totalRondas}</div>
            <div class="resumen-texto">Total Rondas</div>
        </div>
        <div class="resumen-item">
            <div class="resumen-numero">${usuariosUnicos}</div>
            <div class="resumen-texto">Usuarios Activos</div>
        </div>
        <div class="resumen-item">
            <div class="resumen-numero">${unidadesUnicas}</div>
            <div class="resumen-texto">Unidades Visitadas</div>
        </div>
    `;
}

// Función para actualizar la tabla
function actualizarTabla(rondas) {
    const tbody = document.getElementById('rondasTable');
    tbody.innerHTML = '';
    
    rondas.forEach(ronda => {
        const fecha = new Date(ronda.fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${ronda.usuario || ''}</td>
            <td>${ronda.unidad || ''}</td>
            <td>
                <button class="btn-detalle" onclick="mostrarDetalle(${JSON.stringify(ronda).replace(/"/g, '&quot;')})">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para mostrar el detalle en el modal
function mostrarDetalle(ronda) {
    const campos = {
        'uniforme': ['uniforme', 'detalles_uniforme'],
        'documentacion': ['documentacion', 'detalles_documentacion'],
        'extintores': ['extintores', 'detalles_extintores'],
        'zonasValor': ['zonas_valor', 'detalles_zonas_valor'],
        'perimetroInterno': ['perimetro_interno', 'detalles_perimetro_interno'],
        'perimetroExterno': ['perimetro_externo', 'detalles_perimetro_externo']
    };

    Object.entries(campos).forEach(([elementId, [statusField, detailsField]]) => {
        const statusElement = document.getElementById(`${elementId}Status`);
        const detallesElement = document.getElementById(`${elementId}Detalles`);
        
        if (statusElement && detallesElement) {
            statusElement.innerHTML = `
                <span class="status-badge ${ronda[statusField] === 'Si' ? 'success' : 'danger'}">
                    ${ronda[statusField] || 'No'}
                </span>
            `;
            detallesElement.textContent = ronda[detailsField] || 'Sin observaciones';
        }
    });
    
    const evidencia1 = document.getElementById('evidencia1');
    const evidencia2 = document.getElementById('evidencia2');
    
    if (ronda.evidencia1) {
        evidencia1.src = ronda.evidencia1;
        evidencia1.style.display = 'block';
        evidencia1.onclick = () => window.open(ronda.evidencia1, '_blank');
    } else {
        evidencia1.style.display = 'none';
    }
    
    if (ronda.evidencia2) {
        evidencia2.src = ronda.evidencia2;
        evidencia2.style.display = 'block';
        evidencia2.onclick = () => window.open(ronda.evidencia2, '_blank');
    } else {
        evidencia2.style.display = 'none';
    }
    
    const modal = document.getElementById('detalleModal');
    modal.style.display = 'block';
}

// Manejar cierre del modal
document.querySelector('.close').onclick = function() {
    document.getElementById('detalleModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('detalleModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Agregar estilos dinámicos
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 5px;
    }
    
    .status-badge.success {
        background-color: #28a745;
        color: white;
    }
    
    .status-badge.danger {
        background-color: #dc3545;
        color: white;
    }
`;
document.head.appendChild(style);