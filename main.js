
// ========== Funciones utilitarias ==========
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

// ========== Mostrar detalles de empleado ==========
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
