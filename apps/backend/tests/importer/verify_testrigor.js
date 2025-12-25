import { ImportService } from '../../services/importer/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const samplePath = path.join(__dirname, 'sample_testrigor.txt');
const fileContent = fs.readFileSync(samplePath, 'utf-8');

const importService = new ImportService();

console.log('--- Testing Analysis (testRigor) ---');
console.log('[DEBUG] Content preview:', fileContent.substring(0, 100).replace(/\n/g, '\\n'));

const analysis = importService.analyze(fileContent, 'sample_testrigor.txt');
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.detected && analysis.framework === 'testrigor') {
    console.log('\n--- Testing Conversion (testRigor) ---');
    const conversion = importService.convert(fileContent, 'testrigor');
    console.log('Conversion Result:', JSON.stringify(conversion, null, 2));
} else {
    console.error('FAILED: Framework not detected correctly.');
}
