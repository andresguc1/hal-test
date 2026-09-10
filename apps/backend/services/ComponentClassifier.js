/**
 * ComponentClassifier
 *
 * Pure classification logic for selectable options.
 * Extracted from OptionDiscoveryService for reusability and testability.
 * No side effects, no I/O - pure functions only.
 */

/**
 * @typedef {('native_select' | 'native_select_multi' |
 *   'checkbox' | 'radio' | 'aria_option' | 'aria_checkbox' |
 *   'aria_radio' | 'list_item' | 'custom_component')} OptionType
 */

/**
 * @typedef {Object} ClassifiedOption
 * @property {string} id
 * @property {OptionType} type
 * @property {string} label
 * @property {string|null} value
 * @property {boolean} selected
 * @property {boolean} checked
 * @property {boolean} enabled
 * @property {boolean} visible
 * @property {string} locator
 * @property {number} confidence
 * @property {string|null} groupId
 * @property {Object} actualState
 */

/**
 * @typedef {('select' | 'select-multi' | 'checkbox-group' | 'radio-group' | 'listbox' | 'combobox' | 'list' | 'unknown')} GroupType
 */

/**
 * Canonical option types detected by OptionDetector script.
 * Maps raw detected types to canonical types.
 */
const RAW_TYPE_TO_CANONICAL = {
    select: 'native_select',
    'select-multi': 'native_select_multi',
    checkbox: 'checkbox',
    radio: 'radio',
    'checkbox-role': 'aria_checkbox',
    menuitemcheckbox: 'aria_checkbox',
    'radio-role': 'aria_radio',
    menuitemradio: 'aria_radio',
    option: 'aria_option',
    'option-role': 'aria_option',
    list: 'list_item',
    'list-option': 'list_item',
    custom_component: 'custom_component',
};

/**
 * Classifies a raw option from OptionDetector into a canonical type.
 *
 * @param {Object} opt - Raw option from detectOptionsScript
 * @returns {OptionType} Canonical type
 */
export function classifyOptionTypeRaw(opt) {
    const rawType = opt.type || '';
    const multi = opt.multi === true;

    if (rawType === 'select' || rawType === 'select-multi') {
        return multi ? 'native_select_multi' : 'native_select';
    }
    if (rawType === 'checkbox' || rawType.includes('checkbox')) return 'checkbox';
    if (rawType === 'radio' || rawType.includes('radio')) return 'radio';
    if (rawType.includes('radio-role') || rawType.includes('menuitemradio')) return 'aria_radio';
    if (rawType.includes('checkbox-role') || rawType.includes('menuitemcheckbox'))
        return 'aria_checkbox';
    if (rawType === 'option' || rawType.includes('option')) return 'aria_option';
    if (rawType === 'list' || rawType === 'list-option') return 'list_item';
    return 'custom_component';
}

/**
 * Calculates a confidence score (0-1) based on locator robustness indicators.
 *
 * @param {Object} opt - Option with locator, label, value, etc.
 * @returns {number} Confidence score 0-1
 */
