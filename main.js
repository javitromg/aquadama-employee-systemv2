const DEFAULT_USER = "javierit";
const DEFAULT_PASS = "Ab915712@";

let canvas, ctx, isDrawing = false;
let employees = JSON.parse(localStorage.getItem("aquadama_employees") || "[]");
let employeeCounter = parseInt(localStorage.getItem("aquadama_counter") || "0");
let admins = JSON.parse(localStorage.getItem("aquadama_admins") || "{}");
if (!admins[DEFAULT_USER]) {
  admins[DEFAULT_USER] = DEFAULT_PASS;
  localStorage.setItem("aquadama_admins", JSON.stringify(admins));
}

// ==== LOGIN ====
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (admins[user] && admins[user] === pass) {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("mainContainer").classList.remove("hidden");
    renderAdminList();
    loadEmployeeList();
  } else {
    alert("❌ Usuario o contraseña incorrectos");
  }
});

// ==== FIRMA DIGITAL ====
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

// ==== GUARDAR EMPLEADO ====
function saveEmployee(employee) {
  employee.id = ++employeeCounter;
  employee.fechaRegistro = new Date().toLocaleDateString("es-ES");
  employees.push(employee);
  localStorage.setItem("aquadama_employees", JSON.stringify(employees));
  localStorage.setItem("aquadama_counter", employeeCounter.toString());
}

// ==== MOSTRAR EMPLEADOS ====
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

// ==== FORMULARIO DE EMPLEADO ====
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
});

// ==== CANVAS INICIAL ====
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

// ==== GESTIÓN DE ADMINISTRADORES ====
document.getElementById("createAdminForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("newAdminUser").value.trim();
  const pass = document.getElementById("newAdminPass").value.trim();

  if (!user || !pass) return alert("❗ Rellena usuario y contraseña");
  if (admins[user]) return alert("⚠️ Usuario ya existe");

  admins[user] = pass;
  localStorage.setItem("aquadama_admins", JSON.stringify(admins));
  document.getElementById("createAdminForm").reset();
  renderAdminList();
  alert("✅ Administrador creado");
});

function renderAdminList() {
  const list = document.getElementById("adminList");
  list.innerHTML = "";
  for (let user in admins) {
    const li = document.createElement("li");
    li.textContent = user;
    if (user !== DEFAULT_USER) {
      const del = document.createElement("button");
      del.textContent = "❌";
      del.style.marginLeft = "10px";
      del.onclick = () => {
        if (confirm(`¿Eliminar al admin '${user}'?`)) {
          delete admins[user];
          localStorage.setItem("aquadama_admins", JSON.stringify(admins));
          renderAdminList();
        }
      };
      li.appendChild(del);
    }
    list.appendChild(li);
  }
}

document.getElementById("changePassForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const current = document.getElementById("currentPass").value.trim();
  const newpass = document.getElementById("newPass").value.trim();

  const username = Object.keys(admins).find(
    user => admins[user] === current
  );

  if (!username) {
    alert("❌ Contraseña actual incorrecta");
    return;
  }

  admins[username] = newpass;
  localStorage.setItem("aquadama_admins", JSON.stringify(admins));
  document.getElementById("changePassForm").reset();
  alert("✅ Contraseña actualizada correctamente");
});

renderAdminList();
