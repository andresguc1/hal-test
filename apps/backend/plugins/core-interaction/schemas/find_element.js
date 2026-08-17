import Joi from 'joi';

const findElementSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    strategy: Joi.string().valid('css', 'xpath', 'text', 'role', 'label').optional(),
}).unknown(true);

export default findElementSchema;
