const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

document.addEventListener('DOMContentLoaded', function() {
    cargarUnidades();
    cargarTurnos();
    
    document.getElementById('registroForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarAsistencia();
    });
});

function cargarUnidades() {
    const script = document.createElement('script');
    const callback = 'callback_' + Math.random().toString(36).substr(2, 9);
    
    window[callback] = function(response) {
        if (response.success) {
            const select = document.getElementById('unidad');
            select.innerHTML = '<option value="">Seleccione una unidad...</option>';
            
            response.data.forEach(unidad => {
                const option = document.createElement('option');
                option.value = unidad.nombre;
                option.textContent = unidad.nombre;
                select.appendChild(option);
            });
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    script.src = `${API_URL}?action=obtenerUnidades&callback=${callback}`;
    document.body.appendChild(script);
}

function cargarTurnos() {
    const script = document.createElement('script');
    const callback = 'callback_' + Math.random().toString(36).substr(2, 9);
    
    window[callback] = function(response) {
        if (response.success) {
            const select = document.getElementById('turno');
            select.innerHTML = '<option value="">Seleccione un turno...</option>';
            
            response.data.forEach(turno => {
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

function registrarAsistencia() {
    const datos = {
        nombres: document.getElementById('nombres').value,
        documento: document.getElementById('documento').value,
        unidad: document.getElementById('unidad').value,
        turno: document.getElementById('turno').value,
        tipoServicio: document.getElementById('tipoServicio').value,
        detalle: document.getElementById('detalle').value,
        usuario: JSON.parse(localStorage.getItem('user')).username
    };

    const script = document.createElement('script');
    const callback = 'callback_' + Math.random().toString(36).substr(2, 9);
    
    window[callback] = function(response) {
        if (response.success) {
            showStatus('Asistencia registrada correctamente', true);
            document.getElementById('registroForm').reset();
        } else {
            showStatus('Error al registrar asistencia: ' + response.message, false);
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    script.src = `${API_URL}?action=registrarAsistenciaManual&datos=${encodeURIComponent(JSON.stringify(datos))}&callback=${callback}`;
    document.body.appendChild(script);
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
