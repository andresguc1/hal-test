import Joi from 'joi';

const mouseMoveSchema = Joi.object({
    // Which coordinate space the destination is expressed in.
    //   viewport_absolute  — x/y are CSS px from the viewport top-left (no selector)
    //   element_center     — centre of the located element's bounding box
    //   element_offset     — offsetX/offsetY from the element's top-left corner
    //   away_from_element  — enter the element, then leave its bounding box
    targetMode: Joi.string()
        .valid('viewport_absolute', 'element_center', 'element_offset', 'away_from_element')
        .optional(),

    // Absolute viewport coordinates (CSS px from the viewport top-left).
    x: Joi.number().optional(),
    y: Joi.number().optional(),

    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    offsetX: Joi.number().optional(),
    offsetY: Joi.number().optional(),

    // Which side of the box to leave through for away_from_element.
    exitDirection: Joi.string().valid('up', 'down', 'left', 'right', 'any').optional(),

    // Interpolated mousemove events between the current cursor position and the
    // destination. 1 = single jump, n = n events along the straight line.
    steps: Joi.number().optional(),

    // Pause after arriving, in ms. No per-step pacing exists; see the body schema.
    settleMs: Joi.number().optional(),

    // Report what document.elementFromPoint finds at the destination.
    verifyTarget: Joi.boolean().optional(),

    // Skip actionability checks when hovering to enter the element.
    force: Joi.boolean().optional(),

    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
}).unknown(true);

export default mouseMoveSchema;
