import { ImportService } from '../../services/importer/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleProjectPath = path.join(__dirname, 'sample_project');

const importService = new ImportService();

console.log('--- Testing Bulk Import ---');
console.log('[DEBUG] Scanning directory:', sampleProjectPath);

const result = importService.importDirectory(sampleProjectPath);

console.log('\n--- Import Results ---');
console.log('Total files found:', result.total);
console.log('Successfully imported:', result.success);
console.log('Failed imports:', result.failed);
console.log('Total flows generated:', result.flows.length);

if (result.errors.length > 0) {
    console.log('\n--- Errors ---');
    result.errors.forEach((err) => {
        console.log(`File: ${err.file}`);
        console.log(`Error: ${err.error}`);
    });
}

console.log('\n--- Generated Flows ---');
result.flows.forEach((flow, index) => {
    console.log(`\nFlow ${index + 1}:`);
    console.log('  Name:', flow.meta.name);
    console.log('  Framework:', flow.meta.sourceFramework);
    console.log('  File:', flow.meta.filePath);
    console.log('  Actions:', flow.flow.length);
});
