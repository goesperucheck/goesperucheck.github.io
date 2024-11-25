let html5QrcodeScanner = null;
let turnos = [];
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

document.addEventListener('DOMContentLoaded', function() {
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
    const turno = document.getElementById('modalTurno').value;
    if (!turno) {
        showStatus('Por favor seleccione un turno', false);
        return;
    }

    const unidad = document.getElementById('modalUnidad').value;
    showStatus('Obteniendo ubicación precisa...', true);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log("Coordenadas recibidas:", {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    precision: position.coords.accuracy, // metros
                    timestamp: new Date(position.timestamp).toLocaleString()
                });

                // Verificar la precisión
                if (position.coords.accuracy > 100) { // más de 100 metros
                    if (!confirm(`La precisión GPS es baja (${Math.round(position.coords.accuracy)} metros). ¿Desea continuar de todos modos?`)) {
                        showStatus('Registro cancelado. Intente en un lugar con mejor señal GPS', false);
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
                }
            },
            {
                enableHighAccuracy: true,    // Solicitar alta precisión
                timeout: 10000,              // Aumentar timeout a 10 segundos
                maximumAge: 0                // No usar cache
            }
        );
    } else {
        if (confirm('Su dispositivo no soporta geolocalización. ¿Desea registrar sin ubicación?')) {
            registrarAsistencia(unidad, turno, null);
        } else {
            showStatus('Registro cancelado', false);
        }
    }
}

function registrarAsistencia(unidad, turno, position) {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
        showStatus('Error: Sesión no válida', false);
        return;
    }

    // Primero verificamos si ya marcó en este turno
    const script1 = document.createElement('script');
    const callback1 = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback1] = function(response) {
        console.log('Respuesta de verificación:', response);
        
        if (response.success) {
            const asistencias = response.data;
            console.log('Asistencias del día:', asistencias);
            
            // Verificar si ya hay una marcación en este turno
            const marcacionesHoy = asistencias.filter(a => {
                const horaRegistro = new Date(a.fecha).getHours();
                let esMismoTurno = false;
                
                // Determinar si está en el mismo turno
                if (turno === 'D' && horaRegistro >= 5 && horaRegistro < 10) {
                    esMismoTurno = true;
                } else if (turno === 'T' && horaRegistro >= 14 && horaRegistro < 17) {
                    esMismoTurno = true;
                } else if (turno === 'N' && horaRegistro >= 17 && horaRegistro < 20) {
                    esMismoTurno = true;
                }
                
                console.log('Verificando asistencia:', {
                    asistencia: a,
                    horaRegistro,
                    esMismoTurno,
                    mismaUnidad: a.unidad === unidad,
                    mismoUsuario: a.usuario === userData.username
                });

                return a.unidad === unidad && 
                       a.usuario === userData.username &&
                       esMismoTurno;
            });
            
            console.log('Marcaciones encontradas:', marcacionesHoy);
            
            if (marcacionesHoy.length > 0) {
                showStatus('Ya registraste tu asistencia en este turno', false);
                document.getElementById('btnRegistrar').disabled = true; // Deshabilitamos el botón
                cerrarModal();
                return;
            }
            
            // Si no hay marcación previa, procedemos con el registro
            enviarRegistro();
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
    
    // Función para enviar el registro si pasa la validación
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