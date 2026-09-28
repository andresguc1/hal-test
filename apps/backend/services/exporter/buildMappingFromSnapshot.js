import crypto from 'crypto';
import { flowResolver } from '../../core/FlowResolver.js';
import { PlaywrightGenerator } from './generators/PlaywrightGenerator.js';
import { CypressGenerator } from './generators/CypressGenerator.js';
import { SeleniumGenerator } from './generators/SeleniumGenerator.js';

/**
 * Build mappingByFile + generationKey from a run's flow_snapshot.
 * Reuses the same generation pipeline but without lint/validation overhead.
 *
 * @param {object} params
 * @param {object} params.flowSnapshot - { nodes, edges } from Run.flow_snapshot
 * @param {string} params.projectId - Project ID for resolving sub-flows
 * @param {object} params.options - Generation options (framework, language, etc.)
 * @returns {Promise<{ mappingByFile, generationKey }>}
 */
export async function buildMappingFromSnapshot({ flowSnapshot, projectId, options = {} }) {
    const {
        framework = 'playwright',
        language = 'javascript',
        locale = 'es',
        usePOM = false,
        includeCICD = false,
        designPattern = 'flat',
    } = options;

    // Parse and validate snapshot
    let snapshot;
    if (typeof flowSnapshot === 'string') {
        try {
            snapshot = JSON.parse(flowSnapshot);
        } catch {
            throw new Error('Invalid flow_snapshot JSON');
        }
    } else {
        snapshot = flowSnapshot;
    }

    if (!snapshot?.nodes || !Array.isArray(snapshot.nodes)) {
        throw new Error('flow_snapshot must contain nodes array');
    }

    // Resolve sub-flows (populates subNodes on container nodes)
    const resolvedNodes = await flowResolver.resolve(snapshot.nodes, projectId);

    // Build generationKey (same as exportService.generateCode)
    const inputSnapshot = JSON.stringify({
        flow: resolvedNodes,
        framework,
        language,
        locale,
        usePOM,
        includeCICD,
        designPattern,
    });
    const generationKey = `sha256:${crypto
        .createHash('sha256')
        .update(inputSnapshot)
        .digest('hex')}`;

    // Select generator
    let generator;
    switch (framework.toLowerCase()) {
        case 'playwright':
            generator = new PlaywrightGenerator(
                language,
                locale,
                usePOM,
                includeCICD,
                designPattern,
            );
            break;
        case 'cypress':
            generator = new CypressGenerator(language, locale);
            break;
        case 'selenium':
            generator = new SeleniumGenerator(language, locale);
            break;
        default:
            throw new Error(`Unsupported framework: ${framework}`);
    }

    // Generate (produces mappingByFile)
    const result = generator.generate(resolvedNodes);

    return {
        mappingByFile: result.mappingByFile || null,
        generationKey,
    };
}
