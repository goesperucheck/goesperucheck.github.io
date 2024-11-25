document.addEventListener('DOMContentLoaded', function() {
    // Establecer la fecha de hoy por defecto
    document.getElementById('fecha').valueAsDate = new Date();
    
    // Cargar unidades
    cargarUnidades();
});

function cargarUnidades() {
    // Aquí podrías hacer una llamada al servidor para obtener la lista de unidades
    // Por ahora, podemos usar las que ya tenemos en localStorage o hardcoded
    const select = document.getElementById('unidad');
    // ... agregar opciones al select ...
}

function analizarMarcaciones() {
    const fecha = document.getElementById('fecha').value;
    const unidad = document.getElementById('unidad').value;
    const turno = document.getElementById('turno').value;
    
    if (!fecha) {
        alert('Por favor seleccione una fecha');
        return;
    }

    const script = document.createElement('script');
    const callback = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
    
    window[callback] = function(response) {
        if (response.success) {
            mostrarResultados(response.data);
        } else {
            alert('Error: ' + response.message);
        }
        
        document.body.removeChild(script);
        delete window[callback];
    };
    
    const params = new URLSearchParams({
        action: 'analizarMarcaciones',
        fecha: fecha,
        unidad: unidad,
        turno: turno,
        callback: callback
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

function mostrarResultados(data) {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        const porcentaje = (row.realizadas / row.esperadas * 100) || 0;
        
        tr.innerHTML = `
            <td>${row.unidad}</td>
            <td>${getTurnoNombre(row.turno)}</td>
            <td>${row.esperadas}</td>
            <td>${row.realizadas}</td>
            <td>
                <div class="percentage">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="percentage-value">${porcentaje.toFixed(1)}%</span>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function getTurnoNombre(turno) {
    const turnos = {
        'D': 'Día (06:00-11:00)',
        'T': 'Tarde (14:00-16:00)',
        'N': 'Noche (17:00-21:00)'
    };
    return turnos[turno] || turno;
} 