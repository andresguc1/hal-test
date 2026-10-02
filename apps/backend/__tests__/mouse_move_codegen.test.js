import { describe, it, expect } from 'vitest';

import { InteractionMapper } from '../services/exporter/nodes/InteractionMapper.js';

const LANGS = ['javascript', 'typescript', 'python', 'java', 'csharp'];

const gen = (params, lang = 'javascript', framework = 'playwright') =>
    InteractionMapper.getCode(
        { actionType: 'mouse_move', type: 'mouse_move', ...params },
        lang,
        0,
        framework,
    );

describe('InteractionMapper mouse_move', () => {
    it('is registered as a mappable type', () => {
        expect(InteractionMapper.type).toContain('mouse_move');
    });

    it('dispatches instead of falling through to another node', () => {
        // Without an explicit branch, getCode would emit click code.
        expect(gen({ targetMode: 'viewport_absolute', x: 5, y: 6 })).toContain('mouse.move');
        expect(gen({ targetMode: 'viewport_absolute', x: 5, y: 6 })).not.toContain('click');
    });

    it('emits absolute coordinates for viewport_absolute', () => {
        expect(gen({ targetMode: 'viewport_absolute', x: 1200, y: 340 })).toContain(
            'page.mouse.move(1200, 340',
        );
    });

    it('defaults steps to 12 to match the runtime handler', async () => {
        // Fidelity: an exported test must move the pointer the same way the flow
        // did inside HalTest, so the codegen default cannot diverge from the
        // handler's (and the body schema's).
        const { mouseMoveBodySchema } = await import('../schemas/index.js');
        const runtime = mouseMoveBodySchema.validate({ x: 1, y: 1 }).value.steps;
        expect(runtime).toBe(12);
        for (const lang of LANGS) {
            expect(gen({ x: 1, y: 1 }, lang), lang).toContain(`${runtime}`);
        }
        expect(gen({ targetMode: 'away_from_element', selector: '#p' })).toContain('steps: 12');
    });

    it('clamps steps to the same ceiling the body schema enforces', () => {
        expect(gen({ x: 1, y: 1, steps: 5000 })).toContain('steps: 200');
    });

    it('passes steps through for every language', () => {
        expect(gen({ x: 1, y: 2, steps: 7 }, 'javascript')).toContain('steps: 7');
        expect(gen({ x: 1, y: 2, steps: 7 }, 'python')).toContain('steps=7');
        expect(gen({ x: 1, y: 2, steps: 7 }, 'java')).toContain('setSteps(7)');
        expect(gen({ x: 1, y: 2, steps: 7 }, 'csharp')).toContain('Steps = 7');
    });

    describe('generated JavaScript is syntactically valid', () => {
        const cases = {
            'viewport point': { targetMode: 'viewport_absolute', x: 10, y: 20 },
            'element centre': { targetMode: 'element_center', selector: '#b' },
            'element offset': {
                targetMode: 'element_offset',
                selector: '#b',
                offsetX: 3,
                offsetY: 4,
            },
            'away from element': { targetMode: 'away_from_element', selector: '#b' },
            'away, right': {
                targetMode: 'away_from_element',
                selector: '#b',
                exitDirection: 'right',
            },
        };

        for (const [name, params] of Object.entries(cases)) {
            it(name, async () => {
                const { default: vm } = await import('node:vm');
                const code = gen(params, 'javascript');
                expect(() => new vm.Script(`async function f(page){ ${code} }`)).not.toThrow();
            });
        }
    });

    // The whole point of away_from_element is the two-phase enter-then-leave.
    // A single statement cannot reproduce it, so guard against a refactor that
    // collapses the two into one.
    describe('away_from_element two-phase contract', () => {
        for (const lang of LANGS) {
            it(`emits hover then move for ${lang}`, () => {
                const code = gen({ targetMode: 'away_from_element', selector: '#panel' }, lang);
                const hoverIndex = code.search(/hover|Hover/);
                const moveIndex = code.search(/mouse|Mouse/);
                expect(hoverIndex).toBeGreaterThanOrEqual(0);
                expect(moveIndex).toBeGreaterThanOrEqual(0);
                expect(hoverIndex).toBeLessThan(moveIndex);
            });
        }

        it('embeds the selector so the generated test can actually find the element', () => {
            for (const lang of LANGS) {
                const code = gen({ targetMode: 'away_from_element', selector: '#panel' }, lang);
                expect(code).toContain('#panel');
            }
        });

        it('is a syntax error in Python if the two statements are space-joined', () => {
            // Python's hover() has no terminator, so the two statements must be
            // newline-separated. This asserts the join is a newline.
            const code = gen({ targetMode: 'away_from_element', selector: '#p' }, 'python');
            const lines = code
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);
            expect(lines.length).toBeGreaterThanOrEqual(2);
            expect(lines[0]).toContain('hover');
        });
    });

    describe('framework fallbacks are honest about their limits', () => {
        it('warns that Cypress cannot reproduce real pointer input', () => {
            const code = gen(
                { targetMode: 'viewport_absolute', x: 5, y: 6 },
                'javascript',
                'cypress',
            );
            expect(code).toContain('NOTE');
            expect(code).toContain('mousemove');
        });

        it('warns that Selenium has no absolute viewport move', () => {
            const code = gen({ targetMode: 'viewport_absolute', x: 5, y: 6 }, 'python', 'selenium');
            expect(code).toContain('NOTE');
        });
    });
});
