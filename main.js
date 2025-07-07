const DEFAULT_USER = "javierit";
const DEFAULT_PASS = "Ab915712@";

let canvas, ctx, isDrawing = false;
let employees = JSON.parse(localStorage.getItem("aquadama_employees") || "[]");
let employeeCounter = parseInt(localStorage.getItem("aquadama_counter") || "0");

// Login
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (user === DEFAULT_USER && pass === DEFAULT_PASS) {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("mainContainer").classList.remove("hidden");
    loadEmployeeList();
  } else {
    alert("❌ Usuario o contraseña incorrectos");
  }
});

// Firma
function clearSignature() {
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getSignatureData() {
  return canvas.toDataURL();
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Guardar empleado
function saveEmployee(employee) {
  employee.id = ++employeeCounter;
  employee.fechaRegistro = new Date().toLocaleDateString("es-ES");
  employees.push(employee);
  localStorage.setItem("aquadama_employees", JSON.stringify(employees));
  localStorage.setItem("aquadama_counter", employeeCounter.toString());
}

// Mostrar lista de empleados
function loadEmployeeList() {
  const list = document.getElementById("employeeList");
  list.innerHTML = "";

  if (employees.length === 0) {
    list.innerHTML = "<p>No hay empleados registrados.</p>";
    return;
  }

  employees.forEach(emp => {
    const card = document.createElement("div");
    card.className = "employee-card";
    card.innerHTML = `
      <h3>${emp.nombre} ${emp.apellidos} (ID: ${emp.id})</h3>
      <button onclick="toggleDetails(${emp.id})" id="toggle-btn-${emp.id}">🔽 Ver Detalles</button>
      <div id="details-${emp.id}" class="hidden">
        <p><strong>DNI:</strong> ${emp.dni}</p>
        <p><strong>Fecha Nacimiento:</strong> ${emp.fechaNacimiento}</p>
        <p><strong>Nacionalidad:</strong> ${emp.nacionalidad}</p>
        <p><strong>Email:</strong> ${emp.email}</p>
        <p><strong>Teléfono:</strong> ${emp.telefono}</p>
        <p><strong>Dirección:</strong> ${emp.direccion}, ${emp.localidad}, ${emp.provincia} (${emp.cp})</p>
        <p><strong>Centro:</strong> ${emp.centro || '-'}</p>
        <p><strong>IBAN:</strong> ${emp.iban}</p>
        <p><strong>SS:</strong> ${emp.ss}</p>
        <div style="margin-top:10px;">
          ${emp.fotoDNIDelante ? `<button onclick="downloadFile('${emp.fotoDNIDelante}', 'DNI_Delante_${emp.id}.jpg')">🆔 DNI Delante</button>` : ''}
          ${emp.fotoDNIDetras ? `<button onclick="downloadFile('${emp.fotoDNIDetras}', 'DNI_Detras_${emp.id}.jpg')">🆔 DNI Detrás</button>` : ''}
          ${emp.fotoPersonal ? `<button onclick="downloadFile('${emp.fotoPersonal}', 'Foto_${emp.id}.jpg')">📸 Foto</button>` : ''}
          ${emp.firma ? `<button onclick="downloadFile('${emp.firma}', 'Firma_${emp.id}.png')">✍️ Firma</button>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function toggleDetails(id) {
  const section = document.getElementById("details-" + id);
  const btn = document.getElementById("toggle-btn-" + id);
  const hidden = section.classList.contains("hidden");
  section.classList.toggle("hidden");
  btn.textContent = hidden ? "🔼 Ocultar Detalles" : "🔽 Ver Detalles";
}

function downloadFile(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Formulario
document.getElementById("employeeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const emp = {};

  for (let [key, value] of fd.entries()) {
    emp[key] = value;
  }

  emp.fotoDNIDelante = await toBase64(fd.get("fotoDNIDelante"));
  emp.fotoDNIDetras = await toBase64(fd.get("fotoDNIDetras"));
  emp.fotoPersonal = await toBase64(fd.get("fotoPersonal"));
  emp.firma = getSignatureData();

  saveEmployee(emp);
  e.target.reset();
  clearSignature();
  alert("✅ Empleado registrado correctamente");
  loadEmployeeList();
});

// Canvas init
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("signaturePad");
  if (canvas) {
    ctx = canvas.getContext("2d");
    canvas.addEventListener("mousedown", e => {
      isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener("mousemove", e => {
      if (!isDrawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    });
    canvas.addEventListener("mouseup", () => isDrawing = false);
    canvas.addEventListener("mouseleave", () => isDrawing = false);
  }
});
