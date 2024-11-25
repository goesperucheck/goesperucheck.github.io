// Configuración inicial
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';
let todasLasRondas = [];
let graficoUnidades = null;
let graficoEstados = null;
let detalleModal;
let atencionModal;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada, iniciando configuración...');
    
    // Inicializar variables de modales
    detalleModal = document.getElementById('detalleModal');
    atencionModal = document.getElementById('atencionModal');

    // Ocultar modales al inicio
    detalleModal.style.display = 'none';
    atencionModal.style.display = 'none';

    // Event listeners para cerrar modales
    document.querySelectorAll('.close').forEach(element => {
        element.addEventListener('click', function() {
            detalleModal.style.display = 'none';
            atencionModal.style.display = 'none';
        });
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === detalleModal || event.target === atencionModal) {
            event.target.style.display = 'none';
        }
    });

    // Event listeners para los filtros
    document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpiar')?.addEventListener('click', limpiarFiltros);

    // Filtrado en tiempo real
    ['filtroUsuario', 'filtroUnidad'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', aplicarFiltros);
    });

    // Filtrado de fechas
    ['fechaInicio', 'fechaFin'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', aplicarFiltros);
    });

    // Cargar las rondas iniciales
    cargarRondas();
});

function limpiarFiltros() {
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroUnidad').value = '';
    aplicarFiltros();
}

function aplicarFiltros() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const usuario = document.getElementById('filtroUsuario').value.toLowerCase();
    const unidad = document.getElementById('filtroUnidad').value.toLowerCase();

    console.log('Aplicando filtros:', { fechaInicio, fechaFin, usuario, unidad });

    const rondasFiltradas = todasLasRondas.filter(ronda => {
        const fechaRonda = new Date(ronda.fecha);
        const cumpleFechaInicio = !fechaInicio || fechaRonda >= new Date(fechaInicio);
        const cumpleFechaFin = !fechaFin || fechaRonda <= new Date(fechaFin + 'T23:59:59');
        const cumpleUsuario = !usuario || ronda.usuario.toLowerCase().includes(usuario);
        const cumpleUnidad = !unidad || ronda.unidad.toLowerCase().includes(unidad);

        return cumpleFechaInicio && cumpleFechaFin && cumpleUsuario && cumpleUnidad;
    });

    actualizarTabla(rondasFiltradas);
    actualizarGraficas(rondasFiltradas);
    actualizarResumen(rondasFiltradas);
}

