/* ========================================
   APP.JS - LÓGICA PRINCIPAL DE LA SPA
   Inicializador, eventos y navegación
   ======================================== */

// VARIABLES GLOBALES DE ESTADO
let editIndex = undefined; // Para distinguir crear vs actualizar
let medicamentosActuales = []; // Almacén temporal de medicamentos

/* ========================================
   INICIALIZACIÓN Y CONFIGURACIÓN
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Aplicación CVF iniciada');

    // Inicializar componentes
    inicializarFecha();
    inicializarNavegacion();
    inicializarFormulario();
    inicializarDropzone();
    inicializarHistorial();
    inicializarCalculoEdad();
    inicializarTablaMedicamentos();
    inicializarEnfermedadSwitch();

    // Cargar historial inicial
    actualizarHistorial();
});

/* ========================================
   FECHA ACTUAL EN HEADER
   ======================================== */

function inicializarFecha() {
    const actualizarFecha = () => {
        const ahora = new Date();
        const opciones = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('fecha-actual').textContent = ahora.toLocaleDateString('es-BO', opciones);
    };

    actualizarFecha();
    setInterval(actualizarFecha, 60000); // Actualizar cada minuto
}

/* ========================================
   NAVEGACIÓN SPA (Cambio de pestañas)
   ======================================== */

function inicializarNavegacion() {
    const btnNuevoRegistro = document.getElementById('btn-nuevo-registro');
    const btnHistorial = document.getElementById('btn-historial');
    const tabNuevoRegistro = document.getElementById('tab-nuevo-registro');
    const tabHistorial = document.getElementById('tab-historial');
    const pageTitle = document.getElementById('page-title');

    btnNuevoRegistro.addEventListener('click', () => {
        // Cambiar pestañas
        tabNuevoRegistro.classList.add('active');
        tabHistorial.classList.remove('active');

        // Cambiar botones
        btnNuevoRegistro.classList.add('active');
        btnHistorial.classList.remove('active');

        // Cambiar título
        pageTitle.textContent = 'Nuevo Registro';

        // Limpiar formulario si es nuevo
        if (editIndex === undefined) {
            limpiarFormulario();
        }
    });

    btnHistorial.addEventListener('click', () => {
        // Cambiar pestañas
        tabHistorial.classList.add('active');
        tabNuevoRegistro.classList.remove('active');

        // Cambiar botones
        btnHistorial.classList.add('active');
        btnNuevoRegistro.classList.remove('active');

        // Cambiar título
        pageTitle.textContent = 'Historial Activo';

        // Actualizar historial
        actualizarHistorial();
    });
}

/* ========================================
   FORMULARIO - EVENTOS PRINCIPALES
   ======================================== */

function inicializarFormulario() {
    const form = document.getElementById('form-residente');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');

    // Guardar registro
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarResidente();
    });

    // Limpiar formulario
    btnLimpiar.addEventListener('click', () => {
        if (confirm('¿Limpiar el formulario?')) {
            limpiarFormulario();
            editIndex = undefined;
        }
    });

    // Exportar PDF (todos los registros)
    btnExportarPDF.addEventListener('click', () => {
        const residentes = db.obtenerTodos();
        if (residentes.length === 0) {
            alert('⚠️ No hay residentes para exportar');
            return;
        }
        pdfGen.generarReporteMasivo(residentes);
        mostrarMensaje('✅ PDF generado correctamente', 'success');
    });
}

/* ========================================
   GUARDAR RESIDENTE (CREATE / UPDATE)
   ======================================== */

