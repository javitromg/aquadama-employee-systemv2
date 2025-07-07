
// ========== Variables globales ==========
let employees = JSON.parse(localStorage.getItem('aquadama_employees') || '[]');
let employeeCounter = parseInt(localStorage.getItem('aquadama_counter') || '0');

// ========== Utilidades ==========
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

function saveEmployee(employee) {
    employee.id = ++employeeCounter;
    employee.fechaRegistro = new Date().toLocaleDateString('es-ES');
    employees.push(employee);
    localStorage.setItem('aquadama_employees', JSON.stringify(employees));
    localStorage.setItem('aquadama_counter', employeeCounter.toString());
}

function downloadImage(dataUrl, fileName) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ========== Mostrar empleados ==========
function loadEmployeeList() {
    const list = document.getElementById('employeeList');
    if (!list) return;
    list.innerHTML = '';

    if (employees.length === 0) {
        list.innerHTML = '<p>No hay empleados registrados</p>';
        return;
    }

    employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>${emp.nombre || 'Sin nombre'} (ID: ${emp.id})</h3>
                <button onclick="toggleEmployeeDetails(${emp.id})" id="toggle-btn-${emp.id}">🔽 Ver Detalles</button>
            </div>
            <div id="employee-details-${emp.id}" class="hidden">
                <p><strong>DNI:</strong> ${emp.dni}</p>
                <p><strong>Email:</strong> ${emp.email}</p>
                <p><strong>Teléfono:</strong> ${emp.telefono}</p>
                <p><strong>IBAN:</strong> ${emp.iban}</p>
                <div>
                    ${emp.fotoDNIDelante ? `<button onclick="downloadImage('${emp.fotoDNIDelante}', 'DNI_Delante_${emp.id}.jpg')">🆔 Descargar DNI Delante</button>` : ''}
                    ${emp.fotoDNIDetras ? `<button onclick="downloadImage('${emp.fotoDNIDetras}', 'DNI_Detras_${emp.id}.jpg')">🆔 Descargar DNI Detrás</button>` : ''}
                    ${emp.fotoPersonal ? `<button onclick="downloadImage('${emp.fotoPersonal}', 'Foto_${emp.id}.jpg')">📸 Descargar Foto</button>` : ''}
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function toggleEmployeeDetails(id) {
    const section = document.getElementById('employee-details-' + id);
    const btn = document.getElementById('toggle-btn-' + id);
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        btn.textContent = '🔼 Ocultar Detalles';
    } else {
        section.classList.add('hidden');
        btn.textContent = '🔽 Ver Detalles';
    }
}

// ========== Manejo del formulario ==========
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('employeeForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const emp = {};
        for (let [key, value] of fd.entries()) {
            emp[key] = value;
        }

        emp.fotoDNIDelante = await toBase64(fd.get('fotoDNIDelante'));
        emp.fotoDNIDetras = await toBase64(fd.get('fotoDNIDetras'));
        emp.fotoPersonal = await toBase64(fd.get('fotoPersonal'));

        saveEmployee(emp);
        form.reset();
        alert('Empleado registrado correctamente.');
        loadEmployeeList();
    });

    loadEmployeeList();
});