function cargarRondas() {
    console.log('Iniciando carga de rondas internas...');
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        console.log('Respuesta recibida:', response);
        if (response && response.success) {
            console.log('Datos recibidos:', response.data);
            mostrarRondas(response.data);
        } else {
            console.error('Error en la respuesta:', response ? response.message : 'No hay respuesta');
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    const params = new URLSearchParams({
        action: 'obtenerRondasInternas',
        callback: callback
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    console.log('URL de petición:', script.src);
    document.body.appendChild(script);
}

function mostrarRondas(rondas) {
    console.log('Procesando rondas:', rondas);
    if (!Array.isArray(rondas)) {
        console.error('Los datos recibidos no son un array:', rondas);
        return;
    }
    
    todasLasRondas = rondas.map(ronda => ({
        ...ronda,
        fecha: ronda.fecha || new Date().toISOString(),
        estado: ronda.estado || 'PENDIENTE'
    }));
    
    actualizarTabla(todasLasRondas);
    actualizarGraficas(todasLasRondas);
    actualizarResumen(todasLasRondas);
}

function actualizarGraficas(rondas) {
    actualizarGraficoUnidades(rondas);
    actualizarGraficoEstados(rondas);
}

// Nueva función para el gráfico de unidades
function actualizarGraficoUnidades(rondas) {
    const rondasPorUnidad = rondas.reduce((acc, ronda) => {
        acc[ronda.unidad] = (acc[ronda.unidad] || 0) + 1;
        return acc;
    }, {});

    const datos = {
        labels: Object.keys(rondasPorUnidad),
        datasets: [{
            label: 'Cantidad de Rondas',
            data: Object.values(rondasPorUnidad),
            backgroundColor: '#FF8C00',
            borderColor: '#FF8C00',
            borderWidth: 1
        }]
    };

    if (graficoUnidades) {
        graficoUnidades.destroy();
    }

    graficoUnidades = new Chart(document.getElementById('graficoUnidades'), {
        type: 'bar',
        data: datos,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2, // Hace el gráfico más pequeño
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Rondas por Unidad',
                    font: {
                        size: 14
                    },
                    padding: {
                        top: 20,
                        bottom: 20
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function actualizarGraficoEstados(rondas) {
    const rondasPorEstado = rondas.reduce((acc, ronda) => {
        const estado = ronda.estado || 'PENDIENTE';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
    }, {});

    const datos = {
        labels: Object.keys(rondasPorEstado),
        datasets: [{
            data: Object.values(rondasPorEstado),
            backgroundColor: [
                '#FFA500', // Naranja para PENDIENTE
                '#28a745'  // Verde para ATENDIDO
            ]
        }]
    };

    if (graficoEstados) {
        graficoEstados.destroy();
    }

    graficoEstados = new Chart(document.getElementById('graficoEstados'), {
        type: 'pie',
        data: datos,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2, // Hace el gráfico más pequeño
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Estado de Rondas',
                    font: {
                        size: 14
                    },
                    padding: {
                        top: 20,
                        bottom: 20
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 40 // Un poco más de espacio para la leyenda
                }
            }
        }
    });
}

function actualizarResumen(rondas) {
    const totalRondas = rondas.length;
    const rondasPendientes = rondas.filter(r => !r.estado || r.estado === 'PENDIENTE').length;
    const rondasAtendidas = rondas.filter(r => r.estado === 'ATENDIDO').length;

    document.getElementById('resumenRondas').innerHTML = `
        <div class="resumen-item">
            <div class="resumen-numero">${totalRondas}</div>
            <div class="resumen-texto">Total Rondas</div>
        </div>
        <div class="resumen-item">
            <div class="resumen-numero">${rondasPendientes}</div>
            <div class="resumen-texto">Pendientes</div>
        </div>
        <div class="resumen-item">
            <div class="resumen-numero">${rondasAtendidas}</div>
            <div class="resumen-texto">Atendidas</div>
        </div>
    `;
}

function actualizarTabla(rondas) {
    const tbody = document.getElementById('rondasTable');
    tbody.innerHTML = '';
    
    rondas.forEach(ronda => {
        const fecha = new Date(ronda.fecha).toLocaleString();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${ronda.usuario}</td>
            <td>${ronda.unidad}</td>
            <td>
                <span class="status-badge ${ronda.estado === 'ATENDIDO' ? 'success' : 'warning'}">
                    ${ronda.estado}
                </span>
            </td>
            <td>
                <button class="btn-detalle" onclick="mostrarDetalle(${JSON.stringify(ronda).replace(/"/g, '&quot;')})">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                ${ronda.estado !== 'ATENDIDO' ? `
                    <button class="btn-atender" onclick="mostrarModalAtencion(${JSON.stringify(ronda).replace(/"/g, '&quot;')})">
                        <i class="fas fa-check"></i> Atender
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function mostrarDetalle(ronda) {
    // Mostrar información básica
    document.getElementById('detalleFecha').textContent = new Date(ronda.fecha).toLocaleString();
    document.getElementById('detalleUsuario').textContent = ronda.usuario;
    document.getElementById('detalleUnidad').textContent = ronda.unidad;
    document.getElementById('detalleEstado').innerHTML = `
        <span class="status-badge ${ronda.estado === 'ATENDIDO' ? 'success' : 'warning'}">
            ${ronda.estado}
        </span>
    `;

    // Mostrar observaciones originales y comentario de atención si existe
    let observacionesHTML = `
        <div class="observacion-original">
            <strong>Observaciones Originales:</strong><br>
            ${ronda.observaciones || 'Sin observaciones'}
        </div>
    `;

    if (ronda.estado === 'ATENDIDO' && ronda.comentario_atencion) {
        observacionesHTML += `
            <div class="observacion-atencion" style="margin-top: 15px;">
                <strong>Comentario de Atención:</strong><br>
                ${ronda.comentario_atencion}
                <div class="fecha-atencion" style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    Atendido el: ${new Date(ronda.fecha_atencion).toLocaleString()}
                </div>
            </div>
        `;
    }

    document.getElementById('detalleObservaciones').innerHTML = observacionesHTML;

    // Manejar evidencia
    const evidencia = document.getElementById('evidencia');
    if (ronda.evidencia) {
        evidencia.src = ronda.evidencia;
        evidencia.style.display = 'block';
        evidencia.onclick = () => window.open(ronda.evidencia, '_blank');
    } else {
        evidencia.style.display = 'none';
    }

    // Mostrar el modal
    document.getElementById('detalleModal').style.display = 'block';
}

function mostrarModalAtencion(ronda) {
    document.getElementById('atencionFecha').textContent = new Date(ronda.fecha).toLocaleString();
    document.getElementById('atencionUsuario').textContent = ronda.usuario;
    document.getElementById('atencionUnidad').textContent = ronda.unidad;
    document.getElementById('atencionObservaciones').textContent = ronda.observaciones;
    document.getElementById('comentarioAtencion').value = '';
    
    document.getElementById('btnConfirmarAtencion').onclick = () => confirmarAtencion(ronda);
    
    atencionModal.style.display = 'block';
}

function confirmarAtencion(ronda) {
    console.log('Iniciando atención de ronda:', ronda);
    const comentario = document.getElementById('comentarioAtencion').value.trim();
    if (!comentario) {
        alert('Por favor, ingrese un comentario de atención');
        return;
    }

    const btnConfirmar = document.getElementById('btnConfirmarAtencion');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    const datos = {
        id: ronda.id,
        observaciones: ronda.observaciones + '\n\nATENCIÓN: ' + comentario,
        estado: 'ATENDIDO',
        fecha_atencion: new Date().toISOString()
    };

    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        console.log('Respuesta de atención:', response);
        if (response.success) {
            alert('Ronda atendida correctamente');
            atencionModal.style.display = 'none';
            cargarRondas();
        } else {
            alert('Error al atender la ronda: ' + (response.message || 'Error desconocido'));
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Atención';
        }
        
        document.body.removeChild(script);
        delete window[callback];
    };

    const params = new URLSearchParams({
        action: 'atenderRondaInterna',
        datos: JSON.stringify(datos),
        callback: callback
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

function cerrarModales() {
    detalleModal.style.display = 'none';
    atencionModal.style.display = 'none';
}

// Manejo global de errores
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError: ' + error);
    return false;
};