// schemas/output/body.js
import { z } from 'zod';

/**
 * Output node schema
 */
const outputBodySchema = z
    .object({
        name: z
            .string()
            .nullable()
            .optional()
            .describe('Name of the output field to return to parent'),
        value: z.unknown().optional().describe('Value to return (supports variable interpolation)'),
    })
    .passthrough()
    .describe('Define an output value for a subflow');

export default outputBodySchema;