function guardarResidente() {
    try {
        // Recopilar datos del formulario
        const datosResidente = {
            nombre: document.getElementById('nombre').value.trim(),
            ci: document.getElementById('ci').value.trim(),
            extension: document.getElementById('extension').value,
            fechaNacimiento: document.getElementById('fecha-nacimiento').value,
            edad: db.calcularEdad(document.getElementById('fecha-nacimiento').value),
            genero: document.querySelector('input[name="genero"]:checked').value,

            telefonoPropio: document.getElementById('telefono-propio').value.trim(),
            nombreContacto: document.getElementById('nombre-contacto').value.trim(),
            telefonoFamiliar: document.getElementById('telefono-familiar').value.trim(),

            origen: document.getElementById('origen').value,
            vivienda: document.getElementById('vivienda').value,
            barrio: document.getElementById('barrio').value.trim(),
            calle: document.getElementById('calle').value.trim(),
            numero: document.getElementById('numero').value.trim(),

            tiempoAsistencia: parseInt(document.getElementById('tiempo-asistencia').value) || 0,
            tieneEnfermedad: document.getElementById('tiene-enfermedad').checked,
            especificarEnfermedad: document.getElementById('especificar-enfermedad').value.trim(),
            seguroSalud: document.getElementById('seguro-salud').value,

            medicamentos: medicamentosActuales,
            observaciones: document.getElementById('observaciones').value.trim(),
            fotoBase64: document.getElementById('foto-base64').value
        };

        // Guardar en BD
        const resultado = db.guardar(datosResidente, editIndex);

        if (resultado.success) {
            mostrarMensaje(resultado.mensaje, 'success');

            // Limpiar y resetear
            limpiarFormulario();
            medicamentosActuales = [];
            editIndex = undefined;
            actualizarTablaMedicamentos();

            // Ir a historial
            setTimeout(() => {
                document.getElementById('btn-historial').click();
            }, 500);
        } else {
            mostrarMensaje(resultado.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarMensaje('❌ Error al guardar el registro', 'error');
    }
}

/* ========================================
   DROPZONE DE FOTOGRAFÍA
   ======================================== */

function inicializarDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fotoInput = document.getElementById('foto-input');
    const fotoPreview = document.getElementById('foto-preview');
    const fotoBase64 = document.getElementById('foto-base64');

    // Click en dropzone
    dropzone.addEventListener('click', () => fotoInput.click());

    // Drag over
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    // Drag leave
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    // Drop
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            procesarFoto(files[0]);
        }
    });

    // File input change
    fotoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            procesarFoto(e.target.files[0]);
        }
    });

    // Procesar fotografía
    function procesarFoto(file) {
        if (!file.type.startsWith('image/')) {
            alert('⚠️ Selecciona un archivo de imagen');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ La imagen no debe superar 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            fotoBase64.value = base64;

            // Mostrar preview
            fotoPreview.innerHTML = `<img src="${base64}" alt="Foto perfil">`;
            mostrarMensaje('✅ Foto cargada correctamente', 'success');
        };
        reader.readAsDataURL(file);
    }
}

/* ========================================
   CÁLCULO AUTOMÁTICO DE EDAD
   ======================================== */

function inicializarCalculoEdad() {
    const fechaNacimiento = document.getElementById('fecha-nacimiento');
    const edadInput = document.getElementById('edad');

    fechaNacimiento.addEventListener('change', () => {
        const edad = db.calcularEdad(fechaNacimiento.value);
        edadInput.value = edad;
    });
}

/* ========================================
   SWITCH DE ENFERMEDAD
   ======================================== */

function inicializarEnfermedadSwitch() {
    const tieneEnfermedad = document.getElementById('tiene-enfermedad');
    const especificarEnfermedad = document.getElementById('especificar-enfermedad');
    const labelEnfermedad = document.getElementById('label-enfermedad');

    tieneEnfermedad.addEventListener('change', () => {
        if (tieneEnfermedad.checked) {
            especificarEnfermedad.disabled = false;
            labelEnfermedad.textContent = 'Sí';
        } else {
            especificarEnfermedad.disabled = true;
            especificarEnfermedad.value = '';
            labelEnfermedad.textContent = 'No';
        }
    });
}

/* ========================================
   TABLA DE MEDICAMENTOS
   ======================================== */

function inicializarTablaMedicamentos() {
    const btnAgregarMedicamento = document.getElementById('btn-agregar-medicamento');
    btnAgregarMedicamento.addEventListener('click', () => {
        if (medicamentosActuales.length < 3) {
            medicamentosActuales.push({
                medicamento: '',
                dosis: '',
                horario: ''
            });
            actualizarTablaMedicamentos();
        } else {
            alert('⚠️ Máximo 3 medicamentos');
        }
    });
}

