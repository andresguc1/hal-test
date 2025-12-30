// schemas/flow_control/body.js
import Joi from 'joi';

export default Joi.object({
    action: Joi.string()
        .valid('break', 'continue', 'return')
        .required()
        .description(
            'Flow control action: break (exit loop), continue (next iteration), return (exit flow)',
        ),

    returnValue: Joi.when('action', {
        is: 'return',
        then: Joi.any(),
        otherwise: Joi.forbidden(),
    }).description('Value to return (only for return action)'),
});
