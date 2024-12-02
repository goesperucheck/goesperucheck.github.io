let html5QrcodeScanner = null;
let turnos = [];
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('welcomeModal').style.display = 'flex';
    document.getElementById('btnEntendido').addEventListener('click', function() {
        document.getElementById('welcomeModal').style.display = 'none';
    });
    const scanButton = document.getElementById('scanButton');
    const closeScanner = document.getElementById('closeScanner');
    const qrScanner = document.getElementById('qrScanner');

    // Cargar turnos al inicio
    cargarTurnos();

    scanButton.addEventListener('click', function() {
        console.log('Iniciando escáner');
        qrScanner.style.display = 'block';
        initQRScanner();
    });

    closeScanner.addEventListener('click', function() {
        console.log('Cerrando escáner');
        stopScanner();
        qrScanner.style.display = 'none';
    });

    // Eventos para el modal
    document.getElementById('btnRegistrar').addEventListener('click', confirmarRegistro);
    document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
});

function cargarTurnos() {
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        if (response.success) {
            turnos = response.data;
            const select = document.getElementById('modalTurno');
            turnos.forEach(turno => {
                const option = document.createElement('option');
                option.value = turno;
                option.textContent = turno;
                select.appendChild(option);
            });
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    script.src = `${API_URL}?action=getTurnos&callback=${callback}`;
    document.body.appendChild(script);
}

// ... mantener las funciones initQRScanner y stopScanner sin cambios ...

function processQRCode(decodedText) {
    console.log('Procesando QR:', decodedText);
    stopScanner();
    document.getElementById('qrScanner').style.display = 'none';

    if (!decodedText.trim()) {
        showStatus('Error: Código QR vacío', false);
        return;
    }

    // Mostrar modal con los datos
    const userData = JSON.parse(localStorage.getItem('user'));
    document.getElementById('modalUsuario').value = userData.username;
    document.getElementById('modalUnidad').value = decodedText.trim();
    document.getElementById('registroModal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('registroModal').style.display = 'none';
    document.getElementById('modalTurno').value = '';
}

function confirmarRegistro() {
    const btnRegistrar = document.getElementById('btnRegistrar');
    const turno = document.getElementById('modalTurno').value;
    
    if (!turno) {
        showStatus('Por favor seleccione un turno', false);
        return;
    }

    // Deshabilitar el botón y mostrar estado de carga
    btnRegistrar.disabled = true;
    btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    const unidad = document.getElementById('modalUnidad').value;
    showStatus('Obteniendo ubicación precisa...', true);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log("Coordenadas recibidas:", {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    precision: position.coords.accuracy,
                    timestamp: new Date(position.timestamp).toLocaleString()
                });

                if (position.coords.accuracy > 100) {
                    if (!confirm(`La precisión GPS es baja (${Math.round(position.coords.accuracy)} metros). ¿Desea continuar de todos modos?`)) {
                        showStatus('Registro cancelado. Intente en un lugar con mejor señal GPS', false);
                        // Restaurar el botón si se cancela
                        btnRegistrar.disabled = false;
                        btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
                        return;
                    }
                }
                
                registrarAsistencia(unidad, turno, position);
            },
            error => {
                console.error('Error de geolocalización:', error);
                if (confirm('No se pudo obtener una ubicación precisa. ¿Desea registrar sin ubicación?')) {
                    registrarAsistencia(unidad, turno, null);
                } else {
                    showStatus('Registro cancelado', false);
                    // Restaurar el botón si se cancela
                    btnRegistrar.disabled = false;
                    btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        if (confirm('Su dispositivo no soporta geolocalización. ¿Desea registrar sin ubicación?')) {
            registrarAsistencia(unidad, turno, null);
        } else {
            showStatus('Registro cancelado', false);
            // Restaurar el botón si se cancela
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
        }
    }
}

function registrarAsistencia(unidad, turno, position) {
    const btnRegistrar = document.getElementById('btnRegistrar');
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
        showStatus('Error: Sesión no válida', false);
        // Restaurar el botón en caso de error
        btnRegistrar.disabled = false;
        btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
        return;
    }

    // Verificación de marcación previa
    const script1 = document.createElement('script');
    const callback1 = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback1] = function(response) {
        console.log('Respuesta de verificación:', response);
        
        if (response.success) {
            const asistencias = response.data;
            console.log('Asistencias del día:', asistencias);
            
            // Verificar marcación en la última hora
            const ahora = new Date();
            const marcacionReciente = asistencias.find(a => {
                const fechaMarcacion = new Date(a.fecha);
                const diferenciaMinutos = (ahora - fechaMarcacion) / (1000 * 60); // Diferencia en minutos
                return a.usuario === userData.username && diferenciaMinutos < 60;
            });

            if (marcacionReciente) {
                const tiempoRestante = Math.ceil(60 - ((ahora - new Date(marcacionReciente.fecha)) / (1000 * 60)));
                showStatus(`Debes esperar ${tiempoRestante} minutos para volver a registrar asistencia`, false);
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
                cerrarModal();
                return;
            }
            
            // Verificar marcación en el mismo turno
            const marcacionesHoy = asistencias.filter(a => {
                const horaRegistro = new Date(a.fecha).getHours();
                let esMismoTurno = false;
                
                if (turno === 'D' && horaRegistro >= 5 && horaRegistro < 10) {
                    esMismoTurno = true;
                } else if (turno === 'T' && horaRegistro >= 14 && horaRegistro < 17) {
                    esMismoTurno = true;
                } else if (turno === 'N' && horaRegistro >= 17 && horaRegistro < 20) {
                    esMismoTurno = true;
                }
                
                return a.unidad === unidad && 
                       a.usuario === userData.username &&
                       esMismoTurno;
            });
            
            if (marcacionesHoy.length > 0) {
                showStatus('Ya registraste tu asistencia en este turno', false);
                cerrarModal();
                return;
            }
            
            enviarRegistro();
        } else {
            // Restaurar el botón en caso de error
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
        }
        
        document.body.removeChild(script1);
        delete window[callback1];
    };
    
    const params1 = new URLSearchParams({
        action: 'obtenerDetalleAsistencias',
        fecha: new Date().toISOString().split('T')[0],
        unidad: unidad,
        callback: callback1
    });
    
    script1.src = `${API_URL}?${params1.toString()}`;
    document.body.appendChild(script1);
    
    function enviarRegistro() {
        const datos = {
            fecha: new Date().toISOString(),
            usuario: userData.username,
            unidad: unidad,
            turno: turno,
            ubicacion: position ? {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            } : null
        };

        const script2 = document.createElement('script');
        const callback2 = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
        
        window[callback2] = function(response) {
            if (response.success) {
                showStatus(`Asistencia registrada correctamente en ${unidad}`, true);
                cerrarModal();
            } else {
                showStatus('Error al registrar asistencia: ' + response.message, false);
                // Restaurar el botón solo en caso de error
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
            }
            
            document.body.removeChild(script2);
            delete window[callback2];
        };
        
        const params2 = new URLSearchParams({
            action: 'registrarAsistencia',
            datos: JSON.stringify(datos),
            callback: callback2
        });
        
        script2.src = `${API_URL}?${params2.toString()}`;
        document.body.appendChild(script2);
    }

    
    function enviarRegistro() {
        const datos = {
            fecha: new Date().toISOString(),
            usuario: userData.username,
            unidad: unidad,
            turno: turno,
            ubicacion: position ? {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            } : null
        };

        const script2 = document.createElement('script');
        const callback2 = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
        
        window[callback2] = function(response) {
            if (response.success) {
                showStatus(`Asistencia registrada correctamente en ${unidad}`, true);
                cerrarModal();
            } else {
                showStatus('Error al registrar asistencia: ' + response.message, false);
                // Restaurar el botón solo en caso de error
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar';
            }
            
            document.body.removeChild(script2);
            delete window[callback2];
        };
        
        const params2 = new URLSearchParams({
            action: 'registrarAsistencia',
            datos: JSON.stringify(datos),
            callback: callback2
        });
        
        script2.src = `${API_URL}?${params2.toString()}`;
        document.body.appendChild(script2);
    }
}
function initQRScanner() {
    if (html5QrcodeScanner) {
        stopScanner(); // Asegurarnos de detener cualquier instancia previa
    }

    try {
        html5QrcodeScanner = new Html5Qrcode("reader");
        const config = {
            fps: 10,
            qrbox: 250
        };

        html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                console.log('QR detectado:', decodedText);
                processQRCode(decodedText);
            },
            (errorMessage) => {
                // Ignoramos errores de escaneo continuo
            }
        ).catch((err) => {
            console.error('Error al iniciar scanner:', err);
            showStatus('Error al acceder a la cámara', false);
        });

    } catch (error) {
        console.error('Error al crear scanner:', error);
        showStatus('Error al inicializar el escáner', false);
    }
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            console.log('Scanner detenido');
            html5QrcodeScanner = null;
        }).catch((err) => {
            console.error('Error al detener scanner:', err);
        });
    }
}


function showStatus(message, isSuccess) {
    console.log(isSuccess ? 'Éxito:' : 'Error:', message);
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'success' : 'error';
    statusDiv.style.display = 'block';

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}
