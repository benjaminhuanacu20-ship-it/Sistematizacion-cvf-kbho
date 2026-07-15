/* ========================================
   PDFGENERATOR.JS - GENERADOR DE PDF
   Exporta fichas de residentes con foto
   ======================================== */

class PDFGenerator {
    constructor() {
        this.nombreInstitucion = 'Centro de Ancianos Vida Feliz';
        this.gestion = '2026';
        this.logoBase64 = this.generarLogoBase64();
    }

    /**
     * Genera un logo simple en Base64 (SVG como PNG)
     * @returns {String} Data URL Base64
     */
    generarLogoBase64() {
        // SVG simple con el escudo del centro
        const svgString = `
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#grad)" rx="10"/>
                <circle cx="50" cy="30" r="15" fill="white" opacity="0.8"/>
                <path d="M 35 50 L 50 60 L 65 50 Z" fill="white" opacity="0.8"/>
                <text x="50" y="85" font-size="10" text-anchor="middle" fill="white" font-weight="bold">CVF</text>
            </svg>
        `;

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);

        return canvas.toDataURL('image/png');
    }

    /**
     * Genera un PDF individual de un residente
     * @param {Object} residente - Objeto residente
     * @param {String} fotoBase64 - Foto en Base64 (opcional)
     * @returns {void} Descarga el PDF
     */
    generarFichIndividual(residente, fotoBase64 = null) {
        const htmlContent = this.construirHTMLFicha(residente, fotoBase64);
        const nombreArchivo = `Ficha_${residente.nombre.replace(/\s+/g, '_')}_${residente.ci}.pdf`;

        const opt = {
            margin: 10,
            filename: nombreArchivo,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(htmlContent).save();
    }

    /**
     * Genera PDF con múltiples residentes (reporte masivo)
     * @param {Array} residentes - Array de residentes
     * @returns {void} Descarga el PDF
     */
    generarReporteMasivo(residentes) {
        if (residentes.length === 0) {
            alert('⚠️ No hay residentes para exportar');
            return;
        }

        let htmlContent = this.construirHTMLEncabezado();

        residentes.forEach((residente, index) => {
            htmlContent += this.construirHTMLFicha(residente, null, true);
            if (index < residentes.length - 1) {
                htmlContent += '<div class="page-break"></div>';
            }
        });

        const nombreArchivo = `Reporte_Residentes_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: 10,
            filename: nombreArchivo,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(htmlContent).save();
    }

    /**
     * Construye el HTML de la ficha individual
     * @param {Object} residente - Objeto residente
     * @param {String} fotoBase64 - Foto en Base64
     * @param {Boolean} incluirLogo - Si incluye logo/encabezado
     * @returns {String} HTML de la ficha
     */
    construirHTMLFicha(residente, fotoBase64 = null, incluirLogo = true) {
        const edad = db.calcularEdad(residente.fechaNacimiento);
        const fechaNac = this.formatearFecha(residente.fechaNacimiento);
        const fechaRegistro = this.formatearFecha(residente.fechaCreacion);

        let html = '';

        if (incluirLogo) {
            html += `
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                    <h1 style="color: #10b981; margin: 5px 0; font-size: 24px; font-weight: bold;">
                        ${this.nombreInstitucion}
                    </h1>
                    <p style="color: #475569; margin: 3px 0; font-size: 12px;">
                        Gestión ${this.gestion}
                    </p>
                    <p style="color: #475569; margin: 3px 0; font-size: 11px;">
                        Ficha de Información de Residente
                    </p>
                </div>
            `;
        }

        html += `
            <div style="border: 1px solid #e2e8f0; padding: 15px; background-color: #f8fafc;">
                <!-- SECCIÓN SUPERIOR: FOTO Y DATOS BÁSICOS -->
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <!-- Foto de Perfil -->
                    <div style="flex: 0 0 120px;">
                        ${fotoBase64 ? 
                            `<img src="${fotoBase64}" style="width: 120px; height: 160px; object-fit: cover; border: 2px solid #10b981; border-radius: 4px;">` 
                            : 
                            `<div style="width: 120px; height: 160px; border: 2px solid #cbd5e1; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; text-align: center;">Sin Foto</div>`
                        }
                    </div>

                    <!-- Datos Básicos -->
                    <div style="flex: 1;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <tr style="background-color: #10b981; color: white;">
                                <td style="padding: 6px; font-weight: bold; width: 35%;">Campo</td>
                                <td style="padding: 6px; font-weight: bold;">Valor</td>
                            </tr>
                            <tr style="background-color: #f1f5f9;">
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">Nombre Completo</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">${residente.nombre}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">C.I.</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.ci} - ${residente.extension}</td>
                            </tr>
                            <tr style="background-color: #f1f5f9;">
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">Edad</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">${edad} años</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">Género</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.genero === 'M' ? 'Masculino' : 'Femenino'}</td>
                            </tr>
                            <tr style="background-color: #f1f5f9;">
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">F. Nacimiento</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">${fechaNac}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- SECCIÓN: REFERENCIAS DE CONTACTO -->
                <div style="margin-bottom: 15px;">
                    <h3 style="background-color: #10b981; color: white; padding: 8px; margin: 0; font-size: 13px; font-weight: bold; border-radius: 3px;">
                        📞 Referencias de Contacto
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px;">
                        <tr>
                            <td style="padding: 6px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold; width: 50%;">Teléfono Propio</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.telefonoPropio || '---'}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Contacto Familiar</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.nombreContacto || '---'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Teléfono Familiar</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.telefonoFamiliar || '---'}</td>
                        </tr>
                    </table>
                </div>

                <!-- SECCIÓN: PROCEDENCIA Y VIVIENDA -->
                <div style="margin-bottom: 15px;">
                    <h3 style="background-color: #10b981; color: white; padding: 8px; margin: 0; font-size: 13px; font-weight: bold; border-radius: 3px;">
                        🏠 Procedencia y Vivienda
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px;">
                        <tr>
                            <td style="padding: 6px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold; width: 50%;">Origen (Departamento)</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.origen || '---'}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Tipo de Vivienda</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.vivienda || '---'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Barrio</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.barrio || '---'}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Calle / Número</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.calle || '---'} ${residente.numero || ''}</td>
                        </tr>
                    </table>
                </div>

                <!-- SECCIÓN: SALUD Y TRATAMIENTO -->
                <div style="margin-bottom: 15px;">
                    <h3 style="background-color: #10b981; color: white; padding: 8px; margin: 0; font-size: 13px; font-weight: bold; border-radius: 3px;">
                        💊 Salud y Tratamiento
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px;">
                        <tr>
                            <td style="padding: 6px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold; width: 50%;">Tiempo de Asistencia</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.tiempoAsistencia ? residente.tiempoAsistencia + ' meses' : '---'}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Enfermedad de Base</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">
                                ${residente.tieneEnfermedad ? 
                                    `Sí - ${residente.especificarEnfermedad || 'No especificada'}` 
                                    : 
                                    'No'
                                }
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Seguro de Salud</td>
                            <td style="padding: 6px; border: 1px solid #e2e8f0;">${residente.seguroSalud || '---'}</td>
                        </tr>
                    </table>

                    <!-- Medicamentos -->
                    ${residente.medicamentos && residente.medicamentos.length > 0 ? `
                        <h4 style="font-size: 11px; font-weight: bold; margin-top: 10px; margin-bottom: 5px;">Medicamentos:</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <tr style="background-color: #10b981; color: white;">
                                <td style="padding: 4px; border: 1px solid #e2e8f0; font-weight: bold;">Medicamento</td>
                                <td style="padding: 4px; border: 1px solid #e2e8f0; font-weight: bold;">Dosis</td>
                                <td style="padding: 4px; border: 1px solid #e2e8f0; font-weight: bold;">Horario</td>
                            </tr>
                            ${residente.medicamentos.map((med, idx) => `
                                <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : 'white'};">
                                    <td style="padding: 4px; border: 1px solid #e2e8f0;">${med.medicamento || '---'}</td>
                                    <td style="padding: 4px; border: 1px solid #e2e8f0;">${med.dosis || '---'}</td>
                                    <td style="padding: 4px; border: 1px solid #e2e8f0;">${med.horario || '---'}</td>
                                </tr>
                            `).join('')}
                        </table>
                    ` : ''}
                </div>

                <!-- SECCIÓN: OBSERVACIONES -->
                ${residente.observaciones ? `
                    <div style="margin-bottom: 15px;">
                        <h3 style="background-color: #10b981; color: white; padding: 8px; margin: 0; font-size: 13px; font-weight: bold; border-radius: 3px;">
                            📝 Observaciones
                        </h3>
                        <div style="border: 1px solid #e2e8f0; padding: 10px; margin-top: 5px; background-color: #f8fafc; font-size: 11px; line-height: 1.5;">
                            ${residente.observaciones}
                        </div>
                    </div>
                ` : ''}

                <!-- FOOTER CON FECHA -->
                <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
                    <p style="margin: 3px 0;">Fecha de Registro: ${fechaRegistro}</p>
                    <p style="margin: 3px 0;">Generado: ${new Date().toLocaleString('es-BO')}</p>
                    <p style="margin: 3px 0; font-style: italic;">Centro de Ancianos Vida Feliz - Gestión 2026</p>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Construye el HTML del encabezado del reporte
     * @returns {String} HTML del encabezado
     */
    construirHTMLEncabezado() {
        return `
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 5px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
                    ${this.nombreInstitucion}
                </h1>
                <p style="margin: 5px 0; font-size: 14px;">Gestión ${this.gestion}</p>
                <p style="margin: 5px 0; font-size: 12px;">Reporte de Residentes</p>
                <p style="margin: 5px 0; font-size: 11px;">Generado: ${new Date().toLocaleString('es-BO')}</p>
            </div>
        `;
    }

    /**
     * Formatea una fecha ISO a formato local
     * @param {String} fechaISO - Fecha en formato ISO
     * @returns {String} Fecha formateada
     */
    formatearFecha(fechaISO) {
        if (!fechaISO) return '---';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Genera un reporte de estadísticas en PDF
     * @returns {void} Descarga el PDF
     */
    generarReporteEstadisticas() {
        const stats = db.obtenerEstadisticas();

        let htmlContent = this.construirHTMLEncabezado();

        htmlContent += `
            <div style="border: 1px solid #e2e8f0; padding: 20px; background-color: #f8fafc;">
                <h2 style="color: #10b981; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                    📊 Estadísticas Generales
                </h2>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background-color: white; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">Total de Residentes</p>
                        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #10b981;">${stats.total}</p>
                    </div>
                    <div style="background-color: white; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">Edad Promedio</p>
                        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #10b981;">${stats.edadPromedio} años</p>
                    </div>
                    <div style="background-color: white; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">Hombres</p>
                        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #0ea5e9;">${stats.hombres}</p>
                    </div>
                    <div style="background-color: white; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">Mujeres</p>
                        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #ec4899;">${stats.mujeres}</p>
                    </div>
                    <div style="background-color: white; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">Con Enfermedad de Base</p>
                        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #ef4444;">${stats.conEnfermedad}</p>
                    </div>
                </div>

                <h3 style="color: #10b981; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #10b981; padding-bottom: 5px;">
                    🏠 Distribución por Tipo de Vivienda
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
                    <tr style="background-color: #10b981; color: white;">
                        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Tipo</td>
                        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; text-align: right;">Cantidad</td>
                        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; text-align: right;">Porcentaje</td>
                    </tr>
                    ${Object.entries(stats.porVivienda).map(([vivienda, cantidad], idx) => {
                        const porcentaje = ((cantidad / stats.total) * 100).toFixed(1);
                        return `
                            <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : 'white'};">
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">${vivienda}</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">${cantidad}</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">${porcentaje}%</td>
                            </tr>
                        `;
                    }).join('')}
                </table>

                <h3 style="color: #10b981; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #10b981; padding-bottom: 5px;">
                    🗺️ Distribución por Procedencia (Departamento)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <tr style="background-color: #10b981; color: white;">
                        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Departamento</td>
                        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; text-align: right;">Cantidad</td>
                        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; text-align: right;">Porcentaje</td>
                    </tr>
                    ${Object.entries(stats.porOrigen).map(([origen, cantidad], idx) => {
                        const porcentaje = ((cantidad / stats.total) * 100).toFixed(1);
                        return `
                            <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : 'white'};">
                                <td style="padding: 6px; border: 1px solid #e2e8f0;">${origen}</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">${cantidad}</td>
                                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">${porcentaje}%</td>
                            </tr>
                        `;
                    }).join('')}
                </table>
            </div>
        `;

        const nombreArchivo = `Estadisticas_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: 10,
            filename: nombreArchivo,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(htmlContent).save();
    }
}

/* ========================================
   INICIALIZACIÓN
   ======================================== */

// Crear instancia global
const pdfGen = new PDFGenerator();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFGenerator;
}
