// Configuración de la API de Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

// Variables globales
let usuarios = []; // Para almacenar la lista de usuarios disponibles
let tabla; // Variable para la instancia de DataTable

// Inicialización cuando el documento está listo
$(document).ready(function() {
    inicializarTabla();
    cargarDatosIniciales();
});

// Función para inicializar la tabla
function inicializarTabla() {
    tabla = $('#tablaTransportes').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        dom: '<"row"<"col-sm-12 col-md-6"B><"col-sm-12 col-md-6"f>>rtip',
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fas fa-file-excel"></i> Excel',
                className: 'btn btn-success',
                exportOptions: {
                    columns: [0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16] // Todas las columnas excepto Acciones
                },
                title: 'Control_de_Transportes'
            },
            {
                extend: 'pdf',
                text: '<i class="fas fa-file-pdf"></i> PDF',
                className: 'btn btn-danger',
                exportOptions: {
                    columns: [0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16]
                },
                title: 'Control de Transportes'
            },
            {
                extend: 'print',
                text: '<i class="fas fa-print"></i> Imprimir',
                className: 'btn btn-secondary',
                exportOptions: {
                    columns: [0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16]
                }
            }
        ],
        columnDefs: [
            {
                targets: [7,8,9,10,11,12,13,14,15,16], // Índices de las columnas ocultas
                visible: false
            }
        ],
        responsive: true,
        order: [[1, 'desc']] // Ordenar por fecha de servicio descendente
    });
}

