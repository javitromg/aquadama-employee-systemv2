// main.js

// Constantes de usuario admin por defecto
const DEFAULT_USER = "javierit";
const DEFAULT_PASS = "Ab915712@";

let canvas, ctx, isDrawing = false;

// Carga admins desde localStorage o crea admin por defecto
let admins = JSON.parse(localStorage.getItem("aquadama_admins") || "{}");
if (!admins[DEFAULT_USER]) {
  admins[DEFAULT_USER] = DEFAULT_PASS;
  localStorage.setItem("aquadama_admins", JSON.stringify(admins));
}

// Detecta la página actual por existencia de elementos
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("employeeForm")) {
    setupEmployeeForm();
  }

  if (document.getElementById("loginForm")) {
    setupLoginForm();
  }

  if (document.querySelector(".sidebar")) {
    setupAdminPanel();
  }
});

// ---------- FUNCIONES FORMULARIO EMPLEADOS (index.html) ----------
function setupEmployeeForm() {
  canvas = document.getElementById("signaturePad");
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

  canvas.addEventListener("mouseup", () => {
    isDrawing = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
  });

  document.getElementById("employeeForm").addEventListener("submit", async e => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const emp = {};
    for (let [key, value] of fd.entries()) {
      emp[key] = value;
    }

    // Función para convertir archivo a base64
    async function toBase64(file) {
      return new Promise((resolve, reject) => {
        if (!file) resolve("");
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    emp.fotoDNIDelante = await toBase64(fd.get("fotoDNIDelante"));
    emp.fotoDNIDetras = await toBase64(fd.get("fotoDNIDetras"));
    emp.fotoPersonal = await toBase64(fd.get("fotoPersonal"));

    // Firma canvas a base64
    emp.firma = canvas.toDataURL();

    // ID y fecha
    let employees = JSON.parse(localStorage.getItem("aquadama_employees") || "[]");
    let employeeCounter = parseInt(localStorage.getItem("aquadama_counter") || "0");
    emp.id = ++employeeCounter;
    emp.fechaRegistro = new Date().toLocaleDateString("es-ES");

    employees.push(emp);
    localStorage.setItem("aquadama_employees", JSON.stringify(employees));
    localStorage.setItem("aquadama_counter", employeeCounter.toString());

    e.target.reset();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    alert("✅ Empleado registrado correctamente");
  });

  document.getElementById("clearSignature").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// ---------- FUNCIONES LOGIN (login.html) ----------
function setupLoginForm() {
  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value.trim();
    if (admins[user] && admins[user] === pass) {
      sessionStorage.setItem("authToken", "authenticated");
      window.location.href = "admin.html";
    } else {
      alert("❌ Usuario o contraseña incorrectos");
    }
  });
}

// ---------- FUNCIONES PANEL ADMIN (admin.html) ----------
function setupAdminPanel() {
  const { jsPDF } = window.jspdf;

  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("authToken");
    location.href = "login.html";
  });

  document.getElementById("nav-empleados").addEventListener("click", () => showPanel("panel-empleados"));
  document.getElementById("nav-usuarios").addEventListener("click", () => showPanel("panel-usuarios"));
  document.getElementById("nav-pass").addEventListener("click", () => showPanel("panel-pass"));

  function showPanel(id) {
    document.querySelectorAll(".main-content section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  function loadEmployeeList() {
    const list = document.getElementById("employeeList");
    list.innerHTML = "";
    const employees = JSON.parse(localStorage.getItem("aquadama_employees") || "[]");
    if (employees.length === 0) {
      list.innerHTML = "<p>No hay empleados registrados.</p>";
      return;
    }
    employees.forEach((emp, index) => {
      const card = document.createElement("div");
      card.className = "employee-card";
      card.innerHTML = `
        <h3>${emp.nombre} ${emp.apellidos} (ID: ${emp.id})</h3>
        <button onclick="toggleDetails(${emp.id})" id="toggle-btn-${emp.id}">🔽 Ver Detalles</button>
        <button onclick="deleteEmployee(${index})">🗑️ Eliminar</button>
        <button onclick="generarPDF(${index})">📄 Generar PDF</button>
        <div id="details-${emp.id}" class="hidden" style="margin-top:10px;">
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

  window.toggleDetails = function(id) {
    const section = document.getElementById("details-" + id);
    const btn = document.getElementById("toggle-btn-" + id);
    const hidden = section.classList.contains("hidden");
    section.classList.toggle("hidden");
    btn.textContent = hidden ? "🔼 Ocultar Detalles" : "🔽 Ver Detalles";
  };

  window.deleteEmployee = function(index) {
    if (confirm("¿Eliminar este empleado?")) {
      const employees = JSON.parse(localStorage.getItem("aquadama_employees") || "[]");
      employees.splice(index, 1);
      localStorage.setItem("aquadama_employees", JSON.stringify(employees));
      loadEmployeeList();
    }
  };

  window.downloadFile = function(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  window.generarPDF = function(index) {
    const employees = JSON.parse(localStorage.getItem("aquadama_employees") || "[]");
    const emp = employees[index];
    const doc = new jsPDF();

    // Diseño profesional
    doc.setFont("helvetica");
    doc.setDrawColor(0);
    doc.setFillColor(230, 240, 255);
    doc.setTextColor(40, 40, 40);

    doc.setFillColor(15, 76, 129);
    doc.rect(0, 0, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HOJA DE DATOS · Trabajadores/as", 105, 14, null, null, "center");

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text("Los datos solicitados son los necesarios e inherentes a la relación laboral y su correcto funcionamiento.", 105, 27, null, null, "center");

    let y = 35;
    const lineHeight = 8;
    const col1X = 20;
    const col2X = 110;

    function fieldTitle(text, x, y) {
      doc.setFont(undefined, "bold");
      doc.text(text, x, y);
    }
    function fieldValue(text, x, y) {
      doc.setFont(undefined, "normal");
      doc.text(text || "-", x, y);
    }

    fieldTitle("Nombre y apellidos:", col1X, y);
    fieldTitle("DNI:", col2X, y);
    y += lineHeight;
    fieldValue(`${emp.nombre} ${emp.apellidos}`, col1X, y);
    fieldValue(emp.dni, col2X, y);
    y += lineHeight;

    fieldTitle("Número Seg. Social:", col1X, y);
    fieldTitle("Nacionalidad:", col2X, y);
    y += lineHeight;
    fieldValue(emp.ss, col1X, y);
    fieldValue(emp.nacionalidad, col2X, y);
    y += lineHeight;

    fieldTitle("Sexo:", col1X, y);
    fieldTitle("Fecha de nacimiento:", col2X, y);
    y += lineHeight;
    fieldValue(emp.sexo || "", col1X, y);
    fieldValue(emp.fechaNacimiento, col2X, y);
    y += lineHeight;

    fieldTitle("Lugar:", col1X, y);
    fieldTitle("Estado civil:", col2X, y);
    y += lineHeight;
    fieldValue(emp.lugarNacimiento || "", col1X, y);
    fieldValue(emp.estadoCivil || "", col2X, y);
    y += lineHeight;

    fieldTitle("Número de hijos:", col1X, y);
    fieldTitle("Teléfono/s:", col2X, y);
    y += lineHeight;
    fieldValue(emp.hijos || "", col1X, y);
    fieldValue(emp.telefono, col2X, y);
    y += lineHeight;

    fieldTitle("Email:", col1X, y);
    fieldTitle("Formación Oficial:", col2X, y);
    y += lineHeight;
    fieldValue(emp.email, col1X, y);
    fieldValue(emp.formacion || "", col2X, y);
    y += lineHeight;

    fieldTitle("Dirección:", col1X, y);
    fieldTitle("Código postal:", col2X, y);
    y += lineHeight;
    fieldValue(emp.direccion, col1X, y);
    fieldValue(emp.cp, col2X, y);
    y += lineHeight;

    fieldTitle("Población:", col1X, y);
    fieldTitle("Provincia:", col2X, y);
    y += lineHeight;
    fieldValue(emp.localidad, col1X, y);
    fieldValue(emp.provincia, col2X, y);
    y += lineHeight + 5;

    doc.setFillColor(230, 240, 255);
    doc.rect(col1X, y, 170, 8, "F");
    doc.setTextColor(15, 76, 129);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Información Bancaria", col1X + 2, y + 6);
    y += 15;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Número de cuenta - IBAN: ${emp.iban}`, col1X, y);
    y += lineHeight;
    doc.setFont(undefined, "italic");
    doc.text("(En España el IBAN consta de 24 posiciones comenzando siempre por ES)", col1X, y);
    y += lineHeight + 5;

    doc.setFillColor(230, 240, 255);
    doc.rect(col1X, y, 170, 8, "F");
    doc.setTextColor(15, 76, 129);
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Contactos de Emergencia (Opcional)", col1X + 2, y + 6);
    y += 15;
    doc.setFont(undefined, "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`Nombre (Persona de contacto): ${emp.emergencia1 || "-"}`, col1X, y);
    y += lineHeight;
    doc.text(`Parentesco: ${emp.parentescoContacto || "-"}`, col1X, y);
    y += lineHeight;
    doc.text(`Teléfono: ${emp.telefonoContacto || "-"}`, col1X, y);
    y += lineHeight + 10;

    doc.setFillColor(230, 240, 255);
    doc.rect(col1X, y, 170, 28, "F");
    doc.setTextColor(15, 76, 129);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Firma y Fecha", col1X + 2, y + 10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`Fecha: ${emp.fechaRegistro}`, col1X + 2, y + 20);

    if(emp.firma){
      const img = new Image();
      img.src = emp.firma;
      img.onload = () => {
        doc.addImage(img, col2X + 10, y + 5, 60, 18);
        addFooter(doc);
        doc.save(`Ficha_Empleado_${emp.id}.pdf`);
      };
    } else {
      addFooter(doc);
      doc.save(`Ficha_Empleado_${emp.id}.pdf`);
    }
  };

  function addFooter(doc) {
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      "*RECUERDE LA IMPORTANCIA DE COMUNICAR CUALQUIER VARIACIÓN Y/O MODIFICACIÓN DE DATOS*",
      105,
      280,
      null,
      null,
      "center"
    );

    doc.setFontSize(6);
    doc.text(
      "Información básica sobre Protección de Datos",
      105,
      285,
      null,
      null,
      "center"
    );
    doc.text(
      "RESPONSABLE: Tratamiento Integral Del Agua Aquadama, S.L.U. | FINALIDAD DEL TRATAMIENTO: Gestión inherente a la relación laboral. | LEGITIMACIÓN: Consentimiento del interesado/a e interés legítimo del Responsable.",
      105,
      290,
      { maxWidth: 180, align: "center" }
    );
    doc.text(
      "DESTINATARIOS: No se cederán datos a terceros, salvo obligación legal o cumplimiento de la normativa que resulte de aplicación.",
      105,
      295,
      { maxWidth: 180, align: "center" }
    );
    doc.text(
      "DERECHOS: Usted podrá solicitar el acceso, rectificación y/o supresión de sus datos, así como otros derechos, como se explica en la información adicional.",
      105,
      300,
      { maxWidth: 180, align: "center" }
    );
    doc.text(
      "Puede consultar la información adicional y detallada sobre Protección de Datos en:",
      105,
      305,
      { maxWidth: 180, align: "center" }
    );
    doc.text(
      "http://aquadama.avisolegal.info/RRHH-DATOS_TRABAJADOR-A/datos_trabajador-a.html",
      105,
      310,
      {
        maxWidth: 180,
        align: "center",
        link: "http://aquadama.avisolegal.info/RRHH-DATOS_TRABAJADOR-A/datos_trabajador-a.html",
      }
    );
    doc.text(
      "DELEGADO PROTECCIÓN DE DATOS: Tratamiento Integral Del Agua Aquadama, S.L.U.",
      105,
      315,
      { maxWidth: 180, align: "center" }
    );
    doc.text(
      "Puede consultar la NORMATIVA VIGENTE DE PROTECCIÓN DE DATOS PERSONALES en:",
      105,
      320,
      { maxWidth: 180, align: "center" }
    );
    doc.text(
      "http://normativa.avisolegal.info",
      105,
      325,
      { maxWidth: 180, align: "center", link: "http://normativa.avisolegal.info" }
    );
  }

  document.getElementById("createAdminForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = document.getElementById("newAdminUser").value.trim();
    const pass = document.getElementById("newAdminPass").value.trim();
    if (!user || !pass) return alert("❗ Rellena usuario y contraseña");
    if (admins[user]) return alert("⚠️ Usuario ya existe");
    admins[user] = pass;
    localStorage.setItem("aquadama_admins", JSON.stringify(admins));
    renderAdminList();
    e.target.reset();
    alert("✅ Administrador creado");
  });

  document.getElementById("changePassForm").addEventListener("submit", e => {
    e.preventDefault();
    const current = document.getElementById("currentPass").value.trim();
    const newpass = document.getElementById("newPass").value.trim();
    const user = Object.keys(admins).find(u => admins[u] === current);
    if (!user) return alert("❌ Contraseña actual incorrecta");
    admins[user] = newpass;
    localStorage.setItem("aquadama_admins", JSON.stringify(admins));
    e.target.reset();
    alert("✅ Contraseña actualizada");
  });

  function renderAdminList() {
    const list = document.getElementById("adminList");
    list.innerHTML = "";
    for (const user in admins) {
      const li = document.createElement("li");
      li.textContent = user;
      if (user !== "javierit") {
        const del = document.createElement("button");
        del.textContent = "❌";
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

  loadEmployeeList();
  renderAdminList();
  showPanel("panel-empleados");
}
