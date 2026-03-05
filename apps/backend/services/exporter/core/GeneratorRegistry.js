import { OpenUrlMapper } from '../nodes/OpenUrlMapper.js';
import { BrowserActionMapper } from '../nodes/BrowserActionMapper.js';
import { InteractionMapper } from '../nodes/InteractionMapper.js';
import { WaitMapper } from '../nodes/WaitMapper.js';
import { UtilityMapper } from '../nodes/UtilityMapper.js';

/**
 * Registry of node mappers.
 */
export class NodeMapperRegistry {
    static mappers = new Map();

    /**
     * Registers a mapper for specific node types.
     */
    static register(mapper) {
        if (Array.isArray(mapper.type)) {
            mapper.type.forEach((t) => this.mappers.set(t, mapper));
        } else {
            this.mappers.set(mapper.type, mapper);
        }
    }

    /**
     * Gets the mapper for a node type.
     */
    static getMapper(type) {
        return this.mappers.get(type);
    }
}

// Initial registration
NodeMapperRegistry.register(OpenUrlMapper);
NodeMapperRegistry.register(BrowserActionMapper);
NodeMapperRegistry.register(InteractionMapper);
NodeMapperRegistry.register(WaitMapper);
NodeMapperRegistry.register(UtilityMapper);
