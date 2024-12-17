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
    // Función auxiliar para convertir fecha DD/MM/YYYY a objeto Date y ajustar zona horaria
    function parseDate(dateStr) {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        const date = new Date(year, month - 1, day);
        date.setUTCHours(0, 0, 0, 0);
        return date;
    }

    // Agregar el filtro personalizado para fechas
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            var fechaInicio = $('#fechaInicio').val();
            var fechaFin = $('#fechaFin').val();
            
            // Si no hay fechas seleccionadas, mostrar todo
            if (!fechaInicio && !fechaFin) return true;
            
            // Obtener la fecha del registro (columna 1)
            var fechaServicio = data[1];
            if (!fechaServicio) return false;
            
            try {
                // Convertir las fechas para comparación
                var fechaReg = parseDate(fechaServicio);
                var inicio = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null;
                var fin = fechaFin ? new Date(fechaFin + 'T23:59:59') : null;
                
                // Para debug
                console.log('Fecha Registro:', fechaReg);
                console.log('Fecha Inicio:', inicio);
                console.log('Fecha Fin:', fin);
                
                // Validar el rango de fechas
                if (inicio && fin) {
                    return fechaReg >= inicio && fechaReg <= fin;
                } else if (inicio) {
                    return fechaReg >= inicio;
                } else if (fin) {
                    return fechaReg <= fin;
                }
            } catch (e) {
                console.error('Error en filtro de fechas:', e);
                return false;
            }
            return true;
        }
    );

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
                    columns: [0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16]
                },
                title: 'Control_de_Transportes',
                customize: function(xlsx) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];
                    
                    console.log('Procesando Excel...');
                    
                    $('row c[r^="B"]', sheet).each(function() {
                        console.log('Valor encontrado en columna B:', $(this).text());
                        console.log('Atributos de la celda:', $(this).attr('r'), $(this).attr('t'));
                    });

                    $('row c[r^="B"]', sheet).each(function() {
                        var value = $(this).text();
                        console.log('Procesando valor:', value);
                        
                        if (value && value.trim() !== '') {
                            try {
                                $(this).attr('t', 'inlineStr');
                                var is = xlsx.xl.worksheets['sheet1.xml'].createElement('is');
                                var t = xlsx.xl.worksheets['sheet1.xml'].createElement('t');
                                t.textContent = value;
                                is.appendChild(t);
                                $(this).empty().append(is);
                            } catch (e) {
                                console.error('Error procesando celda:', e);
                            }
                        }
                    });
                }
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
                targets: [7,8,9,10,11,12,13,14,15,16],
                visible: false
            }
        ],
        responsive: true,
        order: [[1, 'desc']]
    });

    // Eventos para los filtros
    $('#filtrarFechas').on('click', function() {
        tabla.draw();
    });

    $('#limpiarFiltros').on('click', function() {
        $('#fechaInicio').val('');
        $('#fechaFin').val('');
        tabla.draw();
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
        const obtenerHora = (valor) => {
            if (!valor) return '';
            
            // Si es una hora simple (formato HH:mm)
            if (valor.includes(':') && valor.length <= 5) {
                return valor;
            }
            
            // Si es una fecha ISO
            if (valor.includes('T')) {
                const fecha = new Date(valor);
                const horas = fecha.getUTCHours().toString().padStart(2, '0');
                const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
                return `${horas}:${minutos}`;
            }
            
            return '';
        };

        const datos = response.data.map(registro => {
            // Formatear fecha
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
                obtenerHora(registro.horaCita),
                obtenerHora(registro.horaLlegada),
                obtenerHora(registro.horaInicio),
                obtenerHora(registro.horaFin),
                obtenerHora(registro.totalHoras),
                registro.placaTransporte,
                registro.numeroContenedor,
                registro.solicitante,
                registro.tipoServicio,
                registro.zona
            ];
        });

        tabla.clear().rows.add(datos).draw();
    } else {
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
        const mensaje = document.getElementById('modoEdicion').value === 'editar' 
            ? 'Registro actualizado exitosamente' 
            : 'Registro guardado exitosamente';
        
        // Guardar los valores del formulario antes de cerrar
        const formValues = {
            fechaServicio: document.getElementById('fechaServicio').value,
            liderEquipo: document.getElementById('liderEquipo').value,
            cliente: document.getElementById('cliente').value,
            puntoInicial: document.getElementById('puntoInicial').value,
            puntoDestino: document.getElementById('puntoDestino').value,
            horaCita: document.getElementById('horaCita').value,
            horaLlegada: document.getElementById('horaLlegada').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaFin: document.getElementById('horaFin').value,
            totalHoras: document.getElementById('totalHoras').value,
            placaTransporte: document.getElementById('placaTransporte').value,
            numeroContenedor: document.getElementById('numeroContenedor').value,
            solicitante: document.getElementById('solicitante').value,
            tipoServicio: document.getElementById('tipoServicio').value,
            zona: document.getElementById('zona').value
        };
        
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: mensaje
        }).then(() => {
            cargarRegistros();
            cerrarModal('modalTransporte');
            
            // Restaurar los valores si es necesario
            if (document.getElementById('modoEdicion').value === 'nuevo') {
                Object.keys(formValues).forEach(key => {
                    if (document.getElementById(key)) {
                        document.getElementById(key).value = formValues[key];
                    }
                });
            }
        });
    } else {
        mostrarError(response.message || 'Error al guardar el registro');
    }
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
    if (response.success) {
        const datos = response.data;
        
        // Función mejorada para extraer hora
        const obtenerHora = (valor) => {
            if (!valor) return '';
            
            // Si es una hora simple (formato HH:mm)
            if (valor.includes(':') && valor.length <= 5) {
                return valor;
            }
            
            // Si es una fecha ISO
            if (valor.includes('T')) {
                const fecha = new Date(valor);
                const horas = fecha.getUTCHours().toString().padStart(2, '0');
                const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
                return `${horas}:${minutos}`;
            }
            
            return '';
        };

        // Log para depuración
        console.log('Procesando datos:', {
            horaCitaOriginal: datos.horaCita,
            horaCitaFormateada: obtenerHora(datos.horaCita)
        });

        // Establecer valores en el formulario
        document.getElementById('ordenTransporte').value = datos.ordenTransporte;
        document.getElementById('ordenTransporte').readOnly = true;
        
        // Establecer fecha
        document.getElementById('fechaServicio').value = datos.fechaServicio.split('T')[0];
        
        // Establecer horas
        document.getElementById('horaCita').value = obtenerHora(datos.horaCita);
        document.getElementById('horaLlegada').value = obtenerHora(datos.horaLlegada);
        document.getElementById('horaInicio').value = obtenerHora(datos.horaInicio);
        document.getElementById('horaFin').value = obtenerHora(datos.horaFin);
        document.getElementById('totalHoras').value = obtenerHora(datos.totalHoras);
        
        // Establecer otros campos
        document.getElementById('liderEquipo').value = datos.liderEquipo || '';
        document.getElementById('cliente').value = datos.cliente || '';
        document.getElementById('puntoInicial').value = datos.puntoInicial || '';
        document.getElementById('puntoDestino').value = datos.puntoDestino || '';
        document.getElementById('placaTransporte').value = datos.placaTransporte || '';
        document.getElementById('numeroContenedor').value = datos.numeroContenedor || '';
        document.getElementById('solicitante').value = datos.solicitante || '';
        document.getElementById('tipoServicio').value = datos.tipoServicio || '';
        document.getElementById('zona').value = datos.zona || '';

        // Mostrar modal
        document.querySelector('#modalTransporte h3').textContent = 'Editar Transporte';
        document.getElementById('modalTransporte').style.display = 'block';
    } else {
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
        const modoEdicion = document.getElementById('modoEdicion').value;
        const mensaje = modoEdicion === 'editar' 
            ? 'Registro actualizado exitosamente' 
            : 'Registro guardado exitosamente';
        
        // Guardar los valores actuales del formulario
        const formValues = {
            fechaServicio: document.getElementById('fechaServicio').value,
            horaCita: document.getElementById('horaCita').value,
            horaLlegada: document.getElementById('horaLlegada').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaFin: document.getElementById('horaFin').value,
            totalHoras: document.getElementById('totalHoras').value
            // ... otros campos si es necesario
        };

        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: mensaje,
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Primero actualizar la tabla
                cargarRegistros();
                
                // Luego cerrar el modal
                cerrarModal('modalTransporte');
                
                // Finalmente, si estamos en modo edición, restaurar los valores
                if (modoEdicion === 'editar') {
                    setTimeout(() => {
                        document.getElementById('fechaServicio').value = formValues.fechaServicio;
                        document.getElementById('horaCita').value = formValues.horaCita;
                        document.getElementById('horaLlegada').value = formValues.horaLlegada;
                        document.getElementById('horaInicio').value = formValues.horaInicio;
                        document.getElementById('horaFin').value = formValues.horaFin;
                        document.getElementById('totalHoras').value = formValues.totalHoras;
                    }, 100);
                }
            }
        });
    } else {
        mostrarError(response.message || 'Error al procesar el registro');
    }
}

// AGREGAR ESTAS FUNCIONES AQUÍ

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
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Resguardos asignados exitosamente'
        }).then(() => {
            cerrarModal('modalResguardos');
            cargarRegistros();
        });
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
