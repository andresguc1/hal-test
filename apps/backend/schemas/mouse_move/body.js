// schemas/mouse_move/body.js

import Joi from 'joi';

const TARGET_MODES = ['viewport_absolute', 'element_center', 'element_offset', 'away_from_element'];

const EXIT_DIRECTIONS = ['up', 'down', 'left', 'right', 'any'];

// Modes that position the pointer against a located element.
const SELECTOR_MODES = ['element_center', 'element_offset', 'away_from_element'];

const mouseMoveBodySchema = Joi.object({
    // 1. targetMode — which coordinate space the destination is expressed in.
    targetMode: Joi.string()
        .valid(...TARGET_MODES)
        .default('viewport_absolute')
        .messages({
            'any.only':
                'El modo de destino debe ser: viewport_absolute, element_center, element_offset o away_from_element.',
            'any.required': 'El modo de destino (targetMode) es obligatorio.',
        }),

    // 2. x / y — absolute viewport coordinates (CSS px from the viewport top-left).
    x: Joi.number().integer().min(0).optional().messages({
        'number.base': 'La coordenada x debe ser un número entero.',
        'number.min': 'La coordenada x no puede ser negativa.',
    }),
    y: Joi.number().integer().min(0).optional().messages({
        'number.base': 'La coordenada y debe ser un número entero.',
        'number.min': 'La coordenada y no puede ser negativa.',
    }),

    // 3. selector — required by every element-scoped mode.
    selector: Joi.string().trim().allow('').optional(),

    // 4. offsetX / offsetY — from the element's top-left corner (element_offset only).
    offsetX: Joi.number().integer().optional().messages({
        'number.base': 'El desplazamiento X (offsetX) debe ser un número entero.',
    }),
    offsetY: Joi.number().integer().optional().messages({
        'number.base': 'El desplazamiento Y (offsetY) debe ser un número entero.',
    }),

    // 5. exitDirection — which side of the box to leave through (away_from_element only).
    exitDirection: Joi.string()
        .valid(...EXIT_DIRECTIONS)
        .default('any')
        .messages({
            'any.only': 'La dirección de salida debe ser: up, down, left, right o any.',
        }),

    // 6. steps — interpolated mousemove events between the cursor's current
    //    position and the destination. 1 = single jump.
    //
    //    Each step is a real protocol round-trip, measured at ~16.6ms: 12 steps
    //    (the default) is ~200ms, 100 is ~1.7s, 200 is ~3.3s. The cap is
    //    therefore 200, not 1000 — 1000 steps would silently become a 17-second
    //    node. This cost is Playwright's, not something the handler can avoid.
    steps: Joi.number().integer().min(1).max(200).default(12).messages({
        'number.base': 'El número de pasos (steps) debe ser un número entero.',
        'number.min': 'Los pasos (steps) deben ser al menos 1.',
        'number.max': 'Los pasos (steps) no pueden superar 200 (cada paso cuesta ~16ms).',
    }),

    // 7. settleMs — pause after the pointer arrives, before reporting success.
    //    This is the only pacing knob. There is deliberately no "delay between
    //    steps": Playwright interpolates the whole path inside a single
    //    mouse.move() call and exposes no hook to pause between its internal
    //    steps, and the cursor's starting position is not observable, so
    //    hand-rolled interpolation would drift. Chain two mouse_move nodes with
    //    settleMs to make movement feel slow.
    settleMs: Joi.number().integer().min(0).max(5000).default(0).messages({
        'number.base': 'La espera final (settleMs) debe ser un número entero.',
        'number.min': 'La espera final (settleMs) no puede ser negativa.',
        'number.max': 'La espera final (settleMs) no puede superar 5000ms.',
    }),

    // 9. verifyTarget — report what document.elementFromPoint finds at the destination.
    verifyTarget: Joi.boolean().default(false),

    // 10. force — skip actionability checks when hovering to enter the element.
    force: Joi.boolean().default(false),

    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 0ms.',
    }),

    browserId: Joi.string().allow(null, '').optional(),

    // No .default() here on purpose. ActionExecutor treats an absent
    // takeScreenshot as "capture it" (`opts.takeScreenshot !== false`), and the
    // toolbox checkbox defaults to on. Defaulting to false here would suppress
    // the screenshot for callers that omit the field, contradicting both.
    takeScreenshot: Joi.boolean().optional(),
}).custom((value, helpers) => {
    const mode = value.targetMode;

    // Only enforce what the mode genuinely REQUIRES. Fields that merely
    // don't apply to the current mode are ignored rather than rejected:
    // cleanNodeConfiguration whitelists by key, not by mode, so a node that
    // was once configured as viewport_absolute can legitimately carry a
    // stale x/y after the user switches the mode. Rejecting that would
    // make a valid-looking node fail at runtime.
    if (mode === 'viewport_absolute' && (value.x === undefined || value.y === undefined)) {
        return helpers.message({
            custom: 'El modo viewport_absolute requiere las coordenadas x e y.',
        });
    }

    if (SELECTOR_MODES.includes(mode) && !value.selector) {
        return helpers.message({
            custom: `El modo ${mode} requiere un "selector" para localizar el elemento.`,
        });
    }

    // An offset is only meaningful as a pair; if only one survives, treat
    // the missing axis as 0 rather than failing the run.
    if (mode === 'element_offset' && value.offsetX === undefined && value.offsetY === undefined) {
        return helpers.message({
            custom: 'El modo element_offset requiere offsetX y offsetY.',
        });
    }

    return value;
});

export default mouseMoveBodySchema;
