// schemas/clear_all_mocks/body.js

import Joi from 'joi';

const clearAllMocksBodySchema = Joi.object({
    browserId: Joi.any().strip(),
    endpoint: Joi.string().optional().allow(''),
});

export default clearAllMocksBodySchema;
