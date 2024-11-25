let editingId = null;
const API_URL = 'https://script.google.com/macros/s/AKfycbxT9Cq9EmOpsPB3jalrVEhnVwAUxl8NS0A27rwO-2V7/dev';

// Definir todas las funciones primero
function showModal(unidad = null) {
    const modal = document.getElementById('unidadModal');
    const form = document.getElementById('unidadForm');
    
    if (unidad) {
        // Modo edición
        editingId = unidad.id;
        document.getElementById('nombreUnidad').value = unidad.nombre;
        // Cargar valores para cada día y turno
        ['1','2','3','4','5','6','7'].forEach(dia => {
            ['D','T','N'].forEach(turno => {
                const id = `${turno}${dia}`;
                document.getElementById(id).value = unidad[id] || 0;
            });
        });
    } else {
        // Modo nuevo
        editingId = null;
        form.reset();
        // Establecer valores por defecto en 0
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = 0;
        });
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('unidadModal').style.display = 'none';
}

function cargarUnidades() {
    mostrarCargando(true);
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        if (response.success) {
            mostrarUnidades(response.data);
        } else {
            mostrarError('Error al cargar unidades: ' + response.message);
        }
        document.body.removeChild(script);
        delete window[callback];
        mostrarCargando(false);
    };
    
    script.src = `${API_URL}?action=obtenerUnidades&callback=${callback}`;
    document.body.appendChild(script);
}

function mostrarUnidades(unidades) {
    const tbody = document.querySelector('#unidadesTable tbody');
    tbody.innerHTML = '';
    
    if (unidades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="23" style="text-align: center; padding: 20px;">
                    No hay unidades registradas
                </td>
            </tr>
        `;
        return;
    }
    
    unidades.forEach(unidad => {
        const tr = document.createElement('tr');
        let html = `<td>${unidad.nombre}</td>`;
        
        // Agregar celdas para cada día y turno
        for (let dia = 1; dia <= 7; dia++) {
            html += `
                <td>${unidad[`D${dia}`] || 0}</td>
                <td>${unidad[`T${dia}`] || 0}</td>
                <td>${unidad[`N${dia}`] || 0}</td>
            `;
        }
        
        html += `
            <td class="action-buttons">
                <button class="btn-edit" data-unidad='${JSON.stringify(unidad)}'>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" data-id="${unidad.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tr.innerHTML = html;
        
        // Agregar event listeners a los botones
        const editBtn = tr.querySelector('.btn-edit');
        const deleteBtn = tr.querySelector('.btn-delete');
        
        editBtn.addEventListener('click', function() {
            editarUnidad(JSON.parse(this.dataset.unidad));
        });
        
        deleteBtn.addEventListener('click', function() {
            eliminarUnidad(this.dataset.id);
        });
        
        tbody.appendChild(tr);
    });
}

function guardarUnidad() {
    try {
        const nombreUnidad = document.getElementById('nombreUnidad').value.trim();
        console.log('Nombre unidad:', nombreUnidad); // Debug
        
        if (!nombreUnidad) {
            mostrarError('El nombre de la unidad es requerido');
            return;
        }

        const unidad = {
            id: editingId,
            nombre: nombreUnidad
        };
        
        // Agregar valores para cada día y turno
        ['1','2','3','4','5','6','7'].forEach(dia => {
            ['D','T','N'].forEach(turno => {
                const id = `${turno}${dia}`;
                const valor = parseInt(document.getElementById(id).value) || 0;
                unidad[id] = valor;
            });
        });

        console.log('Datos a enviar:', unidad); // Debug
        
        mostrarCargando(true);
        const script = document.createElement('script');
        const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
        
        console.log('URL:', `${API_URL}?action=guardarUnidad&datos=${JSON.stringify(unidad)}&callback=${callback}`); // Debug

        window[callback] = function(response) {
            console.log('Respuesta:', response); // Debug
            if (response.success) {
                closeModal();
                cargarUnidades();
                mostrarExito(editingId ? 'Unidad actualizada correctamente' : 'Unidad guardada correctamente');
            } else {
                mostrarError('Error: ' + response.message);
            }
            document.body.removeChild(script);
            delete window[callback];
            mostrarCargando(false);
        };

        const urlParams = new URLSearchParams();
        urlParams.append('action', 'guardarUnidad');
        urlParams.append('datos', JSON.stringify(unidad));
        urlParams.append('callback', callback);

        script.src = `${API_URL}?${urlParams.toString()}`;
        document.body.appendChild(script);

    } catch (error) {
        console.error('Error completo:', error); // Debug
        mostrarError('Error al guardar: ' + error.message);
        mostrarCargando(false);
    }
}

function editarUnidad(unidad) {
    showModal(unidad);
}

function eliminarUnidad(id) {
    if (!confirm('¿Está seguro de eliminar esta unidad? Esta acción no se puede deshacer.')) return;
    
    mostrarCargando(true);
    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        if (response.success) {
            cargarUnidades();
            mostrarExito('Unidad eliminada correctamente');
        } else {
            mostrarError('Error: ' + response.message);
        }
        document.body.removeChild(script);
        delete window[callback];
        mostrarCargando(false);
    };
    
    const params = new URLSearchParams({
        action: 'eliminarUnidad',
        id: id,
        callback: callback
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

function mostrarCargando(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function mostrarExito(mensaje) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

function validarNumero(input) {
    const valor = parseInt(input.value) || 0;
    if (valor < 0) input.value = 0;
}

// Hacer las funciones accesibles globalmente después de definirlas
window.showModal = showModal;
window.closeModal = closeModal;
window.editarUnidad = editarUnidad;
window.eliminarUnidad = eliminarUnidad;

// Agregar los event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Loaded'); // Para debugging
    
    cargarUnidades();
    
    // Event listeners principales
    const btnNuevaUnidad = document.getElementById('btnNuevaUnidad');
    if (btnNuevaUnidad) {
        console.log('Botón encontrado'); // Para debugging
        btnNuevaUnidad.addEventListener('click', function() {
            console.log('Botón clickeado'); // Para debugging
            showModal();
        });
    }

    document.getElementById('btnCancelar')?.addEventListener('click', closeModal);
    
    document.getElementById('unidadForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        guardarUnidad();
    });

    // Establecer valores mínimos en 0 para todos los inputs numéricos
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.min = 0;
        input.value = 0;
        input.addEventListener('change', function() {
            validarNumero(this);
        });
    });
});