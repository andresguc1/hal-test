import { importService } from '../../services/importer/index.js';
import * as fs from 'fs';
import * as path from 'path';

const samplePath = path.resolve('./tests/importer/sample_cypress.spec.js');
const content = fs.readFileSync(samplePath, 'utf8');

console.log('--- Testing Analysis (Cypress) ---');
const analysis = importService.analyze(content);
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.framework === 'cypress') {
    console.log('\n--- Testing Conversion (Cypress) ---');
    const result = importService.convert(content, 'cypress');
    console.log('Conversion Result:', JSON.stringify(result, null, 2));
} else {
    console.error('Framework detection failed or incorrect.');
}
