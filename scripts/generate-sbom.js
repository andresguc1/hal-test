#!/usr/bin/env node

/**
 * SBOM Generator
 * Generates CycloneDX SBOM for all project artifacts
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { fileURLToPath } = require('url');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

async function generateSBOM(packageDir, outputFile, options = {}) {
  const { format = 'json', includeDev = false } = options;
  
  console.log(`📦 Generating SBOM for ${packageDir}...`);
  
  try {
    const args = [
      '--output-format', format.toUpperCase(),
      '--output-file', outputFile,
    ];
    
    if (!includeDev) {
      args.push('--exclude-dev');
    }
    
    console.log(`   Running: npx @cyclonedx/cyclonedx-npm ${args.join(' ')}`);
    
    execSync('npx @cyclonedx/cyclonedx-npm', { 
      cwd: packageDir, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
      args: args,
      timeout: 120000
    });
    
    console.log(`✅ SBOM generated: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate SBOM for ${packageDir}:`, error.message);
    return false;
  }
}

async function generateAllSBOMs() {
  console.log('🚀 Generating SBOMs for all artifacts...\n');
  
  const artifacts = [
    { dir: 'apps/backend', name: 'backend' },
    { dir: 'apps/frontend', name: 'frontend' },
    { dir: 'apps/web', name: 'web' },
    { dir: 'apps/cli', name: 'cli' },
  ];
  
  const outputDir = path.join(ROOT_DIR, 'sbom-output');
  fs.mkdirSync(outputDir, { recursive: true });
  
  const results = [];
  
  for (const artifact of artifacts) {
    const packageDir = path.join(ROOT_DIR, artifact.dir);
    const outputFile = path.join(outputDir, `sbom-${artifact.name}.json`);
    
    if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
      console.log(`⚠️  Skipping ${artifact.name} - no package.json`);
      continue;
    }
    
    const success = await generateSBOM(packageDir, outputFile);
    results.push({ name: artifact.name, success, outputFile });
  }
  
  // Also generate root SBOM
  console.log('\n📦 Generating root SBOM...');
  const rootOutput = path.join(outputDir, 'sbom-root.json');
  const rootSuccess = await generateSBOM(ROOT_DIR, rootOutput);
  results.push({ name: 'root', success: rootSuccess, outputFile: rootOutput });
  
  // Summary
  console.log('\n📊 SBOM Generation Summary:');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}: ${r.success ? r.outputFile : 'FAILED'}`);
  });
  
  const failed = results.filter(r => !r.success).length;
  if (failed > 0) {
    console.log(`\n❌ ${failed} SBOM(s) failed to generate`);
    process.exit(1);
  }
  
  console.log('\n✅ All SBOMs generated successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'all') {
    generateAllSBOMs().catch(e => { console.error(e); process.exit(1); });
  } else if (command === 'single') {
    const dir = process.argv[3];
    const output = process.argv[4];
    if (!dir || !output) {
      console.error('Usage: node generate-sbom.js single <dir> <output>');
      process.exit(1);
    }
    generateSBOM(dir, output).then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    console.log('Usage:');
    console.log('  node generate-sbom.js all                    - Generate SBOMs for all artifacts');
    console.log('  node generate-sbom.js single <dir> <output>  - Generate SBOM for single package');
    process.exit(1);
  }
}

export { generateSBOM, generateAllSBOMs };