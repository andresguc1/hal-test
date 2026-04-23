import Joi from 'joi';
import conditionalSchema from '../schemas/conditional/body.js';

const testPayload = {
    branches: [
        {
            id: 'success',
            label: 'Success',
            expression: {
                left: '{{login.success}}',
                operator: '==',
                right: 'true',
            },
        },
    ],
    fallbackPath: 'fail',
};

const { error, value } = conditionalSchema.validate(testPayload);

if (error) {
    console.error('❌ Validation Failed:');
    console.error(JSON.stringify(error.details, null, 2));
} else {
    console.log('✅ Validation Succeeded!');
    console.log(JSON.stringify(value, null, 2));
}