function actualizarTablaMedicamentos() {
    const tbody = document.getElementById('medicamentos-tbody');
    tbody.innerHTML = '';

    medicamentosActuales.forEach((med, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.5rem; border: 1px solid #334155;">
                <input type="text" value="${med.medicamento}" placeholder="Ej: Aspirina" 
                    style="width: 100%; padding: 0.5rem; background-color: #0f172a; border: 1px solid #475569; border-radius: 0.375rem; color: #e2e8f0; font-size: 0.875rem;"
                    onchange="medicamentosActuales[${idx}].medicamento = this.value">
            </td>
            <td style="padding: 0.5rem; border: 1px solid #334155;">
                <input type="text" value="${med.dosis}" placeholder="Ej: 500mg" 
                    style="width: 100%; padding: 0.5rem; background-color: #0f172a; border: 1px solid #475569; border-radius: 0.375rem; color: #e2e8f0; font-size: 0.875rem;"
                    onchange="medicamentosActuales[${idx}].dosis = this.value">
            </td>
            <td style="padding: 0.5rem; border: 1px solid #334155;">
                <input type="time" value="${med.horario}" 
                    style="width: 100%; padding: 0.5rem; background-color: #0f172a; border: 1px solid #475569; border-radius: 0.375rem; color: #e2e8f0; font-size: 0.875rem;"
                    onchange="medicamentosActuales[${idx}].horario = this.value">
            </td>
            <td style="padding: 0.5rem; border: 1px solid #334155; text-align: center;">
                <button type="button" class="btn-eliminar" onclick="eliminarMedicamento(${idx})" style="padding: 0.4rem 0.8rem; background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
                    🗑️ Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarMedicamento(idx) {
    medicamentosActuales.splice(idx, 1);
    actualizarTablaMedicamentos();
}

/* ========================================
   HISTORIAL ACTIVO
   ======================================== */

function inicializarHistorial() {
    const buscador = document.getElementById('buscador-historial');
    buscador.addEventListener('input', () => {
        actualizarHistorial();
    });
}

function actualizarHistorial() {
    const buscador = document.getElementById('buscador-historial').value;
    let residentes = db.buscar(buscador);
    const tbody = document.getElementById('historial-tbody');
    const sinRegistros = document.getElementById('sin-registros');

    tbody.innerHTML = '';

    if (residentes.length === 0) {
        sinRegistros.style.display = 'block';
        return;
    }

    sinRegistros.style.display = 'none';

    residentes.forEach((residente, idx) => {
        const edad = db.calcularEdad(residente.fechaNacimiento);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155;">${residente.nombre}</td>
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155;">${residente.ci} - ${residente.extension}</td>
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155;">${edad}</td>
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155;">${residente.genero === 'M' ? 'M' : 'F'}</td>
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155;">${residente.telefonoPropio || '---'}</td>
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155;">${residente.seguroSalud || '---'}</td>
            <td style="padding: 0.75rem 1rem; border: 1px solid #334155; text-align: center;">
                <button class="btn-editar" onclick="editarResidente(${idx})" style="padding: 0.4rem 0.8rem; background: #0ea5e9; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem; font-weight: 600; margin-right: 0.3rem;">
                    ✏️ Editar
                </button>
                <button class="btn-eliminar" onclick="eliminarResidente(${idx})" style="padding: 0.4rem 0.8rem; background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem; font-weight: 600; margin-right: 0.3rem;">
                    🗑️ Eliminar
                </button>
                <button class="btn-pdf" onclick="descargarFichaPDF(${idx})" style="padding: 0.4rem 0.8rem; background: #10b981; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
                    📄 PDF
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ========================================
   EDITAR RESIDENTE
   ======================================== */

function editarResidente(idx) {
    const residente = db.obtenerPorIndice(idx);
    if (!residente) {
        alert('❌ Residente no encontrado');
        return;
    }

    editIndex = idx;
    medicamentosActuales = residente.medicamentos || [];

    // Rellenar formulario
    document.getElementById('nombre').value = residente.nombre;
    document.getElementById('ci').value = residente.ci;
    document.getElementById('extension').value = residente.extension;
    document.getElementById('fecha-nacimiento').value = residente.fechaNacimiento;
    document.getElementById('edad').value = db.calcularEdad(residente.fechaNacimiento);
    document.querySelector(`input[name="genero"][value="${residente.genero}"]`).checked = true;

    document.getElementById('telefono-propio').value = residente.telefonoPropio || '';
    document.getElementById('nombre-contacto').value = residente.nombreContacto || '';
    document.getElementById('telefono-familiar').value = residente.telefonoFamiliar || '';

    document.getElementById('origen').value = residente.origen;
    document.getElementById('vivienda').value = residente.vivienda;
    document.getElementById('barrio').value = residente.barrio || '';
    document.getElementById('calle').value = residente.calle || '';
    document.getElementById('numero').value = residente.numero || '';

    document.getElementById('tiempo-asistencia').value = residente.tiempoAsistencia || 0;
    document.getElementById('tiene-enfermedad').checked = residente.tieneEnfermedad;
    document.getElementById('especificar-enfermedad').value = residente.especificarEnfermedad || '';
    document.getElementById('especificar-enfermedad').disabled = !residente.tieneEnfermedad;
    document.getElementById('label-enfermedad').textContent = residente.tieneEnfermedad ? 'Sí' : 'No';
    document.getElementById('seguro-salud').value = residente.seguroSalud || '';

    // Foto
    if (residente.fotoBase64) {
        document.getElementById('foto-base64').value = residente.fotoBase64;
        document.getElementById('foto-preview').innerHTML = `<img src="${residente.fotoBase64}" alt="Foto perfil">`;
    }

    document.getElementById('observaciones').value = residente.observaciones || '';

    // Actualizar tabla medicamentos
    actualizarTablaMedicamentos();

    // Ir a formulario
    document.getElementById('btn-nuevo-registro').click();

    // Cambiar título
    document.getElementById('page-title').textContent = `Editar: ${residente.nombre}`;

    mostrarMensaje(`✏️ Editando a ${residente.nombre}`, 'success');
}

/* ========================================
   ELIMINAR RESIDENTE
   ======================================== */

function eliminarResidente(idx) {
    const residente = db.obtenerPorIndice(idx);
    if (!residente) {
        alert('❌ Residente no encontrado');
        return;
    }

    if (confirm(`⚠️ ¿Eliminar a ${residente.nombre}? Esta acción no se puede deshacer.`)) {
        const resultado = db.eliminar(idx);
        if (resultado.success) {
            mostrarMensaje(resultado.mensaje, 'success');
            actualizarHistorial();
        } else {
            mostrarMensaje(resultado.mensaje, 'error');
        }
    }
}

/* ========================================
   DESCARGAR PDF INDIVIDUAL
   ======================================== */

function descargarFichaPDF(idx) {
    const residente = db.obtenerPorIndice(idx);
    if (!residente) {
        alert('❌ Residente no encontrado');
        return;
    }

    pdfGen.generarFichIndividual(residente, residente.fotoBase64);
    mostrarMensaje(`✅ PDF de ${residente.nombre} generado`, 'success');
}

/* ========================================
   LIMPIAR FORMULARIO
   ======================================== */

function limpiarFormulario() {
    const form = document.getElementById('form-residente');
    form.reset();

    // Limpiar campos especiales
    document.getElementById('edad').value = '';
    document.getElementById('foto-base64').value = '';
    document.getElementById('foto-preview').innerHTML = '<p class="text-slate-500 text-center">Sin imagen</p>';
    document.getElementById('especificar-enfermedad').disabled = true;
    document.getElementById('label-enfermedad').textContent = 'No';

    medicamentosActuales = [];
    actualizarTablaMedicamentos();

    editIndex = undefined;
    document.getElementById('page-title').textContent = 'Nuevo Registro';
}

/* ========================================
   MENSAJES DE FEEDBACK
   ======================================== */

function mostrarMensaje(texto, tipo = 'info') {
    const contentArea = document.getElementById('content-area');
    const mensaje = document.createElement('div');
    mensaje.className = `${tipo}-message`;
    mensaje.textContent = texto;
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        z-index: 9999;
        animation: slideDown 0.3s ease-out;
    `;

    document.body.appendChild(mensaje);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        mensaje.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => mensaje.remove(), 300);
    }, 5000);
}

/* ========================================
   UTILIDADES Y FUNCIONES HELPER
   ======================================== */

/**
 * Exportar datos a JSON para backup
 */
function exportarBackup() {
    const json = db.exportarJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CVF_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensaje('✅ Backup generado correctamente', 'success');
}

/**
 * Importar datos desde JSON
 */
function importarBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const resultado = db.importarJSON(e.target.result, true);
            mostrarMensaje(resultado.mensaje, resultado.success ? 'success' : 'error');
            if (resultado.success) {
                actualizarHistorial();
            }
        } catch (error) {
            mostrarMensaje('❌ Error al importar: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * Generar reporte de estadísticas
 */
function generarReporteStats() {
    pdfGen.generarReporteEstadisticas();
    mostrarMensaje('✅ Reporte de estadísticas generado', 'success');
}

/**
 * Mostrar reporte en consola
 */
function mostrarReporteConsola() {
    const reporte = db.generarReporte();
    console.log(reporte);
    alert('Reporte generado en consola (F12)');
}

/**
 * Obtener información de almacenamiento
 */
function mostrarInfoAlmacenamiento() {
    const info = db.obtenerTamanoAlmacenamiento();
    const mensaje = `
📊 Información de Almacenamiento:
- Usado: ${info.usadoMB} MB
- Porcentaje: ${info.porcentaje}%
- Registros: ${db.obtenerTodos().length}
    `.trim();
    alert(mensaje);
}

/* ========================================
   ATAJOS DE TECLADO (Opcional)
   ======================================== */

document.addEventListener('keydown', (e) => {
    // Ctrl+S para guardar
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (document.getElementById('tab-nuevo-registro').classList.contains('active')) {
            document.getElementById('form-residente').dispatchEvent(new Event('submit'));
        }
    }

    // Ctrl+N para nuevo registro
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('btn-nuevo-registro').click();
    }

    // Ctrl+H para historial
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        document.getElementById('btn-historial').click();
    }
});

/* ========================================
   LOGS DE DEPURACIÓN
   ======================================== */

console.log('🚀 Sistema CVF cargado');
console.log('📦 Base de datos disponible:', typeof db !== 'undefined');
console.log('📄 Generador de PDF disponible:', typeof pdfGen !== 'undefined');
console.log('🔑 Estado global editIndex:', editIndex);
