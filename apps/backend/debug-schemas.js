import swaggerSpec from './swagger/swaggerConfig.js';

console.log('--- COMPONENT KEYS DEBUG ---');
if (swaggerSpec.components && swaggerSpec.components.schemas) {
    const keys = Object.keys(swaggerSpec.components.schemas);
    console.log('Registered Schemas:', keys);

    // Check for undefined schemas (where conversion might have failed)
    keys.forEach((key) => {
        if (!swaggerSpec.components.schemas[key]) {
            console.error(`ERROR: Schema ${key} is undefined/null!`);
        }
    });

    // Check specific one
    console.log(
        'LaunchBrowserBodySchema:',
        JSON.stringify(swaggerSpec.components.schemas.LaunchBrowserBodySchema, null, 2),
    );
} else {
    console.error('ERROR: components.schemas is missing from spec!');
}
console.log('--- END DEBUG ---');
