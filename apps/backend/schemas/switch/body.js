// schemas/switch/body.js
import { z } from 'zod';

/**
 * Switch node schema
 * Evaluates a single variable/expression against multiple discrete cases
 * and routes execution to the matching output path.
 */
const caseSchema = z.object({
    id: z.string().describe('Unique route identifier for this case'),
    value: z
        .union([z.string().nullable(), z.number(), z.boolean()])
        .describe('Value to compare against the evaluated expression'),
    label: z.string().optional().describe('Display label for the UI'),
});

const switchBodySchema = z
    .object({
        variableName: z
            .string()
            .describe(
                'Variable or expression to evaluate. Supports {{variable}} interpolation (e.g. "{{Login Steps.result.status}}")',
            ),
        cases: z
            .union([
                z.array(caseSchema).min(1),
                z.record(z.unknown()).refine((obj) => Object.keys(obj).length > 0, {
                    message: 'At least one case must be defined',
                }),
                z.string().min(1),
            ])
            .describe('Array of case definitions or legacy object/string format'),
        configuration: z
            .record(z.unknown())
            .optional()
            .describe('Frontend configuration wrapper (takes precedence over root-level fields)'),
        scope: z.enum(['flow', 'global']).default('flow'),
    })
    .passthrough()
    .describe('Evaluates a variable against multiple cases and routes to the matching path.');

export default switchBodySchema;
