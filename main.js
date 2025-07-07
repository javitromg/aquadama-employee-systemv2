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

document.getElementById("employeeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const emp = {};
  for (let [key, value] of fd.entries()) emp[key] = value;
  emp.fotoDNIDelante = await toBase64(fd.get("fotoDNIDelante"));
  emp.fotoDNIDetras = await toBase64(fd.get("fotoDNIDetras"));
  emp.fotoPersonal = await toBase64(fd.get("fotoPersonal"));
  emp.firma = getSignatureData();
  emp.id = ++employeeCounter;
  emp.fechaRegistro = new Date().toLocaleDateString("es-ES");

  employees.push(emp);
  localStorage.setItem("aquadama_employees", JSON.stringify(employees));
  localStorage.setItem("aquadama_counter", employeeCounter.toString());
  e.target.reset();
  clearSignature();
  alert("✅ Empleado registrado correctamente");
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  if (admins[user] && admins[user] === pass) {
    window.location.href = "admin.html";
  } else {
    alert("❌ Usuario o contraseña incorrectos");
  }
});

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
