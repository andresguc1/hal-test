import Joi from 'joi';

const selectOptionSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    containerSelector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    selectedOptions: Joi.array().items(Joi.object().unknown(true)).optional(),
    expandMenu: Joi.boolean().optional(),
    selectionCriteria: Joi.string().optional(),
    selectionValue: Joi.alternatives().try(Joi.string(), Joi.number()).optional().allow(''),
    value: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    label: Joi.string().optional(),
}).unknown(true);

export default selectOptionSchema;
