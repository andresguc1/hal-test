import { ImportService } from '../../services/importer/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const samplePath = path.join(__dirname, 'sample_katalon.groovy');
const fileContent = fs.readFileSync(samplePath, 'utf-8');

const importService = new ImportService();

console.log('--- Testing Analysis (Katalon) ---');
console.log('[DEBUG] Content preview:', fileContent.substring(0, 100).replace(/\n/g, '\\n'));

const analysis = importService.analyze(fileContent, 'sample_katalon.groovy');
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.detected && analysis.framework === 'katalon') {
    console.log('\n--- Testing Conversion (Katalon) ---');
    const conversion = importService.convert(fileContent, 'katalon');
    console.log('Conversion Result:', JSON.stringify(conversion, null, 2));
} else {
    console.error('FAILED: Framework not detected correctly.');
}
