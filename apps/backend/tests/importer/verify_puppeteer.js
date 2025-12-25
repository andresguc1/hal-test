import { importService } from '../../services/importer/index.js';
import * as fs from 'fs';
import * as path from 'path';

const samplePath = path.resolve('./tests/importer/sample_puppeteer.js');
const content = fs.readFileSync(samplePath, 'utf8');

console.log('--- Testing Analysis (Puppeteer) ---');
const analysis = importService.analyze(content);
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.framework === 'puppeteer') {
    console.log('\n--- Testing Conversion (Puppeteer) ---');
    const result = importService.convert(content, 'puppeteer');
    console.log('Conversion Result:', JSON.stringify(result, null, 2));
} else {
    console.error('Framework detection failed or incorrect.');
}
