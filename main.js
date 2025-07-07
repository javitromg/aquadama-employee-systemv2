let employees = JSON.parse(localStorage.getItem('aquadama_employees') || '[]');
let employeeCounter = parseInt(localStorage.getItem('aquadama_counter') || '0');
let canvas, ctx, isDrawing = false;

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

function clearSignature() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function getSignatureData() {
  return canvas.toDataURL();
}

function saveEmployee(employee) {
  employee.id = ++employeeCounter;
  employee.fechaRegistro = new Date().toLocaleDateString('es-ES');
  localStorage.setItem('aquadama_counter', employeeCounter.toString());
  employees.push(employee);
  localStorage.setItem('aquadama_employees', JSON.stringify(employees));
}

function loadEmployeeList() {
  const list = document.getElementById('employeeList');
  list.innerHTML = '';

  if (employees.length === 0) {
    list.innerHTML = '<p>No hay empleados registrados.</p>';
    return;
  }

  employees.forEach(emp => {
    const card = document.createElement('div');
    card.className = 'employee-card';
    card.innerHTML = `
      <h3>${emp.nombre.toUpperCase()} (ID: ${emp.id})</h3>
      <button onclick="toggleDetails(${emp.id})" id="toggle-btn-${emp.id}">🔽 Ver Detalles</button>
      <div id="details-${emp.id}" class="hidden">
        <p><strong>DNI:</strong> ${emp.dni}</p>
        <p><strong>Email:</strong> ${emp.email}</p>
        <p><strong>Teléfono:</strong> ${emp.telefono}</p>
        <p><strong>IBAN:</strong> ${emp.iban}</p>
        <div>
          ${emp.fotoDNIDelante ? `<button onclick="downloadFile('${emp.fotoDNIDelante}', 'DNI_Delante_${emp.id}.jpg')">🆔 Descargar DNI Delante</button>` : ''}
          ${emp.fotoDNIDetras ? `<button onclick="downloadFile('${emp.fotoDNIDetras}', 'DNI_Detras_${emp.id}.jpg')">🆔 Descargar DNI Detrás</button>` : ''}
          ${emp.fotoPersonal ? `<button onclick="downloadFile('${emp.fotoPersonal}', 'Foto_${emp.id}.jpg')">📸 Descargar Foto Personal</button>` : ''}
          ${emp.firma ? `<button onclick="downloadFile('${emp.firma}', 'Firma_${emp.id}.png')">✍️ Descargar Firma</button>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function toggleDetails(id) {
  const details = document.getElementById('details-' + id);
  const btn = document.getElementById('toggle-btn-' + id);
  const isHidden = details.classList.contains('hidden');
  details.classList.toggle('hidden');
  btn.textContent = isHidden ? '🔼 Ocultar Detalles' : '🔽 Ver Detalles';
}

function downloadFile(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('employeeForm');
  canvas = document.getElementById('signaturePad');
  if (canvas) {
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    canvas.addEventListener('mousedown', e => {
      isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('mousemove', e => {
      if (!isDrawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    });
    canvas.addEventListener('mouseup', () => {
      isDrawing = false;
    });
    canvas.addEventListener('mouseleave', () => {
      isDrawing = false;
    });
  }

  if (form) {
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
      emp.firma = getSignatureData();

      saveEmployee(emp);
      form.reset();
      clearSignature();
      alert('✅ Empleado registrado correctamente');
      loadEmployeeList();
    });
  }

  loadEmployeeList();
});
