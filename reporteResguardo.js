const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';
const CLOUDINARY_CLOUD_NAME = 'do7yzmfz4';
const CLOUDINARY_UPLOAD_PRESET = 'goes_preset';
let uploadedImage = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarOrdenesTransporte();
    
    // Evento para subir foto
    document.getElementById('foto').addEventListener('change', handleImageUpload);
    
    // Evento para enviar formulario
    document.getElementById('reporteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarReporte();
    });
});

function cargarOrdenesTransporte() {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
        showStatus('No hay usuario activo', false);
        return;
    }

    const script = document.createElement('script');
    const callback = 'handleOrdenesTransporte';
    script.src = `${API_URL}?action=getOrdenesResguardo&usuario=${userData.username}&callback=${callback}`;
    document.body.appendChild(script);
}

window.handleOrdenesTransporte = function(response) {
    if (response.success) {
        const select = document.getElementById('ordenTransporte');
        select.innerHTML = '<option value="">Seleccione una orden...</option>';
        
        response.data.forEach(orden => {
            const option = document.createElement('option');
            option.value = orden;
            option.textContent = orden;
            select.appendChild(option);
        });
    } else {
        showStatus('Error al cargar órdenes', false);
    }
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('preview');
    preview.innerHTML = 'Subiendo...';

    try {
        const imageUrl = await uploadToCloudinary(file);
        uploadedImage = imageUrl;
        preview.style.backgroundImage = `url(${imageUrl})`;
        preview.innerHTML = '';
    } catch (error) {
        console.error('Error al subir imagen:', error);
        preview.innerHTML = 'Error al subir imagen';
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

        if (!response.ok) throw new Error('Error al subir imagen');
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error en uploadToCloudinary:', error);
        throw error;
    }
}

function registrarReporte() {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
        showStatus('No hay usuario activo', false);
        return;
    }

    if (!uploadedImage) {
        showStatus('Debe incluir una foto', false);
        return;
    }

    showStatus('Obteniendo ubicación...', true);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const datos = {
                    ordenTransporte: document.getElementById('ordenTransporte').value,
                    usuario: userData.username,
                    detalles: document.getElementById('detalles').value,
                    evidencia: uploadedImage,
                    ubicacion: `${position.coords.latitude}, ${position.coords.longitude}`
                };

                const script = document.createElement('script');
                const callback = 'handleRegistroReporte';
                script.src = `${API_URL}?action=registrarReporteResguardo&datos=${encodeURIComponent(JSON.stringify(datos))}&callback=${callback}`;
                document.body.appendChild(script);
            },
            error => {
                console.error('Error de geolocalización:', error);
                const datos = {
                    ordenTransporte: document.getElementById('ordenTransporte').value,
                    usuario: userData.username,
                    detalles: document.getElementById('detalles').value,
                    evidencia: uploadedImage,
                    ubicacion: 'No disponible'
                };

                const script = document.createElement('script');
                const callback = 'handleRegistroReporte';
                script.src = `${API_URL}?action=registrarReporteResguardo&datos=${encodeURIComponent(JSON.stringify(datos))}&callback=${callback}`;
                document.body.appendChild(script);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        const datos = {
            ordenTransporte: document.getElementById('ordenTransporte').value,
            usuario: userData.username,
            detalles: document.getElementById('detalles').value,
            evidencia: uploadedImage,
            ubicacion: 'No disponible'
        };

        const script = document.createElement('script');
        const callback = 'handleRegistroReporte';
        script.src = `${API_URL}?action=registrarReporteResguardo&datos=${encodeURIComponent(JSON.stringify(datos))}&callback=${callback}`;
        document.body.appendChild(script);
    }
}

window.handleRegistroReporte = function(response) {
    if (response.success) {
        showStatus('Reporte registrado correctamente', true);
        document.getElementById('reporteForm').reset();
        document.getElementById('preview').style.backgroundImage = '';
        document.getElementById('preview').innerHTML = '';
        uploadedImage = null;
    } else {
        showStatus('Error al registrar reporte: ' + response.message, false);
    }
}

function showStatus(message, isSuccess) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'success' : 'error';
    statusDiv.style.display = 'block';

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}
