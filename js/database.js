/* ========================================
   DATABASE.JS - GESTIÓN DE PERSISTENCIA
   LocalStorage CRUD para residentes CVF
   ======================================== */

class ResidenteDatabase {
    constructor() {
        this.storageKey = 'CVF_RESIDENTES_2026';
        this.initialize();
    }

    /**
     * Inicializa la base de datos
     * Si no existe, crea un array vacío
     */
    initialize() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /**
     * Obtiene todos los residentes
     * @returns {Array} Array de residentes
     */
    obtenerTodos() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al obtener residentes:', error);
            return [];
        }
    }

    /**
     * Obtiene un residente por índice
     * @param {Number} index - Índice del residente
     * @returns {Object|null} Objeto residente o null
     */
    obtenerPorIndice(index) {
        const residentes = this.obtenerTodos();
        return residentes[index] || null;
    }

    /**
     * Busca residentes por nombre o C.I.
     * @param {String} termino - Término de búsqueda
     * @returns {Array} Array de residentes que coinciden
     */
    buscar(termino) {
        const residentes = this.obtenerTodos();
        const terminoLower = termino.toLowerCase().trim();

        if (!terminoLower) {
            return residentes;
        }

        return residentes.filter(residente => {
            return (
                residente.nombre.toLowerCase().includes(terminoLower) ||
                residente.ci.includes(terminoLower) ||
                (residente.nombreContacto && residente.nombreContacto.toLowerCase().includes(terminoLower))
            );
        });
    }

    /**
     * Crea o actualiza un residente
     * @param {Object} datosResidente - Datos del residente
     * @param {Number} editIndex - Índice para actualización (undefined para crear)
     * @returns {Object} Objeto con resultado {success: bool, mensaje: string, index: number}
     */
    guardar(datosResidente, editIndex = undefined) {
        try {
            // Validar datos obligatorios
            const validacion = this.validar(datosResidente);
            if (!validacion.valido) {
                return {
                    success: false,
                    mensaje: validacion.errores.join(', ')
                };
            }

            const residentes = this.obtenerTodos();

            // Verificar duplicado de C.I. (excepto si es edición del mismo)
            const ciExistente = residentes.findIndex(
                (r, idx) => r.ci === datosResidente.ci && idx !== editIndex
            );

            if (ciExistente !== -1) {
                return {
                    success: false,
                    mensaje: `Ya existe un residente con C.I. ${datosResidente.ci}`
                };
            }

            // Agregar metadatos
            const ahora = new Date().toISOString();
            datosResidente.fechaCreacion = editIndex !== undefined 
                ? residentes[editIndex].fechaCreacion 
                : ahora;
            datosResidente.fechaActualizacion = ahora;

            if (editIndex !== undefined) {
                // ACTUALIZAR
                residentes[editIndex] = datosResidente;
                this.guardarEnStorage(residentes);
                return {
                    success: true,
                    mensaje: '✅ Residente actualizado correctamente',
                    index: editIndex
                };
            } else {
                // CREAR
                residentes.push(datosResidente);
                this.guardarEnStorage(residentes);
                return {
                    success: true,
                    mensaje: '✅ Residente registrado correctamente',
                    index: residentes.length - 1
                };
            }
        } catch (error) {
            console.error('Error al guardar residente:', error);
            return {
                success: false,
                mensaje: 'Error al guardar: ' + error.message
            };
        }
    }

    /**
     * Elimina un residente por índice
     * @param {Number} index - Índice del residente
     * @returns {Object} Objeto con resultado {success: bool, mensaje: string}
     */
    eliminar(index) {
        try {
            const residentes = this.obtenerTodos();

            if (index < 0 || index >= residentes.length) {
                return {
                    success: false,
                    mensaje: 'Índice inválido'
                };
            }

            const nombre = residentes[index].nombre;
            residentes.splice(index, 1);
            this.guardarEnStorage(residentes);

            return {
                success: true,
                mensaje: `✅ ${nombre} ha sido eliminado del sistema`
            };
        } catch (error) {
            console.error('Error al eliminar residente:', error);
            return {
                success: false,
                mensaje: 'Error al eliminar: ' + error.message
            };
        }
    }

    /**
     * Exporta todos los residentes a JSON
     * @returns {String} JSON stringificado
     */
    exportarJSON() {
        const residentes = this.obtenerTodos();
        const exportData = {
            titulo: 'Centro de Ancianos Vida Feliz - Backup 2026',
            fecha: new Date().toLocaleString('es-BO'),
            cantidad: residentes.length,
            residentes: residentes
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Importa residentes desde JSON
     * @param {String} jsonString - JSON stringificado
     * @param {Boolean} fusion - Si false, reemplaza todos; si true, fusiona
     * @returns {Object} Objeto con resultado {success: bool, mensaje: string}
     */
    importarJSON(jsonString, fusion = false) {
        try {
            const importData = JSON.parse(jsonString);
            let residentes = importData.residentes || [];

            if (!Array.isArray(residentes)) {
                throw new Error('Formato JSON inválido');
            }

            if (fusion) {
                // Fusionar: validar y agregar nuevos
                const existentes = this.obtenerTodos();
                let agregados = 0;

                residentes.forEach(residente => {
                    const ciExistente = existentes.some(r => r.ci === residente.ci);
                    if (!ciExistente) {
                        existentes.push(residente);
                        agregados++;
                    }
                });

                this.guardarEnStorage(existentes);
                return {
                    success: true,
                    mensaje: `✅ Se importaron ${agregados} residentes (sin duplicados)`
                };
            } else {
                // Reemplazar
                this.guardarEnStorage(residentes);
                return {
                    success: true,
                    mensaje: `✅ Se importaron ${residentes.length} residentes (reemplazo completo)`
                };
            }
        } catch (error) {
            console.error('Error al importar JSON:', error);
            return {
                success: false,
                mensaje: 'Error al importar: ' + error.message
            };
        }
    }

    /**
     * Valida un objeto residente
     * @param {Object} residente - Objeto a validar
     * @returns {Object} {valido: bool, errores: Array}
     */
    validar(residente) {
        const errores = [];

        if (!residente.nombre || residente.nombre.trim() === '') {
            errores.push('El nombre es obligatorio');
        }

        if (!residente.ci || residente.ci.trim() === '') {
            errores.push('El C.I. es obligatorio');
        }

        if (!residente.extension) {
            errores.push('La extensión departamental es obligatoria');
        }

        if (!residente.fechaNacimiento) {
            errores.push('La fecha de nacimiento es obligatoria');
        }

        if (!residente.genero) {
            errores.push('El género es obligatorio');
        }

        if (!residente.origen) {
            errores.push('El origen (departamento) es obligatorio');
        }

        if (!residente.vivienda) {
            errores.push('El tipo de vivienda es obligatorio');
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    }

    /**
     * Calcula la edad a partir de fecha de nacimiento
     * @param {String} fechaNacimiento - Fecha en formato YYYY-MM-DD
     * @returns {Number} Edad en años
     */
    calcularEdad(fechaNacimiento) {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();

        if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return Math.max(0, edad);
    }

    /**
     * Obtiene estadísticas de residentes
     * @returns {Object} Objeto con estadísticas
     */
    obtenerEstadisticas() {
        const residentes = this.obtenerTodos();
        const total = residentes.length;

        if (total === 0) {
            return {
                total: 0,
                hombres: 0,
                mujeres: 0,
                edadPromedio: 0,
                conEnfermedad: 0,
                porVivienda: {},
                porOrigen: {}
            };
        }

        let hombres = 0;
        let mujeres = 0;
        let sumEdades = 0;
        let conEnfermedad = 0;
        const porVivienda = {};
        const porOrigen = {};

        residentes.forEach(residente => {
            // Género
            if (residente.genero === 'M') hombres++;
            if (residente.genero === 'F') mujeres++;

            // Edad promedio
            const edad = this.calcularEdad(residente.fechaNacimiento);
            sumEdades += edad;

            // Enfermedad
            if (residente.tieneEnfermedad) conEnfermedad++;

            // Vivienda
            porVivienda[residente.vivienda] = (porVivienda[residente.vivienda] || 0) + 1;

            // Origen
            porOrigen[residente.origen] = (porOrigen[residente.origen] || 0) + 1;
        });

        return {
            total,
            hombres,
            mujeres,
            edadPromedio: Math.round(sumEdades / total),
            conEnfermedad,
            porVivienda,
            porOrigen
        };
    }

    /**
     * Genera un reporte en formato texto
     * @returns {String} Reporte formateado
     */
    generarReporte() {
        const residentes = this.obtenerTodos();
        const stats = this.obtenerEstadisticas();
        const ahora = new Date().toLocaleString('es-BO');

        let reporte = '╔════════════════════════════════════════════════════════════════╗\n';
        reporte += '║  CENTRO DE ANCIANOS VIDA FELIZ - REPORTE 2026                   ║\n';
        reporte += '╚════════════════════════════════════════════════════════════════╝\n\n';

        reporte += `Fecha de Generación: ${ahora}\n`;
        reporte += `Total de Residentes: ${stats.total}\n\n`;

        reporte += '─── ESTADÍSTICAS ───\n';
        reporte += `Hombres: ${stats.hombres}\n`;
        reporte += `Mujeres: ${stats.mujeres}\n`;
        reporte += `Edad Promedio: ${stats.edadPromedio} años\n`;
        reporte += `Con Enfermedad de Base: ${stats.conEnfermedad}\n\n`;

        reporte += '─── TIPOS DE VIVIENDA ───\n';
        Object.entries(stats.porVivienda).forEach(([vivienda, cantidad]) => {
            reporte += `${vivienda}: ${cantidad}\n`;
        });

        reporte += '\n─── PROCEDENCIA (DEPARTAMENTOS) ───\n';
        Object.entries(stats.porOrigen).forEach(([origen, cantidad]) => {
            reporte += `${origen}: ${cantidad}\n`;
        });

        reporte += '\n╔════════════════════════════════════════════════════════════════╗\n';

        return reporte;
    }

    /**
     * Limpia todos los datos (PELIGROSO)
     * @returns {void}
     */
    limpiarTodo() {
        if (confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los residentes? Esta acción no se puede deshacer.')) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
            return true;
        }
        return false;
    }

    /**
     * Guarda en LocalStorage de forma segura
     * @param {Array} residentes - Array de residentes
     * @returns {void}
     */
    guardarEnStorage(residentes) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(residentes));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('❌ Almacenamiento agotado:', error);
                alert('⚠️ El almacenamiento del navegador está lleno. Por favor, exporte los datos o elimine algunos registros.');
            } else {
                console.error('Error al guardar en storage:', error);
            }
            throw error;
        }
    }

    /**
     * Obtiene el tamaño aproximado del almacenamiento utilizado
     * @returns {Object} {usado: bytes, porcentaje: numero}
     */
    obtenerTamanoAlmacenamiento() {
        const data = localStorage.getItem(this.storageKey);
        const bytes = new Blob([data]).size;
        const porcentaje = Math.round((bytes / (5 * 1024 * 1024)) * 100); // 5MB típico

        return {
            usado: bytes,
            usadoMB: (bytes / 1024 / 1024).toFixed(2),
            porcentaje: Math.min(100, porcentaje)
        };
    }
}

/* ========================================
   INICIALIZACIÓN
   ======================================== */

// Crear instancia global
const db = new ResidenteDatabase();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResidenteDatabase;
}
