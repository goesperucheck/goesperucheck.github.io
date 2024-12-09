let html5QrcodeScanner = null;
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';
const CLOUDINARY_CLOUD_NAME = 'do7yzmfz4';
const CLOUDINARY_UPLOAD_PRESET = 'goes_preset';
let uploadedImage = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar la existencia de todos los elementos necesarios
    const scanButton = document.getElementById('scanButton');
    const closeScanner = document.getElementById('closeScanner');
    const qrScanner = document.getElementById('qrScanner');
    const btnCancelar = document.getElementById('btnCancelar');
    const rondaForm = document.getElementById('rondaForm');
    const fotoInput = document.getElementById('foto');
    const reader = document.getElementById('reader');

    // Verificar elementos críticos y mostrar errores si no existen
    if (!scanButton) console.error('Elemento scanButton no encontrado');
    if (!closeScanner) console.error('Elemento closeScanner no encontrado');
    if (!qrScanner) console.error('Elemento qrScanner no encontrado');
    if (!btnCancelar) console.error('Elemento btnCancelar no encontrado');
    if (!rondaForm) console.error('Elemento rondaForm no encontrado');
    if (!fotoInput) console.error('Elemento foto no encontrado');
    if (!reader) console.error('Elemento reader no encontrado');

    // Solo agregar event listeners si los elementos existen
    if (scanButton) {
        scanButton.addEventListener('click', function() {
            console.log('Iniciando escáner');
            if (qrScanner) {
                qrScanner.style.display = 'block';
                initQRScanner();
            }
        });
    }

    if (closeScanner) {
        closeScanner.addEventListener('click', function() {
            console.log('Cerrando escáner');
            stopScanner();
            if (qrScanner) {
                qrScanner.style.display = 'none';
            }
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModal);
    }

    if (rondaForm) {
        rondaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            registrarRonda();
        });
    }

    if (fotoInput) {
        fotoInput.addEventListener('change', handleImageUpload);
    }
});

function initQRScanner() {
    const reader = document.getElementById('reader');
    if (!reader) {
        console.error('Elemento reader no encontrado');
        showStatus('Error: Elemento de escáner no encontrado', false);
        return;
    }

    try {
        // Crear una nueva instancia del scanner
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            /* verbose= */ false
        );

        html5QrcodeScanner.render((decodedText) => {
            console.log('QR Code detected:', decodedText);
            // Detener el scanner después de una detección exitosa
            html5QrcodeScanner.clear();
            // Procesar el código QR
            processQRCode(decodedText);
        }, (error) => {
            // Manejar errores silenciosamente
        });

        console.log('Scanner iniciado correctamente');
    } catch (error) {
        console.error('Error al crear scanner:', error);
        showStatus('Error al inicializar el escáner: ' + error.message, false);
    }
}

function stopScanner() {
    if (html5QrcodeScanner) {
        try {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
            console.log('Scanner detenido');
        } catch (error) {
            console.error('Error al detener scanner:', error);
        }
    }
}

function processQRCode(decodedText) {
    console.log('Procesando QR:', decodedText);
    
    const qrScanner = document.getElementById('qrScanner');
    if (qrScanner) {
        qrScanner.style.display = 'none';
    }

    if (!decodedText.trim()) {
        showStatus('Error: Código QR vacío', false);
        return;
    }

    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            showStatus('Error: No hay datos de usuario', false);
            return;
        }

        const modalUsuario = document.getElementById('modalUsuario');
        const modalUnidad = document.getElementById('modalUnidad');
        const modal = document.getElementById('confirmModal');

        if (!modalUsuario || !modalUnidad || !modal) {
            console.error('Elementos del modal no encontrados:', {
                modalUsuario: !!modalUsuario,
                modalUnidad: !!modalUnidad,
                modal: !!modal
            });
            showStatus('Error: Elementos no encontrados', false);
            return;
        }

        // Asignar valores y mostrar modal
        modalUsuario.value = userData.username;
        modalUnidad.value = decodedText.trim();
        modal.style.display = 'flex';
        
        console.log('Modal mostrado con éxito', {
            usuario: modalUsuario.value,
            unidad: modalUnidad.value
        });
    } catch (error) {
        console.error('Error al procesar QR:', error);
        showStatus('Error al procesar el código QR', false);
    }
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('preview');
    if (!preview) {
        console.error('Elemento preview no encontrado');
        return;
    }

    preview.innerHTML = 'Subiendo...';
    preview.classList.add('has-image');

    try {
        const imageUrl = await uploadToCloudinary(file);
        uploadedImage = imageUrl;
        
        preview.style.backgroundImage = `url(${imageUrl})`;
        preview.innerHTML = '';
        
        console.log('Imagen subida exitosamente:', imageUrl);
    } catch (error) {
        console.error('Error al subir imagen:', error);
        preview.innerHTML = 'Error al subir imagen';
        preview.classList.remove('has-image');
    }
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Error al subir imagen');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error en uploadToCloudinary:', error);
        throw error;
    }
}

