/**
 * Manages global variables for the automation flow.
 * Variables are stored in memory using a Map for efficient access.
 * * This module exports a unique instance (Singleton) called globalStateManager.
 */
class StateManager {
    constructor() {
        this.variables = new Map();
        console.log('[StateManager] Initialized.');
    }

    /**
     * Sets the value of a global flow variable.
     * @param {string} name - The variable name.
     * @param {*} value - The value to store (can be string, number, object, etc.).
     */
    setVariable(name, value) {
        this.variables.set(name, value);
        const length = typeof value === 'string' || Array.isArray(value) ? value.length : 'N/A';
        console.log(
            `[StateManager] Variable set: ${name} (Type: ${typeof value}, Size/Length: ${length})`,
        );
    }

    /**
     * Gets the value of a global flow variable.
     * @param {string} name - The variable name.
     * @returns {*} The stored value, or undefined if not found.
     */
    getVariable(name) {
        return this.variables.get(name);
    }

    /**
     * Deletes a global variable.
     * @param {string} name - The variable name.
     * @returns {boolean} True if the variable existed and was deleted, false otherwise.
     */
    deleteVariable(name) {
        return this.variables.delete(name);
    }

    /**
     * Returns all stored variables.
     * @returns {Object} A plain object containing all variables.
     */
    getAllVariables() {
        return Object.fromEntries(this.variables);
    }

    /**
     * Clears all stored variables.
     */
    clearAllVariables() {
        this.variables.clear();
        console.log('[StateManager] All variables cleared.');
    }
}

// Export the unique state manager instance to be shared across the application.
export const globalStateManager = new StateManager();
