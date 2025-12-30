// schemas/call_llm/body.js
import Joi from 'joi';

export default Joi.object({
    prompt: Joi.string().required().description('User prompt sent to the model'),
    system: Joi.string().allow('').description('System instruction (context)'),
    model: Joi.string().default('gpt-4o').description('LLM Model to use'),
    variable: Joi.string().required().description('Variable to store the response text'),
});
