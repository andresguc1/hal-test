import Joi from 'joi';

const extractDomContextBodySchema = Joi.object({
    browserId: Joi.string().required(),
    selector: Joi.string().allow('', null).optional(),
    extractionType: Joi.string().valid('text', 'html', 'markdown').default('text'),
    variableName: Joi.string().default('domContext'),
    nodeId: Joi.string().optional(),
}).unknown();

export default extractDomContextBodySchema;
