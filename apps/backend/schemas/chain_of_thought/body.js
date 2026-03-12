import Joi from 'joi';

const chainOfThoughtBodySchema = Joi.object({
    browserId: Joi.string().optional(),
    instruction: Joi.string().required(),
    thoughtVariable: Joi.string().default('aiThought'),
    answerVariable: Joi.string().default('aiAnswer'),
    temperature: Joi.number().min(0).max(2).default(0.7),
    maxTokens: Joi.number().integer().min(1).default(2048),
    nodeId: Joi.string().optional(),
}).unknown();

export default chainOfThoughtBodySchema;
