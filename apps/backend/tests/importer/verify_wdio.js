import { importService } from '../../services/importer/index.js';
import * as fs from 'fs';
import * as path from 'path';

const samplePath = path.resolve('./tests/importer/sample_wdio.js');
const content = fs.readFileSync(samplePath, 'utf8');

console.log('--- Testing Analysis (WebdriverIO) ---');
const analysis = importService.analyze(content);
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.framework === 'webdriverio') {
    console.log('\n--- Testing Conversion (WebdriverIO) ---');
    const result = importService.convert(content, 'webdriverio');
    console.log('Conversion Result:', JSON.stringify(result, null, 2));
} else {
    console.error('Framework detection failed or incorrect.');
}
