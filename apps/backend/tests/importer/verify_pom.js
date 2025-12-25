import { ImportService } from '../../services/importer/index.js';
import { ProjectScanner } from '../../services/importer/project/ProjectScanner.js';
import { ProjectIndexer } from '../../services/importer/project/ProjectIndexer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleProjectPath = path.join(__dirname, 'sample_pom_project');

console.log('--- Testing POM Support ---');
console.log('[DEBUG] Project path:', sampleProjectPath);

// Step 1: Scan project (all files for indexing)
const scanner = new ProjectScanner();
const files = scanner.scan(sampleProjectPath, true);
console.log(`\n[Step 1] Found ${files.length} files`);
files.forEach((f) => console.log(`  - ${path.basename(f.path)}`));

// Step 2: Index project
const indexer = new ProjectIndexer();
const projectIndex = indexer.indexFiles(files);
console.log(`\n[Step 2] Indexed project`);
console.log(`  Classes: ${Object.keys(projectIndex.classes).length}`);
console.log(`  Functions: ${Object.keys(projectIndex.functions).length}`);

// Show indexed classes
console.log('\n[Index] Classes found:');
for (const [className, classInfo] of Object.entries(projectIndex.classes)) {
    console.log(`  ${className} (${path.basename(classInfo.file)})`);
    console.log(`    Methods: ${Object.keys(classInfo.methods).join(', ')}`);
}

// Step 3: Convert with POM support (this will be implemented in next phase)
console.log('\n[Step 3] Scanning for test files...');
const testFiles = scanner.scan(sampleProjectPath, false);
console.log(`Found ${testFiles.length} test files`);

if (testFiles.length > 0) {
    const testFile = testFiles[0];
    const fs = await import('fs');
    const content = fs.readFileSync(testFile.path, 'utf-8');

    console.log('\n[Step 4] Converting test (without POM expansion for now)...');
    const importService = new ImportService();
    const result = importService.convert(content, testFile.framework);

    console.log('\nConversion result (without POM expansion):');
    console.log(`  Success: ${result.success}`);
    console.log(`  Flows: ${result.flows?.length || 0}`);

    if (result.flows && result.flows.length > 0) {
        console.log('\nGenerated flow:');
        result.flows[0].flow.forEach((action, i) => {
            console.log(`  ${i + 1}. ${action.action}`);
        });
    }
}

console.log('\n--- POM Indexing Complete ---');
console.log('Next step: Integrate ReferenceResolver into mappers to expand POM calls');
