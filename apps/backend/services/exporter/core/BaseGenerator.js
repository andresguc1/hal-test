/**
 * Base class for all code generators.
 */
import { DesignPatternRegistry } from '../patterns/DesignPatternRegistry.js';

export class BaseGenerator {
    constructor(language, locale, designPattern = 'flat') {
        this.language = language;
        this.locale = locale;
        this.isEn = locale.startsWith('en');
        this.warnings = [];
        this.designPattern = designPattern;
        this.pattern = DesignPatternRegistry.get(designPattern);
    }

    /**
     * Generates the header for the specific language/framework.
     * @param {Array} steps
     * @returns {string}
     */
    generateHeader(_steps) {
        throw new Error('generateHeader not implemented');
    }

    /**
     * Generates the footer for the specific language/framework.
     * @returns {string}
     */
    generateFooter() {
        throw new Error('generateFooter not implemented');
    }

    /**
     * Entry point to generate full code.
     * Returns { code, warnings, mappingByFile }.
     * @param {Array} steps
     * @returns {{ code: string, warnings: Array, mappingByFile: object }}
     */
    generate(steps) {
        this.warnings = []; // Reset warnings for each generation
        this._initMapping();
        let code = this.generateHeader(steps);
        code += this.generateSteps(steps);
        code += this.generateFooter();
        this._fileMapping = { main: this.buildFileMapping(code) };
        return { code, warnings: this.warnings, mappingByFile: this._fileMapping };
    }

    /**
     * Recursively generates code for steps, recording each node into the
     * structural mapping (Canvas ↔ Code) as it goes.
     * @param {Array} steps
     * @param {number} depth
     * @returns {string}
     */
    generateSteps(steps, depth = 0) {
        if (!steps || !Array.isArray(steps)) return '';
        return steps
            .map((step, index) => {
                this._startMapping(step, depth);
                const text = this.generateNodeCode(step, index, depth) || '';
                this._endMapping(step, text);
                return text;
            })
            .filter(Boolean)
            .join('\n\n');
    }

    // ─── Structural Mapping (Canvas ↔ Code) ────────────────────────────────

    /**
     * Resets the mapping recorder between generations.
     */
    _initMapping() {
        this._mappingStack = [];
        this._mappingFrames = [];
        this._fileMapping = null;
    }

    /**
     * Returns the computed mapping, keyed by output file. Presence of the
     * entries is the Phase 2 contract; `null` when no mapping was produced.
     * @returns {object|null}
     */
    getMappingByFile() {
        return this._fileMapping || null;
    }

    _isContainerLike(step) {
        const type = step.type || step.action || '';
        const subNodes = step.data?.subNodes || step.subNodes || [];
        return (
            type === 'component' || type === 'loop' || type === 'for_each' || subNodes.length > 0
        );
    }

    /**
     * Opens a mapping frame for a node BEFORE generating its code, so nested
     * nodes can resolve `instanceKey` and `scope` from the enclosing stack.
     * @param {object} step
     * @param {number} depth
     */
    _startMapping(step, depth) {
        const type = step.type || step.action || '';
        const nodeId = step.id || step.nodeId || '';
        const frame = {
            nodeId,
            type,
            label: step.data?.label || step.data?.customLabel || step.label || type,
            depth,
            containerLike: this._isContainerLike(step),
            ownFlowId: step.data?.configuration?.flowId || step.data?.flowId || null,
            instanceKey: null,
            scope: null,
            kind: this._isContainerLike(step) ? 'container' : 'simple',
            status: 'resolved',
            reason: null,
            text: null,
        };
        for (let i = this._mappingStack.length - 1; i >= 0; i--) {
            const ancestor = this._mappingStack[i];
            if (ancestor.containerLike) {
                frame.instanceKey = ancestor.nodeId;
                break;
            }
        }
        this._mappingFrames.push(frame);
        this._mappingStack.push(frame);
    }

    /**
     * Closes the mapping frame for a node after its code was produced.
     * @param {object} step
     * @param {string} text
     */
    _endMapping(step, text) {
        const frame = this._mappingStack.pop();
        if (!frame) return;
        frame.text = text;

        const type = step.type || step.action || '';
        const subNodes = step.data?.subNodes || step.subNodes || [];
        if (type === 'component') {
            frame.kind = subNodes.length > 0 ? 'composite' : 'placeholder';
        } else if (frame.containerLike) {
            frame.kind = 'container';
        } else {
            frame.kind = 'simple';
        }

        if (frame.containerLike && frame.ownFlowId) {
            frame.scope = frame.ownFlowId;
        } else {
            for (let i = this._mappingStack.length - 1; i >= 0; i--) {
                const ancestor = this._mappingStack[i];
                if (ancestor.containerLike && ancestor.ownFlowId) {
                    frame.scope = ancestor.ownFlowId;
                    break;
                }
            }
        }

        const warning = this.warnings.find((w) => w.nodeId && w.nodeId === frame.nodeId);
        if (warning) {
            if (warning.status) frame.status = warning.status;
            if (warning.reason) frame.reason = warning.reason;
        }
    }