// Funciones de utilidad
function calcularTotalHoras() {
    const horaCita = document.getElementById('horaCita').value;
    const horaFin = document.getElementById('horaFin').value;
    
    if (horaCita && horaFin) {
        const [horaCitaHoras, horaCitaMinutos] = horaCita.split(':').map(Number);
        const [horaFinHoras, horaFinMinutos] = horaFin.split(':').map(Number);
        
        let diferenciaMinutos = (horaFinHoras * 60 + horaFinMinutos) - 
                               (horaCitaHoras * 60 + horaCitaMinutos);
        
        if (diferenciaMinutos < 0) {
            diferenciaMinutos += 24 * 60; // Ajuste para casos que cruzan medianoche
        }
        
        const horas = Math.floor(diferenciaMinutos / 60);
        const minutos = diferenciaMinutos % 60;
        
        document.getElementById('totalHoras').value = 
            `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }
}

// Funciones para manejar los modales
function abrirModalNuevo() {
    document.getElementById('modoEdicion').value = 'nuevo';
    document.getElementById('transporteForm').reset();
    document.getElementById('ordenTransporte').readOnly = false;
    document.querySelector('#modalTransporte h3').textContent = 'Nuevo Transporte';
    document.getElementById('modalTransporte').style.display = 'block';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function agregarResguardo() {
    const container = document.getElementById('resguardosContainer');
    const nuevoSelect = document.createElement('div');
    nuevoSelect.className = 'form-group resguardo-select';
    
    nuevoSelect.innerHTML = `
        <select required>
            <option value="">Seleccione un resguardo...</option>
            ${usuarios.map(usuario => `<option value="${usuario}">${usuario}</option>`).join('')}
        </select>
        <button type="button" class="btn-remove" onclick="eliminarResguardo(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(nuevoSelect);
}

function eliminarResguardo(button) {
    button.parentElement.remove();
}

// Función para cargar datos iniciales
function cargarDatosIniciales() {
    cargarUsuarios();
    cargarRegistros();
}

// Función para cargar usuarios
function cargarUsuarios() {
    const script = document.createElement('script');
    const callback = 'handleUsuarios';
    script.src = `${API_URL}?action=obtenerUsuariosActivos&callback=${callback}`;
    document.body.appendChild(script);
    script.onload = function() {
        document.body.removeChild(script);
    };
}

// Callback para manejar la respuesta de usuarios
function handleUsuarios(response) {
    if (response.success) {
        usuarios = response.data;
        console.log('Usuarios cargados:', usuarios);
    } else {
        console.error('Error al cargar usuarios:', response.message);
        mostrarError('Error al cargar los usuarios');
    }
}

// Función para cargar registros
function cargarRegistros() {
    const script = document.createElement('script');
    const callback = 'handleRegistros';
    script.src = `${API_URL}?action=getTransportes&callback=${callback}`; // Cambiado de obtenerTransportes a getTransportes
    document.body.appendChild(script);
    script.onload = function() {
        document.body.removeChild(script);
    };
}

// Callback para manejar la respuesta de registros
function handleRegistros(response) {
    if (response.success) {
        const datos = response.data.map(registro => {
            // Formatear la fecha
            const fecha = new Date(registro.fechaServicio);
            const fechaFormateada = fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            return [
                registro.ordenTransporte,
                fechaFormateada,
                registro.liderEquipo,
                registro.cliente,
                registro.puntoInicial,
                registro.puntoDestino,
                `<div class="btn-group" role="group">
                    <button onclick="verTransporte('${registro.ordenTransporte}')" class="btn btn-info btn-sm" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editarTransporte('${registro.ordenTransporte}')" class="btn btn-warning btn-sm" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="abrirModalResguardos('${registro.ordenTransporte}')" class="btn btn-success btn-sm" title="Asignar Resguardos">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>`,
                registro.horaCita,
                registro.horaLlegada,
                registro.horaInicio,
                registro.horaFin,
                registro.totalHoras,
                registro.placaTransporte,
                registro.numeroContenedor,
                registro.solicitante,
                registro.tipoServicio,
                registro.zona
            ];
        });

        tabla.clear().rows.add(datos).draw();
    } else {
        console.error('Error al cargar registros:', response.message);
        mostrarError('Error al cargar los registros');
    }
}

document.getElementById('transporteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const modoEdicion = document.getElementById('modoEdicion').value;
    const formData = {
        ordenTransporte: document.getElementById('ordenTransporte').value,
        fechaServicio: document.getElementById('fechaServicio').value,
        liderEquipo: document.getElementById('liderEquipo').value,
        cliente: document.getElementById('cliente').value,
        puntoInicial: document.getElementById('puntoInicial').value,
        puntoDestino: document.getElementById('puntoDestino').value,
        horaCita: document.getElementById('horaCita').value || null,
        horaLlegada: document.getElementById('horaLlegada').value || null,
        horaInicio: document.getElementById('horaInicio').value || null,
        horaFin: document.getElementById('horaFin').value || null,
        totalHoras: document.getElementById('totalHoras').value || null,
        placaTransporte: document.getElementById('placaTransporte').value,
        numeroContenedor: document.getElementById('numeroContenedor').value,
        solicitante: document.getElementById('solicitante').value,
        tipoServicio: document.getElementById('tipoServicio').value,
        zona: document.getElementById('zona').value
    };

    const script = document.createElement('script');
    script.id = 'submitScript';
    const callback = 'handleRegistroTransporte';
    const action = modoEdicion === 'editar' ? 'actualizarTransporte' : 'registrarTransporte';
    
    // Remover script anterior si existe
    const oldScript = document.getElementById('submitScript');
    if (oldScript) {
        oldScript.remove();
    }
    
    console.log('Enviando datos:', formData); // Para depuración
    
    script.src = `${API_URL}?action=${action}&datos=${encodeURIComponent(JSON.stringify(formData))}&callback=${callback}`;
    document.body.appendChild(script);
    script.onload = function() {
        document.body.removeChild(script);
    };
});

// Callback para manejar la respuesta del registro de transporte
function handleRegistroTransporte(response) {
    if (response.success) {
        cerrarModal('modalTransporte');
        cargarRegistros();
        mostrarMensaje('Registro guardado exitosamente');
    } else {
        mostrarError(response.message || 'Error al guardar el registro');
    }
}

// Manejo del formulario de resguardos
document.getElementById('resguardosForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const ordenTransporte = document.getElementById('ordenTransporteResguardo').value;
    const resguardos = Array.from(document.querySelectorAll('.resguardo-select select'))
                           .map(select => select.value)
                           .filter(value => value);

    if (resguardos.length === 0) {
        mostrarError('Debe seleccionar al menos un resguardo');
        return;
    }

    const datos = {
        ordenTransporte,
        resguardos
    };

    const script = document.createElement('script');
    const callback = 'handleAsignacionResguardos';
    script.src = `${API_URL}?action=asignarResguardos&datos=${encodeURIComponent(JSON.stringify(datos))}&callback=${callback}`;
    document.body.appendChild(script);
    script.onload = function() {
        document.body.removeChild(script);
    };
});

