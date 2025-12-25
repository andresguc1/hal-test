import { importService } from '../../services/importer/index.js';
import * as fs from 'fs';
import * as path from 'path';

const samplePath = path.resolve('./tests/importer/sample_selenium_python.py');
const content = fs.readFileSync(samplePath, 'utf8');

console.log('--- Testing Analysis (Selenium Python) ---');
const analysis = importService.analyze(content);
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.framework === 'selenium_python') {
    console.log('\n--- Testing Conversion (Selenium Python) ---');
    const result = importService.convert(content, 'selenium_python');
    console.log('Conversion Result:', JSON.stringify(result, null, 2));
} else {
    console.error('Framework detection failed or incorrect.');
}
