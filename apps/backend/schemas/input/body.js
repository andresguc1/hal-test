// schemas/input/body.js
import { z } from 'zod';

/**
 * Input node schema
 */
const inputBodySchema = z
    .object({
        name: z.string().nullable().optional().describe('Name of the input parameter'),
        defaultValue: z.unknown().optional().describe('Default value if not provided by parent'),
        description: z.string().optional().describe('Description of the parameter'),
    })
    .passthrough()
    .describe('Define an input parameter for a subflow');

export default inputBodySchema;
