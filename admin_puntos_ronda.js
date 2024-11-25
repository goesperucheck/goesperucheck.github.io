const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

// Variables globales
let qrcode = null;

// Asegurarnos de que el DOM esté cargado
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM cargado, iniciando carga de datos...');
    
    // Cargar unidades al inicio
    await cargarUnidades();
    
    // Cargar puntos de ronda existentes
    cargarPuntosRonda();

    // Configurar el formulario
    document.getElementById('puntosRondaForm').addEventListener('submit', guardarPuntoRonda);

    // Configurar el modal
    const modal = document.getElementById('qrModal');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});

function cargarUnidades() {
    console.log('Iniciando carga de unidades...');
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
        
        window[callback] = function(response) {
            try {
                console.log('Respuesta recibida:', response);
                
                // Verificar que la respuesta sea válida
                if (!response) {
                    throw new Error('Respuesta vacía del servidor');
                }
                
                if (response.success) {
                    const select = document.getElementById('unidad');
                    // Limpiar opciones existentes
                    select.innerHTML = '<option value="">Seleccione una unidad</option>';
                    
                    if (Array.isArray(response.data)) {
                        response.data.forEach(unidad => {
                            const option = document.createElement('option');
                            option.value = unidad;
                            option.textContent = unidad;
                            select.appendChild(option);
                        });
                        console.log('Unidades cargadas exitosamente');
                    } else {
                        console.error('Los datos no son un array:', response.data);
                    }
                } else {
                    console.error('Error en la respuesta:', response.message);
                }
            } catch (error) {
                console.error('Error al procesar la respuesta:', error);
            } finally {
                // Limpieza
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                delete window[callback];
                resolve();
            }
        };
        
        script.onerror = function(error) {
            console.error('Error al cargar el script:', error);
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window[callback];
            reject(error);
        };
        
        script.src = `${API_URL}?action=obtenerUnidadesParaPuntos&callback=${callback}`;
        document.body.appendChild(script);
        
        // Timeout de seguridad
        setTimeout(() => {
            if (window[callback]) {
                console.error('Timeout al esperar respuesta del servidor');
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                delete window[callback];
                reject(new Error('Timeout al esperar respuesta del servidor'));
            }
        }, 10000); // 10 segundos de timeout
    });
}

function cargarPuntosRonda() {
    console.log('Cargando puntos de ronda...');
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        console.log('Respuesta de puntos:', response);
        if (response.success) {
            const tbody = document.getElementById('puntosRondaTableBody');
            tbody.innerHTML = '';
            
            response.data.forEach(punto => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${punto.unidad}</td>
                    <td>${punto.punto}</td>
                    <td>
                        <button class="qr-button" onclick="mostrarQR('${punto.unidad}/${punto.punto}')">
                            <i class="fas fa-qrcode"></i> Ver QR
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    script.src = `${API_URL}?action=obtenerPuntosRonda&callback=${callback}`;
    document.body.appendChild(script);
}

function guardarPuntoRonda(e) {
    e.preventDefault();
    
    const unidad = document.getElementById('unidad').value;
    const puntoRonda = document.getElementById('puntoRonda').value;
    
    if (!unidad || !puntoRonda) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    console.log('Guardando punto de ronda:', { unidad, puntoRonda });
    
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        console.log('Respuesta al guardar:', response);
        if (response.success) {
            alert('Punto de ronda guardado correctamente');
            document.getElementById('puntosRondaForm').reset();
            cargarPuntosRonda();
        } else {
            alert('Error al guardar: ' + response.message);
        }
        document.body.removeChild(script);
        delete window[callback];
    };
    
    script.src = `${API_URL}?action=guardarPuntoRonda&unidad=${encodeURIComponent(unidad)}&punto=${encodeURIComponent(puntoRonda)}&callback=${callback}`;
    document.body.appendChild(script);
}

function mostrarQR(texto) {
    const modal = document.getElementById('qrModal');
    const qrContainer = document.getElementById('qrcode');
    const modalTitle = document.querySelector('.modal-content h3');
    
    // Actualizar el título con el texto del QR
    modalTitle.innerHTML = `
        <i class="fas fa-qrcode"></i>
        ${texto}
    `;
    
    // Limpiar QR anterior si existe
    qrContainer.innerHTML = '';
    
    // Crear nuevo QR
    qrcode = new QRCode(qrContainer, {
        text: texto,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Agregar el texto de desarrollo
    const developerText = document.createElement('div');
    developerText.className = 'developer-text';
    developerText.innerHTML = 'Desarrollado por GOES PERU | SISTEMA DE GESTIÓN';
    qrContainer.parentNode.appendChild(developerText);
    
    modal.style.display = 'flex';
}