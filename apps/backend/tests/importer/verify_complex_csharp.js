import { ImportService } from '../../services/importer/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const samplePath = path.join(__dirname, 'complex_selenium_csharp.cs');
const fileContent = fs.readFileSync(samplePath, 'utf-8');

const importService = new ImportService();

console.log('--- Testing Analysis (Complex Selenium C#) ---');
const analysis = importService.analyze(fileContent, 'complex_selenium_csharp.cs');
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

if (analysis.detected && analysis.framework === 'selenium_csharp') {
    console.log('\n--- Testing Conversion (Complex Selenium C#) ---');
    const conversion = importService.convert(fileContent, 'selenium_csharp');
    console.log('Conversion Result:', JSON.stringify(conversion, null, 2));
} else {
    console.error('FAILED: Framework not detected correctly.');
}
