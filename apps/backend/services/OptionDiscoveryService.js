import { detectOptionsScript } from './OptionDetector.js';

/**
 * OptionDiscoveryService
 *
 * Servicio mejorado de descubrimiento de opciones de selección dentro de un contenedor.
 * Extiende OptionDetector.js con clasificación de tipos, confidence scores,
 * locators robustos y cálculo de estado fiable.
 *
 * Filosofía: local-first, scripts self-contained en page.context,
 * sin dependencias externas pesadas. Todos los scripts de evaluación
 * se ejecutan vía page.evaluate() con funciones totalmente contenidas.
 */

/**
 * Posibles tipos de opción detectada.
 *
 * @typedef {('native_select' | 'native_select_multi' |
 *   'checkbox' | 'radio' | 'aria_option' | 'aria_checkbox' |
 *   'aria_radio' | 'list_item' | 'custom_component')} OptionType
 */

/**
 * Estructura de una opción detectada y enriquecida.
 *
 * @typedef {Object} DetectedOption
 * @property {string} id - Identificador único (auto-generado si no existe)
 * @property {OptionType} type - Tipo de opción detectada
 * @property {string} label - Texto visible/accesible de la opción
 * @property {string|null} value - Valor del attribute 'value' (si existe)
 * @property {boolean} selected - Está seleccionada (computed reliable)
 * @property {boolean} checked - Está checkeada (computed reliable)
 * @property {boolean} enabled - Está habilitada (no disabled)
 * @property {boolean} visible - Es visible (no hidden, opacity>0)
 * @property {string} locator - Locator Playwright preferente
 * @property {number} confidence - Confianza 0-1 en robustez del locator
 * @property {string|null} groupId - ID de grupo para radios/checkboxes agrupados
 */

/**
 * Resultado completo del descubrimiento de opciones.
 *
 * @typedef {Object} DiscoveryResult
 * @property {'select' | 'select-multi' | 'checkbox-group' | 'radio-group' | 'list' | 'unknown'} groupType -
 *   Tipo de grupo general detectado
 * @property {DetectedOption[]} options - Lista de opciones detectadas y enriquecidas
 * @property {string} containerSelector - El selector de contenedor analizado
 * @property {string[]} analysisNotes - Notas legibles para mostrar en la UI
 */

/**
 * Ejecuta el descubrimiento de opciones dentro de un container selector.
 * Punto de entrada principal. Usa el script OptionDetector internally
 * y enriquece el resultado con clasificación, confidence y metadata.
 *
 * @param {import('../').Page} page - Instancia de página Playwright
 * @param {string} containerSelector - Selector CSS/role que apunta al contenedor
 * @param {Object} [options] - Opciones adicionales
 * @param {number} [options.timeout=30000] - Timeout en ms para las operaciones de página
 * @returns {Promise<DiscoveryResult>} Resultado enriquecido con tipos y confidence
 *
 * @example
 * ```javascript
 * import { discoverOptions } from '../services/OptionDiscoveryService.js';
 * const result = await discoverOptions(page, '#my-select', { timeout: 15000 });
 * if (result.groupType === 'select') {
 *   // Seleccionar la primera opción: await page.getByRole('option', { name: result.options[0].label }).click();
 * }
 */
