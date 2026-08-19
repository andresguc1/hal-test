import { OpenUrlMapper } from '../nodes/OpenUrlMapper.js';
import { BrowserActionMapper } from '../nodes/BrowserActionMapper.js';
import { InteractionMapper } from '../nodes/InteractionMapper.js';
import { WaitMapper } from '../nodes/WaitMapper.js';
import { UtilityMapper } from '../nodes/UtilityMapper.js';
import { NavigationMapper } from '../nodes/NavigationMapper.js';
import { FormMapper } from '../nodes/FormMapper.js';
import { FillFormMapper } from '../nodes/FillFormMapper.js';
import { AssertionMapper } from '../nodes/AssertionMapper.js';
import { NetworkMapper } from '../nodes/NetworkMapper.js';
import { DOMMapper } from '../nodes/DOMMapper.js';
import { FileMapper } from '../nodes/FileMapper.js';
import { SessionMapper } from '../nodes/SessionMapper.js';
import { FlowControlMapper } from '../nodes/FlowControlMapper.js';
import { CompositionMapper } from '../nodes/CompositionMapper.js';
import { AiMapper } from '../nodes/AiMapper.js';
import { CliMapper } from '../nodes/CliMapper.js';

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

    /**
     * Returns all registered node types.
     */
    static getRegisteredTypes() {
        return Array.from(this.mappers.keys());
    }
}

// ── Core Mappers ──
NodeMapperRegistry.register(OpenUrlMapper);
NodeMapperRegistry.register(BrowserActionMapper);
NodeMapperRegistry.register(InteractionMapper);
NodeMapperRegistry.register(WaitMapper);
NodeMapperRegistry.register(UtilityMapper);

// ── Extended Mappers ──
NodeMapperRegistry.register(NavigationMapper);
NodeMapperRegistry.register(FormMapper);
NodeMapperRegistry.register(FillFormMapper);
NodeMapperRegistry.register(AssertionMapper);
NodeMapperRegistry.register(NetworkMapper);
NodeMapperRegistry.register(DOMMapper);
NodeMapperRegistry.register(FileMapper);
NodeMapperRegistry.register(SessionMapper);
NodeMapperRegistry.register(FlowControlMapper);
NodeMapperRegistry.register(CompositionMapper);
NodeMapperRegistry.register(AiMapper);
NodeMapperRegistry.register(CliMapper);