export function calculateConfidence(opt) {
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

/**
 * Escapes a value for safe use in CSS selector.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeCss(value) {
    return String(value).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Builds a robust Playwright locator prioritizing stable strategies.
 *
 * Priority: getByRole > #id > data-test* > getByText > CSS path
 *
 * @param {Object} opt - Option with locator, id, label, type
 * @returns {string} Playwright locator string
 */
export function buildRobustLocator(opt) {
    if (opt.locator && opt.locator.trim().length > 0) return opt.locator;

    // Only address a real, native element id. The detector also emits synthetic
    // ids (`checkbox-0`, `select-0-option-2`, ...) used as internal keys; those
    // never exist in the DOM, so fabricating `#checkbox-0` would yield locators
    // that resolve to nothing at execution time.
    const nativeId =
        opt.nativeId && /^[\w-]+$/.test(String(opt.nativeId)) ? String(opt.nativeId) : null;
    if (nativeId) {
        return `#${escapeCss(nativeId)}`;
    }

    if (opt.label && opt.label.trim().length > 0) {
        const safeLabel = escapeCss(opt.label);
        if (opt.type === 'native_select' || opt.type === 'native_select_multi') {
            return `getByRole('option', { name: '${safeLabel}' })`;
        }
        if (opt.type === 'aria_option') {
            return `getByRole('option', { name: '${safeLabel}' })`;
        }
        // Native checkboxes/radios (and their aria roles) only reach this point
        // when the detector found no real accessible/associated label (locator
        // ''), so the label comes from adjacent text and getByRole would match
        // nothing. Return '' to let the strategy fall back to a container-relative
        // index locator.
        if (opt.type === 'checkbox' || opt.type === 'aria_checkbox') return '';
        if (opt.type === 'radio' || opt.type === 'aria_radio') return '';
        return `getByText('${safeLabel}')`;
    }

    // No id, no label: '' -> container-relative index fallback. Never fabricate
    // random/unknown locators.
    return '';
}

/**
 * Computes reliable selected/checked state from multiple sources.
 *
 * @param {Object} opt - Option with selected, checked, actualState, classList
 * @returns {{selected: boolean, checked: boolean}}
 */
export function computeReliableState(opt) {
    let selected = false;
    let checked = false;

    if (opt.selected !== undefined) selected = Boolean(opt.selected);
    else if (opt.actualState && opt.actualState.selected !== undefined)
        selected = Boolean(opt.actualState.selected);

    if (opt.checked !== undefined) checked = Boolean(opt.checked);
    else if (opt.actualState && opt.actualState.checked !== undefined)
        checked = Boolean(opt.actualState.checked);

    if (!selected && !checked && opt.classList) {
        const hasSelected =
            opt.classList.contains('selected') ||
            opt.classList.contains('active') ||
            opt.classList.contains('is-selected');
        if (hasSelected) {
            selected = true;
            checked = true;
        }
    }

    if (!selected && opt.actualState && opt.actualState.aria_selected !== null) {
        selected = opt.actualState.aria_selected === 'true';
        checked = selected;
    }

    if (!checked && opt.actualState && opt.actualState.aria_checked !== null) {
        checked = opt.actualState.aria_checked === 'true';
        selected = checked;
    }

    return { selected, checked };
}

/**
 * Determines groupId for radio/checkbox groups.
 *
 * @param {Object} opt - Option
 * @param {string} rawGroup - Raw group type from detector
 * @returns {string|null}
 */
export function determineGroupId(opt, rawGroup) {
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

/**
 * Determines final group type from enriched options.
 *
 * @param {ClassifiedOption[]} enrichedOptions
 * @param {string} rawGroup
 * @returns {GroupType}
 */
export function determineFinalGroupType(enrichedOptions, rawGroup) {
    const types = new Set(enrichedOptions.map((o) => o.type));

    if (types.has('native_select') || types.has('native_select_multi')) {
        return types.has('native_select_multi') ? 'select-multi' : 'select';
    }
    if (types.has('radio') || types.has('aria_radio')) return 'radio-group';
    if (types.has('checkbox') || types.has('aria_checkbox')) return 'checkbox-group';
    if (types.has('aria_option')) return 'listbox';
    if (types.has('list_item')) return 'list';
    if (types.has('custom_component')) return 'custom';

    const rawToFinal = {
        select: 'select',
        'select-multi': 'select-multi',
        'radio-group': 'radio-group',
        'checkbox-group': 'checkbox-group',
        listbox: 'listbox',
        combobox: 'combobox',
        list: 'list',
    };
    return rawToFinal[rawGroup] || 'unknown';
}

/**
 * Generates human-readable analysis notes for UI display.
 *
 * @param {Object} rawResult - Raw result from detectOptionsScript
 * @param {ClassifiedOption[]} enrichedOptions
 * @returns {string[]}
 */
export function generateAnalysisNotes(rawResult, enrichedOptions) {
    const notes = [];

    if (!rawResult?.options?.length) {
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

/**
 * Enriches raw options from detector with classification, confidence, locators.
 *
 * @param {Object} rawResult - Result from detectOptionsScript
 * @returns {{groupType: GroupType, options: ClassifiedOption[], analysisNotes: string[]}}
 */
export function enrichDetectionResult(rawResult) {
    if (!rawResult?.found || !rawResult.options?.length) {
        return {
            groupType: 'unknown',
            options: [],
            analysisNotes: ['No options found.'],
        };
    }

    const enrichedOptions = rawResult.options.map((opt, idx) => {
        const type = classifyOptionTypeRaw(opt);
        const confidence = calculateConfidence(opt);
        const locator = buildRobustLocator({ ...opt, type });
        const { selected, checked } = computeReliableState(opt);
        const groupId = determineGroupId(opt, rawResult.groupType);

        return {
            id: opt.id || `option-${idx}`,
            nativeId: opt.nativeId ?? null,
            type,
            label: opt.label || `Option ${idx + 1}`,
            value: opt.value ?? null,
            selected,
            checked,
            enabled: opt.enabled !== false,
            visible: opt.visible !== false,
            locator,
            confidence,
            groupId,
            actualState: opt.actualState || {},
        };
    });

    const groupType = determineFinalGroupType(enrichedOptions, rawResult.groupType);
    const analysisNotes = generateAnalysisNotes(rawResult, enrichedOptions);

    return { groupType, options: enrichedOptions, analysisNotes };
}