function registrarRonda() {
    const modalUsuario = document.getElementById('modalUsuario');
    const modalUnidad = document.getElementById('modalUnidad');
    const observaciones = document.getElementById('observaciones');
    const btnRegistrar = document.querySelector('#rondaForm button[type="submit"]');
    const modal = document.getElementById('confirmModal');

    if (!modalUsuario || !modalUnidad || !observaciones) {
        showStatus('Error: Faltan elementos del formulario', false);
        return;
    }

    // Deshabilitar el botón de registro
    if (btnRegistrar) {
        btnRegistrar.disabled = true;
        btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    }

    const datos = {
        fecha: new Date().toISOString(),
        usuario: modalUsuario.value,
        unidad: modalUnidad.value,
        observaciones: observaciones.value,
        evidencia: uploadedImage
    };

    console.log('Enviando datos:', datos);

    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        try {
            console.log('Respuesta del servidor:', response);
            
            // Modificar la validación de la respuesta
            if (response && typeof response === 'object') {
                if (response.success === true) {
                    showStatus('Ronda registrada correctamente', true);
                    cerrarModal();
                } else {
                    showStatus(response.message || 'Error al registrar ronda', false);
                }
            } else if (response === true) {  // Para manejar respuestas booleanas directas
                showStatus('Ronda registrada correctamente', true);
                cerrarModal();
            } else {
                showStatus('Ronda registrada correctamente', true);
                cerrarModal();
            }
    
            // Rehabilitar el botón en cualquier caso
            const btnRegistrar = document.querySelector('#rondaForm button[type="submit"]');
            if (btnRegistrar) {
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Confirmar';
            }
        } catch (error) {
            console.error('Error al procesar respuesta:', error);
            showStatus('Error al procesar la respuesta del servidor', false);
            cerrarModal();
            
            const btnRegistrar = document.querySelector('#rondaForm button[type="submit"]');
            if (btnRegistrar) {
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Confirmar';
            }
        } finally {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window[callback];
        }
    };
    
    const params = new URLSearchParams({
        action: 'registrarRondaInterna',
        datos: JSON.stringify(datos),
        callback: callback
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

function showStatus(message, isSuccess) {
    console.log(isSuccess ? 'Éxito:' : 'Error:', message);
    const statusDiv = document.getElementById('status');
    if (!statusDiv) {
        console.error('Elemento status no encontrado');
        return;
    }
    
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'success' : 'error';
    statusDiv.style.display = 'block';

    // Mostrar el mensaje por más tiempo
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, isSuccess ? 5000 : 3000);
}

function cerrarModal() {
    const modal = document.getElementById('confirmModal');
    const form = document.getElementById('rondaForm');
    const preview = document.getElementById('preview');

    if (modal) {
        modal.style.display = 'none';
    }
    
    if (form) {
        form.reset();
    }
    
    if (preview) {
        preview.style.backgroundImage = '';
        preview.classList.remove('has-image'); // Agregamos esta línea
        preview.innerHTML = '';
    }
    
    uploadedImage = null;

    // Limpiar cualquier mensaje de estado previo
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}