// Callback para manejar la respuesta de asignación de resguardos
function handleAsignacionResguardos(response) {
    if (response.success) {
        cerrarModal('modalResguardos');
        mostrarMensaje('Resguardos asignados exitosamente');
    } else {
        mostrarError(response.message || 'Error al asignar resguardos');
    }
}

// Funciones para mostrar mensajes
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje
    });
}

function mostrarMensaje(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje
    });
}

// Función para abrir el modal de resguardos
function abrirModalResguardos(ordenTransporte) {
    document.getElementById('modalResguardos').style.display = 'block';
    document.getElementById('ordenTransporteResguardo').value = ordenTransporte;
    document.getElementById('resguardosContainer').innerHTML = ''; // Limpiar contenedor existente
    agregarResguardo(); // Agregar el primer select de resguardo
}

// Cerrar modales al hacer clic fuera de ellos
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Función para ver los detalles de un transporte
// Función para ver los detalles de un transporte
function verTransporte(ordenTransporte) {
    console.log('Intentando ver transporte:', ordenTransporte);
    const script = document.createElement('script');
    const callback = 'handleVerTransporte';
    script.src = `${API_URL}?action=getDetallesTransporte&ordenTransporte=${ordenTransporte}&callback=${callback}`;
    console.log('URL de solicitud:', script.src);
    document.body.appendChild(script);
    script.onload = function() {
        document.body.removeChild(script);
    };
}

// Callback para manejar la vista de detalles
function handleVerTransporte(response) {
    console.log('Respuesta recibida:', response);
    if (response.success) {
        const datos = response.data;
        Swal.fire({
            title: 'Detalles del Transporte',
            html: `
                <div class="detalles-transporte">
                    <p><strong>Orden:</strong> ${datos.ordenTransporte}</p>
                    <p><strong>Fecha:</strong> ${new Date(datos.fechaServicio).toLocaleDateString('es-MX')}</p>
                    <p><strong>Líder:</strong> ${datos.liderEquipo}</p>
                    <p><strong>Cliente:</strong> ${datos.cliente}</p>
                    <p><strong>Punto Inicial:</strong> ${datos.puntoInicial}</p>
                    <p><strong>Punto Destino:</strong> ${datos.puntoDestino}</p>
                    <p><strong>Hora Cita:</strong> ${datos.horaCita}</p>
                    <p><strong>Total Horas:</strong> ${datos.totalHoras}</p>
                    <p><strong>Placa:</strong> ${datos.placaTransporte}</p>
                    <p><strong>Contenedor:</strong> ${datos.numeroContenedor}</p>
                    <p><strong>Solicitante:</strong> ${datos.solicitante}</p>
                    <p><strong>Tipo Servicio:</strong> ${datos.tipoServicio}</p>
                    <p><strong>Zona:</strong> ${datos.zona}</p>
                </div>
            `,
            width: '600px'
        });
    } else {
        console.error('Error en handleVerTransporte:', response);
        mostrarError('Error al cargar los detalles del transporte');
    }
}

// Función para editar un transporte
function editarTransporte(ordenTransporte) {
    console.log('Intentando editar transporte:', ordenTransporte);
    const script = document.createElement('script');
    const callback = 'handleObtenerTransporteEditar';
    script.src = `${API_URL}?action=getDetallesTransporte&ordenTransporte=${ordenTransporte}&callback=${callback}`;
    console.log('URL de solicitud:', script.src);
    document.body.appendChild(script);
    script.onload = function() {
        document.body.removeChild(script);
    };
}

