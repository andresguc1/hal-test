// schemas/for_each/body.js
import Joi from 'joi';

export default Joi.object({
    // --- Source Collection ---
    source: Joi.alternatives()
        .try(Joi.array(), Joi.string().allow('', null))
        .required()
        .description('Collection to iterate: static array or variable reference (e.g. {{myList}})'),

    // --- Execution Mode ---
    executionMode: Joi.string()
        .valid('sequential', 'parallel', 'random', 'single')
        .default('sequential')
        .description(
            'How items are processed: sequential (safe), parallel (fast), random, or single',
        ),

    // --- Concurrency (parallel only) ---
    maxConcurrency: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(3)
        .description('Max parallel workers (parallel mode only)'),

    // --- Variable Aliases ---
    itemAlias: Joi.string().default('item').description('Variable name to expose current item as'),
    indexAlias: Joi.string()
        .default('index')
        .description('Variable name to expose current index as'),

    // --- Error Handling ---
    stopOnError: Joi.boolean().default(true).description('Stop iteration on first error'),
    collectResults: Joi.boolean().default(true).description('Collect output from each iteration'),

    // --- Safety ---
    maxItems: Joi.number()
        .integer()
        .min(1)
        .max(10000)
        .default(1000)
        .description('Safety cap on collection size'),

    // --- Timing ---
    delayBetweenIterations: Joi.number()
        .integer()
        .min(0)
        .max(60000)
        .default(0)
        .description('Delay in ms between sequential iterations (rate-limiting, anti-detection)'),
    executionTimeout: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .description('Total timeout for the entire ForEach execution (0 = no limit)'),

    // --- Random mode options ---
    randomMode: Joi.string()
        .valid('single', 'shuffle')
        .default('shuffle')
        .description('Random sub-mode: pick one random item, or shuffle all items'),
    randomSeed: Joi.number()
        .optional()
        .description('Optional seed for deterministic random ordering'),

    // --- Single mode options ---
    singleIndex: Joi.number()
        .integer()
        .min(0)
        .optional()
        .description('Specific item index to execute (single mode)'),
    singleMatch: Joi.string()
        .allow('', null)
        .optional()
        .description('JS expression to match a single item (single mode)'),

    // --- Composition ---
    flowId: Joi.string()
        .optional()
        .allow('', null)
        .description('Encapsulated sub-flow ID (external backing flow)'),

    // --- Retry Policy (future-ready) ---
    retryPolicy: Joi.object({
        maxRetries: Joi.number().integer().min(0).max(10).default(0),
        retryDelay: Joi.number().integer().min(0).default(1000),
    }).optional(),
});
