// optionRenderers.js
// Registry of polymorphic renderers for different groupTypes in the Select Options node.
// Each renderer receives the same props and renders UI appropriate for the component type.

import React from 'react';

// Import renderers (lazy-loaded to avoid circular deps)
const rendererModules = {
    'select': () => import('./SelectOptionRenderer.jsx'),
    'select-multi': () => import('./SelectOptionRenderer.jsx'),
    'checkbox-group': () => import('./CheckboxOptionRenderer.jsx'),
    'radio-group': () => import('./RadioOptionRenderer.jsx'),
    'listbox': () => import('./ListboxOptionRenderer.jsx'),
    'combobox': () => import('./ComboboxOptionRenderer.jsx'),
    'list': () => import('./ListboxOptionRenderer.jsx'),
    'custom': () => import('./CustomOptionRenderer.jsx'),
};

const rendererCache = new Map();

/**
 * Gets the renderer component for a groupType.
 * Falls back to CustomOptionRenderer for unknown types.
 *
 * @param {string} groupType - The detected group type
 * @returns {Promise<React.ComponentType>} The renderer component
 */
export async function getRenderer(groupType) {
    if (rendererCache.has(groupType)) {
        return rendererCache.get(groupType);
    }

    const loader = rendererModules[groupType] || rendererModules['custom'];
    try {
        const module = await loader();
        const Renderer = module.default || module;
        rendererCache.set(groupType, Renderer);
        return Renderer;
    } catch (err) {
        console.warn(`[optionRenderers] Failed to load renderer for "${groupType}", using CustomOptionRenderer:`, err);
        const fallbackModule = await rendererModules['custom']();
        return fallbackModule.default || fallbackModule;
    }
}

/**
 * Synchronous version for cases where renderers are already loaded.
 * Returns CustomOptionRenderer if not yet loaded.
 *
 * @param {string} groupType
 * @returns {React.ComponentType|null}
 */
export function getRendererSync(groupType) {
    return rendererCache.get(groupType) || null;
}

/**
 * Preloads all renderers (optional, for performance).
 */
export async function preloadRenderers() {
    await Promise.all(
        Object.entries(rendererModules).map(([type, loader]) =>
            loader().then((mod) => {
                rendererCache.set(type, mod.default || mod);
            }).catch(() => {})
        )
    );
}

/**
 * Gets the default action for a groupType (used when user clicks "Select All").
 *
 * @param {string} groupType
 * @returns {'CHECK'|'SELECT'}
 */
export function getDefaultAction(groupType) {
    if (['select', 'select-multi', 'listbox', 'combobox', 'list'].includes(groupType)) {
        return 'SELECT';
    }
    return 'CHECK';
}

/**
 * Checks if a groupType supports multi-selection.
 *
 * @param {string} groupType
 * @returns {boolean}
 */
export function supportsMultiSelect(groupType) {
    return ['select-multi', 'checkbox-group', 'listbox', 'list'].includes(groupType);
}

/**
 * Checks if a groupType uses radio-style single selection.
 *
 * @param {string} groupType
 * @returns {boolean}
 */
export function isSingleSelect(groupType) {
    return ['select', 'radio-group', 'combobox'].includes(groupType);
}

/**
 * Gets the action label for a groupType and action.
 *
 * @param {string} groupType
 * @param {string} action
 * @returns {string}
 */
export function getActionLabel(groupType, action) {
    const isSelectType = ['select', 'select-multi', 'listbox', 'combobox', 'list'].includes(groupType);

    if (action === 'NO_CHANGE') return 'No Change';
    if (action === 'CHECK') return isSelectType ? 'Select' : 'Check';
    if (action === 'UNCHECK') return isSelectType ? 'Deselect' : 'Uncheck';
    if (action === 'SELECT') return 'Select';
    return action;
}

export default {
    getRenderer,
    getRendererSync,
    preloadRenderers,
    getDefaultAction,
    supportsMultiSelect,
    isSingleSelect,
    getActionLabel,
};