export async function discoverOptions(page, containerSelector) {
    if (!containerSelector || typeof containerSelector !== 'string') {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector: containerSelector || '',
            analysisNotes: ['Selector de contenedor inválido o ausente.'],
        };
    }

    // 1. Ejecutar detector existente dentro del page context
    let rawResult;
    try {
        rawResult = await page.evaluate(detectOptionsScript, containerSelector);
    } catch (err) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [`Error ejecutando el detector de opciones: ${err.message}`],
        };
    }

    // 2. Manejar caso "no encontrado"
    if (!rawResult?.found || rawResult.options.length === 0) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [
                `No se detectaron opciones dentro de "${containerSelector}".`,
                'Verifique que el contenedor exponga controles de selección (checkbox, radio, select, list items).',
            ],
        };
    }

    // 3. Enriquecer cada opción detectada
    const enrichedOptions = rawResult.options.map((opt, idx) => {
        // Determinar tipo con clasificación mejorada
        const type = classifyOptionTypeRaw(opt);

        // Calcular confidence score
        const confidence = calculateConfidence(opt);

        // Construir locator Playwright robusto
        const locator = buildRobustLocator(opt);

        // Computar selected/checked más confiable
        const reliableSelected = computeReliableSelectedState(opt);
        const reliableChecked = computeReliableCheckedState(opt);

        // Determinar groupId si aplica
        const groupId = determineGroupId(opt, rawResult.groupType);

        return {
            id: opt.id || `option-${idx}`,
            type,
            label: opt.label || `Option ${idx + 1}`,
            value: opt.value ?? null,
            selected: reliableSelected,
            checked: reliableChecked,
            enabled: opt.enabled !== false,
            visible: opt.visible !== false,
            locator,
            confidence,
            groupId,
        };
    });

    // 3. Determinar groupType final (puede diferir al raw si hay mezclas)
    const finalGroupType = determineFinalGroupType(enrichedOptions, rawResult.groupType);

    // 4. Generar notas de análisis para UI
    const notes = generateAnalysisNotes(rawResult, enrichedOptions);

    return {
        groupType: finalGroupType,
        options: enrichedOptions,
        containerSelector,
        analysisNotes: notes,
    };
}

/**
 * Clasifica el tipo de opción basándose en las propiedades crudas detectadas
 * por el script de OptionDetector.
 *
 * @param {Object} opt - Opción individual tal como viene del script detector
 * @returns {OptionType} Tipo clasificado
 * @private
 */
function classifyOptionTypeRaw(opt) {
    if (opt.type === 'select' || opt.type === 'select-multi') {
        return opt.multi === true ? 'native_select_multi' : 'native_select';
    }
    if (opt.type === 'checkbox' || opt.type.includes('checkbox')) return 'checkbox';
    if (opt.type === 'radio' || opt.type.includes('radio')) return 'radio';
    if (opt.type.includes('radio-role') || opt.type.includes('menuitemradio')) return 'aria_radio';
    if (opt.type.includes('checkbox-role') || opt.type.includes('menuitemcheckbox'))
        return 'aria_checkbox';
    if (opt.type === 'option' || opt.type.includes('option')) return 'aria_option';
    if (opt.type === 'list') return 'list_item';
    return 'custom_component';
}

/** Calcula un score de confidence (0-1) basado en indicadores de robustez. */
function calculateConfidence(opt) {
    let score = 0.5;
    if (opt.locator) {
        if (opt.locator.startsWith('getByRole')) score += 0.2;
        else if (opt.locator.startsWith('#')) score += 0.1;
        else if (opt.locator.includes('data-test')) score += 0.15;
    }
    if (opt.label && opt.label.trim().length > 0) score += 0.1;
    if (opt.value !== null && opt.value !== undefined && opt.value !== '') score += 0.1;
    if (opt.selected || opt.checked) score += 0.1;
    if (opt.enabled !== undefined) score += 0.05;
    if (opt.visible !== undefined) score += 0.05;
    return Math.min(Math.max(score, 0.1), 1.0);
}

