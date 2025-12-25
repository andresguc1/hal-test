import { importService } from '../../services/importer/index.js';
import * as fs from 'fs';
import * as path from 'path';

const samplePath = path.resolve('./tests/importer/sample_nightwatch.js');
const content = fs.readFileSync(samplePath, 'utf8');

console.log('--- Testing Analysis (Nightwatch) ---');
const analysis = importService.analyze(content);
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.framework === 'nightwatch') {
    console.log('\n--- Testing Conversion (Nightwatch) ---');
    const result = importService.convert(content, 'nightwatch');
    console.log('Conversion Result:', JSON.stringify(result, null, 2));
} else {
    console.error('Framework detection failed or incorrect.');
}