    /**
     * Computes entries { startLine, endLine, instanceKey, children, ... } for a
     * given output string, resolving each frame's anchor line by occurrence
     * ordinal so repeated instances of the same submodule keep private ranges.
     * @param {string} code
     * @param {string|null} [scopeOverride] - flowId sentinel applied to frames
     *   whose own scope is null (e.g. page bodies in POM output).
     * @returns {Array<object>}
     */
    buildFileMapping(code, scopeOverride = null) {
        const frames = this._mappingFrames || [];
        if (!frames.length || typeof code !== 'string' || !code) return [];
        const lines = code.split('\n');
        const occCount = new Map();

        const findAnchor = (nodeId, occurrence) => {
            const tag = `[node_id: ${nodeId}]`;
            let count = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(tag)) {
                    count += 1;
                    if (count === occurrence) return i;
                }
            }
            return -1;
        };

        const entries = [];
        for (const frame of frames) {
            if (!frame.text || !frame.nodeId) continue;
            const occurrence = (occCount.get(frame.nodeId) || 0) + 1;
            occCount.set(frame.nodeId, occurrence);
            const anchor = findAnchor(frame.nodeId, occurrence);
            if (anchor === -1) continue;

            const textLineCount = frame.text.split('\n').length;
            entries.push({
                nodeId: frame.nodeId,
                flowId: frame.scope || scopeOverride || null,
                instanceKey: frame.instanceKey || null,
                label: frame.label || frame.type,
                type: frame.type,
                depth: frame.depth,
                startLine: anchor + 1,
                endLine: Math.min(anchor + textLineCount, lines.length),
                kind: frame.kind,
                status: frame.status || 'resolved',
                reason: frame.reason || null,
                children: [],
            });
        }

        for (const entry of entries) {
            if (entry.kind === 'composite' || entry.kind === 'container') {
                entry.children = entries
                    .filter((child) => child.instanceKey === entry.nodeId)
                    .sort((a, b) => a.startLine - b.startLine)
                    .map((child) => child.nodeId);
            }
        }
        return entries;
    }

    /**
     * Adds a warning for a node that lacks implementation.
     * @param {string} nodeType
     * @param {string} nodeLabel
     * @param {number} index
     * @param {string} [status] - 'unresolved' | 'ignored' | 'stubbed'
     * @param {string} [reason] - 'no_project_context' | 'flow_not_found' |
     *   'cycle_detected' | 'no_executable_children'
     * @param {string} [nodeId]
     * @param {string} [message] - Custom message; defaults to the generic one.
     */
    addWarning(
        nodeType,
        nodeLabel,
        index,
        status = null,
        reason = null,
        nodeId = null,
        message = null,
    ) {
        const fwName = this.framework
            ? this.framework.charAt(0).toUpperCase() + this.framework.slice(1)
            : 'Playwright';
        this.warnings.push({
            nodeType,
            nodeLabel: nodeLabel || nodeType,
            nodeId,
            index,
            status,
            reason,
            message:
                message ||
                (this.isEn
                    ? `Node type "${nodeType}" has no ${fwName} implementation. A placeholder comment was generated.`
                    : `El tipo de nodo "${nodeType}" no tiene implementación ${fwName}. Se generó un comentario placeholder.`),
        });
    }

    /**
     * Guard for a composite/component node with no children to generate.
     * Emits an explanatory comment plus a structured warning with a resolution
     * status/reason, so the "empty container block" is never silent.
     * @param {object} step - The container node.
     * @param {string} label
     * @param {number} index
     * @param {string} indent
     * @param {string} commentChar - '//' or '#'.
     * @returns {string} The comment to emit in place of the empty block.
     */
    warnUnresolvedComponent(step, label, index, indent, commentChar) {
        const flowId = step.data?.configuration?.flowId || step.data?.flowId;
        const resolution = step.data?.flowResolution;
        let status = 'ignored';
        let reason = 'no_executable_children';
        if (flowId) {
            status = 'unresolved';
            reason = resolution?.reason || 'no_project_context';
        }
        const nodeId = step.id || step.nodeId || '';
        const nodeIdComment = nodeId ? `${commentChar} [node_id: ${nodeId}]` : '';
        const message = this.isEn
            ? `Component "${label}" could not be resolved (${reason}). Skipped.`
            : `Componente "${label}" no pudo resolverse (${reason}). Omitido.`;
        this.addWarning('component', label, index, status, reason, nodeId, message);
        return `${indent}${nodeIdComment ? nodeIdComment + '\n' + indent : ''}${commentChar} ⚠️ ${message}`;
    }

    /**
     * Generates code for a single node.
     * @param {object} step
     * @param {number} index
     * @param {number} depth
     */
    generateNodeCode(_step, _index, _depth) {
        throw new Error('generateNodeCode not implemented');
    }
}