/** Escapa un valor para uso seguro en un selector CSS. */
function escapeCss(value) {
    return String(value).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/** Construye un locator Playwright robusto priorizando strategies. */
function buildRobustLocator(opt) {
    if (opt.locator && opt.locator.trim().length > 0) return opt.locator;
    if (opt.id && !/\[\d{3,}|[a-f0-9]{8}-[a-f0-9]{4}/i.test(opt.id)) {
        return `#${escapeCss(opt.id)}`;
    }
    if (opt.label && opt.label.trim().length > 0) {
        const safeLabel = escapeCss(opt.label);
        return `getByRole('option', { name: '${safeLabel}' })`;
    }
    if (opt.label && opt.label.trim().length > 0) {
        const safeLabel = escapeCss(opt.label);
        return `getByText('${safeLabel}')`;
    }
    return `#${Math.random().toString(36).substr(2, 9)}`;
}

/** Computa el estado 'selected' más fiable mezclando attribute + class + ARIA. */
function computeReliableSelectedState(opt) {
    if (opt.selected !== undefined) return Boolean(opt.selected);
    if (opt.actualState && opt.actualState.selected !== undefined)
        return Boolean(opt.actualState.selected);
    if (opt.classList) {
        if (opt.classList.contains('selected')) return true;
        if (opt.classList.contains('active')) return true;
    }
    if (opt.actualState && opt.actualState.aria_selected !== null)
        return opt.actualState.aria_selected === 'true';
    return false;
}

/** Mismo algoritmo que computeReliableSelectedState para checked. */
function computeReliableCheckedState(opt) {
    return computeReliableSelectedState(opt);
}

/** Determina el groupId para radios/checkboxes agrupados. */
function determineGroupId(opt, rawGroup) {
    if (opt.groupId) return opt.groupId;
    if (rawGroup === 'radio-group' || rawGroup === 'checkbox-group') {
        if (opt.label) {
            const firstWord = opt.label
                .split(' ')[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
            if (firstWord.length > 0) return firstWord;
        }
        return opt.type;
    }
    return null;
}

/** Determina el groupType final considerando las options enriquecidas. */
function determineFinalGroupType(enrichedOptions, rawGroup) {
    const types = new Set(enrichedOptions.map((o) => o.type));
    if (types.has('native_select') || types.has('native_select_multi')) {
        return types.has('native_select_multi') ? 'select-multi' : 'select';
    }
    if (types.has('radio') || types.has('aria_radio')) return 'radio-group';
    if (types.has('checkbox') || types.has('aria_checkbox')) return 'checkbox-group';
    if (types.has('list_item')) return 'list';
    return rawGroup || 'unknown';
}

/** Genera notas legibles para mostrar en la panel de la UI. */
function generateAnalysisNotes(rawResult, enrichedOptions) {
    const notes = [];
    if (rawResult.options.length === 0) {
        notes.push('No se detectaron elementos interactivos dentro del contenedor.');
        return notes;
    }
    const typeCounts = {};
    for (const opt of enrichedOptions) {
        typeCounts[opt.type] = (typeCounts[opt.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(typeCounts)) {
        notes.push(`Se detectaron ${count} opción(es) de tipo "${type}".`);
    }
    const lowConfidence = enrichedOptions.filter((o) => o.confidence < 0.5).length;
    if (lowConfidence > 0) {
        notes.push(
            `⚠️ ${lowConfidence} opción(es) tienen baja confidence - los locators pueden no ser robustos.`,
        );
    }
    const selectedCount = enrichedOptions.filter((o) => o.selected).length;
    if (selectedCount > 0) {
        notes.push(`${selectedCount} opción(nes) ya están seleccionadas/activadas.`);
    }
    const withStableId = enrichedOptions.filter(
        (o) => o.locator && o.locator.startsWith('#'),
    ).length;
    if (withStableId < enrichedOptions.length) {
        notes.push(
            `${enrichedOptions.length - withStableId} opción(es) usan locators dinámicos - se recomienda agregar data-testid para mayor estabilidad.`,
        );
    }
    return notes;
}

/* ----------------------------------------------------------------
   Exportaciones nombradas (API principal)
   ---------------------------------------------------------------- */

export {
    classifyOptionTypeRaw,
    calculateConfidence,
    buildRobustLocator,
    computeReliableSelectedState,
    computeReliableCheckedState,
    determineGroupId,
    determineFinalGroupType,
    generateAnalysisNotes,
};

/* ----------------------------------------------------------------
   Re-exportar script self-contained de OptionDetector.js
   para mantener compatibilidad absoluta hacia atrás.
   ---------------------------------------------------------------- */

export { detectOptionsScript };
