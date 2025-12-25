import Joi from 'joi';

const interactionBodySchema = Joi.object({
    action: Joi.string().optional(),
}).unknown(true); // Permitir cualquier otra propiedad (selector, text, etc.)

export default interactionBodySchema;