// Callback para cargar datos en el modal de edición
function handleObtenerTransporteEditar(response) {
    console.log('Respuesta edición:', response);
    if (response.success) {
        const datos = response.data;
        
        // Indicar que estamos en modo edición
        document.getElementById('modoEdicion').value = 'editar';
        
        // Función auxiliar para manejar valores nulos o vacíos
        const setValueOrEmpty = (elementId, value) => {
            const element = document.getElementById(elementId);
            element.value = value || '';
        };
        
        // Llenar el formulario con los datos existentes
        setValueOrEmpty('ordenTransporte', datos.ordenTransporte);
        document.getElementById('ordenTransporte').readOnly = true;
        
        setValueOrEmpty('fechaServicio', datos.fechaServicio ? datos.fechaServicio.split('T')[0] : '');
        setValueOrEmpty('liderEquipo', datos.liderEquipo);
        setValueOrEmpty('cliente', datos.cliente);
        setValueOrEmpty('puntoInicial', datos.puntoInicial);
        setValueOrEmpty('puntoDestino', datos.puntoDestino);
        setValueOrEmpty('horaCita', datos.horaCita);
        setValueOrEmpty('horaLlegada', datos.horaLlegada);
        setValueOrEmpty('horaInicio', datos.horaInicio);
        setValueOrEmpty('horaFin', datos.horaFin);
        setValueOrEmpty('totalHoras', datos.totalHoras);
        setValueOrEmpty('placaTransporte', datos.placaTransporte);
        setValueOrEmpty('numeroContenedor', datos.numeroContenedor);
        setValueOrEmpty('solicitante', datos.solicitante);
        setValueOrEmpty('tipoServicio', datos.tipoServicio);
        setValueOrEmpty('zona', datos.zona);

        // Cambiar el título del modal
        document.querySelector('#modalTransporte h3').textContent = 'Editar Transporte';
        
        // Abrir el modal
        document.getElementById('modalTransporte').style.display = 'block';
    } else {
        console.error('Error en handleObtenerTransporteEditar:', response);
        mostrarError('Error al cargar los datos para editar');
    }
}
// Modificar el evento submit del formulario
function handleObtenerTransporteEditar(response) {
    console.log('Respuesta edición:', response);
    if (response.success) {
        const datos = response.data;
        
        // Indicar que estamos en modo edición
        document.getElementById('modoEdicion').value = 'editar';
        
        // Llenar el formulario con los datos existentes
        document.getElementById('ordenTransporte').value = datos.ordenTransporte;
        document.getElementById('ordenTransporte').readOnly = true; // Hacer el campo de orden no editable
        document.getElementById('fechaServicio').value = datos.fechaServicio.split('T')[0];
        document.getElementById('liderEquipo').value = datos.liderEquipo;
        document.getElementById('cliente').value = datos.cliente;
        document.getElementById('puntoInicial').value = datos.puntoInicial;
        document.getElementById('puntoDestino').value = datos.puntoDestino;
        document.getElementById('horaCita').value = datos.horaCita || '';
        document.getElementById('horaLlegada').value = datos.horaLlegada || '';
        document.getElementById('horaInicio').value = datos.horaInicio || '';
        document.getElementById('horaFin').value = datos.horaFin || '';
        document.getElementById('totalHoras').value = datos.totalHoras || '';
        document.getElementById('placaTransporte').value = datos.placaTransporte;
        document.getElementById('numeroContenedor').value = datos.numeroContenedor;
        document.getElementById('solicitante').value = datos.solicitante;
        document.getElementById('tipoServicio').value = datos.tipoServicio;
        document.getElementById('zona').value = datos.zona;

        // Cambiar el título del modal
        document.querySelector('#modalTransporte h3').textContent = 'Editar Transporte';
        
        // Abrir el modal
        document.getElementById('modalTransporte').style.display = 'block';
    } else {
        console.error('Error en handleObtenerTransporteEditar:', response);
        mostrarError('Error al cargar los datos para editar');
    }
}

// Callback para manejar la respuesta del registro/actualización
function handleRegistroTransporte(response) {
    if (response.success) {
        cerrarModal('modalTransporte');
        cargarRegistros();
        const mensaje = document.getElementById('modoEdicion').value === 'editar' 
            ? 'Registro actualizado exitosamente' 
            : 'Registro guardado exitosamente';
        mostrarMensaje(mensaje);
    } else {
        mostrarError(response.message || 'Error al procesar el registro');
    }
}