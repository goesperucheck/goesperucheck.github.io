let html5QrcodeScanner = null;
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';
const CLOUDINARY_CLOUD_NAME = 'do7yzmfz4'; // Reemplaza con tu cloud name
const CLOUDINARY_UPLOAD_PRESET = 'goes_preset'; // Reemplaza con tu upload preset
let uploadedImages = {
    foto1: null,
    foto2: null
};

document.addEventListener('DOMContentLoaded', function() {
    const scanButton = document.getElementById('scanButton');
    const closeScanner = document.getElementById('closeScanner');
    const qrScanner = document.getElementById('qrScanner');

    // Eventos del escáner
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

    // Eventos del modal
    document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
    document.getElementById('rondaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarRonda();
    });

    // Eventos de las fotos
    document.getElementById('foto1').addEventListener('change', (e) => handleImageUpload(e, 'foto1'));
    document.getElementById('foto2').addEventListener('change', (e) => handleImageUpload(e, 'foto2'));
});

// ... (mantener todas las funciones existentes hasta registrarRonda) ...

function registrarRonda() {
    const datos = {
        fecha: new Date().toISOString(),
        usuario: document.getElementById('modalUsuario').value,
        unidad: document.getElementById('modalUnidad').value,
        uniforme: {
            valor: document.getElementById('uniformeSelect').value,
            detalles: document.getElementById('uniformeDetalles').value
        },
        documentacion: {
            valor: document.getElementById('documentacionSelect').value,
            detalles: document.getElementById('documentacionDetalles').value
        },
        extintores: {
            valor: document.getElementById('extintoresSelect').value,
            detalles: document.getElementById('extintoresDetalles').value
        },
        zonasValor: {
            valor: document.getElementById('zonasValorSelect').value,
            detalles: document.getElementById('zonasValorDetalles').value
        },
        perimetroInterno: {
            valor: document.getElementById('perimetroInternoSelect').value,
            detalles: document.getElementById('perimetroInternoDetalles').value
        },
        perimetroExterno: {
            valor: document.getElementById('perimetroExternoSelect').value,
            detalles: document.getElementById('perimetroExternoDetalles').value
        },
        evidencias: {
            foto1: uploadedImages.foto1,
            foto2: uploadedImages.foto2
        }
    };

    console.log('Enviando datos:', datos);

    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        console.log('Respuesta del servidor:', response);
        if (response.success) {
            showStatus('Ronda registrada correctamente', true);
            cerrarModal();
        } else {
            showStatus('Error al registrar ronda: ' + response.message, false);
        }
        
        document.body.removeChild(script);
        delete window[callback];
    };
    
    const params = new URLSearchParams({
        action: 'registrarRonda',
        datos: JSON.stringify(datos),
        callback: callback
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

// Nuevas funciones para manejar las imágenes
async function handleImageUpload(event, photoId) {
    const file = event.target.files[0];
    if (!file) return;

    // Mostrar preview
    const preview = document.getElementById(`preview${photoId.slice(-1)}`);
    preview.innerHTML = 'Subiendo...';
    preview.classList.add('has-image');

    try {
        const imageUrl = await uploadToCloudinary(file);
        uploadedImages[photoId] = imageUrl;
        
        // Actualizar preview con la imagen subida
        preview.style.backgroundImage = `url(${imageUrl})`;
        preview.innerHTML = '';
        
        console.log(`${photoId} subida exitosamente:`, imageUrl);
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

function initQRScanner() {
    if (html5QrcodeScanner) {
        stopScanner();
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
            (decodedText) => {
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
    document.getElementById('rondaModal').style.display = 'flex';
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


function cerrarModal() {
    document.getElementById('rondaModal').style.display = 'none';
    document.getElementById('rondaForm').reset();
    // Limpiar las previsualizaciones de las imágenes
    document.getElementById('preview1').style.backgroundImage = '';
    document.getElementById('preview2').style.backgroundImage = '';
    document.getElementById('preview1').innerHTML = '';
    document.getElementById('preview2').innerHTML = '';
    // Resetear las imágenes subidas
    uploadedImages = {
        foto1: null,
        foto2: null
    };
}