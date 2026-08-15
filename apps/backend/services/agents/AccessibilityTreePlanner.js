/**
 * AccessibilityTreePlanner
 * Analyzes Playwright accessibility tree snapshots to identify interactive element hierarchies,
 * compute critical paths for user intent, and generate HalTest canvas flow nodes.
 */
export class AccessibilityTreePlanner {
    constructor(options = {}) {
        this.defaultWaitTimeout = options.defaultWaitTimeout || 5000;
    }

    /**
     * Parse accessibility tree snapshot from Playwright page.accessibility.snapshot()
     * @param {Object} snapshot - Accessibility tree root object
     * @returns {Array<Object>} List of interactive nodes with structural paths
     */
    parseAccessibilityTree(snapshot) {
        if (!snapshot) return [];

        const interactiveNodes = [];

        const traverse = (node, path = []) => {
            if (!node) return;

            const currentPath = [...path, node.role || 'element'];
            const isInteractive = this._isInteractiveRole(node.role, node);

            if (isInteractive) {
                interactiveNodes.push({
                    role: node.role,
                    name: node.name || '',
                    value: node.value || '',
                    description: node.description || '',
                    disabled: !!node.disabled,
                    focused: !!node.focused,
                    checked: node.checked,
                    path: currentPath.join(' > '),
                    selectorHint: this._generateSelectorHint(node),
                });
            }

            if (Array.isArray(node.children)) {
                for (const child of node.children) {
                    traverse(child, currentPath);
                }
            }
        };

        traverse(snapshot);
        return interactiveNodes;
    }

    /**
     * Identifies the critical path elements needed to accomplish a target goal
     * @param {Array<Object>} interactiveNodes
     * @param {string} goal - Target user intent (e.g. "submit login form", "search product")
     * @returns {Object} Critical path breakdown with prioritized target elements
     */
    analyzeCriticalPaths(interactiveNodes = [], goal = '') {
        const goalLower = goal.toLowerCase();
        const isLoginGoal =
            goalLower.includes('login') ||
            goalLower.includes('iniciar sesion') ||
            goalLower.includes('sign in');

        const inputs = [];
        const buttons = [];
        const links = [];

        for (const node of interactiveNodes) {
            if (node.disabled) continue;

            const role = node.role;
            if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
                inputs.push(node);
            } else if (role === 'button') {
                buttons.push(node);
            } else if (role === 'link') {
                links.push(node);
            }
        }

        // Sort/Score buttons by relevance to goal
        buttons.sort((a, b) => {
            const aScore = this._scoreRelevance(a.name, goalLower, isLoginGoal);
            const bScore = this._scoreRelevance(b.name, goalLower, isLoginGoal);
            return bScore - aScore;
        });

        return {
            goal,
            totalInteractiveElements: interactiveNodes.length,
            criticalPath: {
                inputs,
                primaryAction: buttons[0] || links[0] || null,
                secondaryActions: buttons.slice(1).concat(links),
            },
        };
    }

    /**
     * Generates HalTest canvas visual nodes from accessibility critical path analysis
     * @param {string} targetUrl
     * @param {Object} criticalPathAnalysis
     * @returns {Array<Object>} HalTest node definitions
     */
    generateFlowNodes(targetUrl, criticalPathAnalysis) {
        const nodes = [];
        let yOffset = 100;

        // 1. Launch Browser
        nodes.push({
            id: `node-launch-${Date.now()}-1`,
            type: 'launch_browser',
            position: { x: 250, y: yOffset },
            data: { headless: true },
        });
        yOffset += 120;

        // 2. Open URL
        nodes.push({
            id: `node-open-${Date.now()}-2`,
            type: 'open_url',
            position: { x: 250, y: yOffset },
            data: { url: targetUrl || 'https://example.com' },
        });
        yOffset += 120;

        const { inputs, primaryAction } = criticalPathAnalysis.criticalPath || {};

        // 3. Fill input fields
        if (Array.isArray(inputs)) {
            inputs.forEach((input, index) => {
                nodes.push({
                    id: `node-type-${Date.now()}-${index + 3}`,
                    type: 'type_text',
                    position: { x: 250, y: yOffset },
                    data: {
                        selector: input.selectorHint,
                        text: input.name ? `[${input.name}]` : 'Sample Text',
                        role: input.role,
                        ariaName: input.name,
                    },
                });
                yOffset += 120;
            });
        }

        // 4. Primary Action Click (Button/Submit)
        if (primaryAction) {
            nodes.push({
                id: `node-click-${Date.now()}-action`,
                type: 'click',
                position: { x: 250, y: yOffset },
                data: {
                    selector: primaryAction.selectorHint,
                    role: primaryAction.role,
                    ariaName: primaryAction.name,
                },
            });
            yOffset += 120;
        }

        // 5. Wait for navigation/visibility
        nodes.push({
            id: `node-wait-${Date.now()}-end`,
            type: 'wait_visible',
            position: { x: 250, y: yOffset },
            data: { timeout: this.defaultWaitTimeout },
        });

        return nodes;
    }

    _isInteractiveRole(role, node) {
        const interactiveRoles = new Set([
            'button',
            'textbox',
            'searchbox',
            'combobox',
            'checkbox',
            'radio',
            'link',
            'menuitem',
            'tab',
            'switch',
            'option',
        ]);
        return interactiveRoles.has(role) || !!node.focused || !!node.value;
    }

    _generateSelectorHint(node) {
        if (node.name) {
            return `role=${node.role}[name="${node.name}"]`;
        }
        return `role=${node.role}`;
    }

    _scoreRelevance(name = '', goalLower = '', isLoginGoal = false) {
        const lower = name.toLowerCase();
        let score = 0;
        if (goalLower && lower.includes(goalLower)) score += 10;
        if (
            isLoginGoal &&
            (lower.includes('login') ||
                lower.includes('iniciar') ||
                lower.includes('submit') ||
                lower.includes('entrar'))
        )
            score += 5;
        if (lower.includes('search') || lower.includes('buscar')) score += 3;
        return score;
    }
}

export default new AccessibilityTreePlanner();
