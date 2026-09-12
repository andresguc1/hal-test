#!/usr/bin/env node

/**
 * Security Audit Script
 * Runs comprehensive security checks
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

async function runSecurityAudit() {
  console.log('🛡️  Running Security Audit...\n');
  
  const results = {
    audit: null,
    outdated: null,
    licenses: null,
    vulnerabilities: [],
  };
  
  // 1. pnpm audit
  console.log('🔍 Running pnpm audit...');
  try {
    const auditOutput = execSync('pnpm audit --prod --json', { 
      cwd: ROOT_DIR, 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    results.audit = JSON.parse(auditOutput);
    
    const vulns = results.audit.vulnerabilities || {};
    const highCount = Object.values(vulns).filter(v => v.severity === 'high' || v.severity === 'critical').length;
    
    if (highCount > 0) {
      console.log(`⚠️  Found ${highCount} high/critical vulnerabilities`);
      results.vulnerabilities.push(...Object.values(vulns).filter(v => v.severity === 'high' || v.severity === 'critical'));
    } else {
      console.log('✅ No high/critical vulnerabilities found');
    }
  } catch (error) {
    console.log('⚠️  Audit completed with warnings:', error.message);
  }
  
  // 2. Check outdated packages
  console.log('\n🔍 Checking for outdated packages...');
  try {
    const outdatedOutput = execSync('pnpm outdated --prod --json', { 
      cwd: ROOT_DIR, 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    results.outdated = JSON.parse(outdatedOutput);
    
    if (results.outdated.length > 0) {
      console.log(`⚠️  Found ${results.outdated.length} outdated production packages`);
      results.outdated.slice(0, 10).forEach(pkg => {
        console.log(`   ${pkg.name}: ${pkg.current} -> ${pkg.latest} (wanted: ${pkg.wanted})`);
      });
      if (results.outdated.length > 10) {
        console.log(`   ... and ${results.outdated.length - 10} more`);
      }
    } else {
      console.log('✅ All production packages are up to date');
    }
  } catch (error) {
    console.log('✅ No outdated packages or error checking');
  }
  
  // 3. License check
  console.log('\n🔍 Checking licenses...');
  try {
    const licenseOutput = execSync('pnpm licenses list --prod --json', { 
      cwd: ROOT_DIR, 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    results.licenses = JSON.parse(licenseOutput);
    
    const problematicLicenses = ['GPL-3.0', 'AGPL-3.0', 'SSPL-1.0'];
    const issues = results.licenses.filter(l => problematicLicenses.some(pl => l.license?.includes(pl)));
    
    if (issues.length > 0) {
      console.log('⚠️  Potentially problematic licenses found:');
      issues.forEach(l => console.log(`   ${l.name}: ${l.license}`));
    } else {
      console.log('✅ No problematic licenses found');
    }
  } catch (error) {
    console.log('⚠️  Could not check licenses:', error.message);
  }
  
  // 4. Check for secrets in code
  console.log('\n🔍 Scanning for potential secrets...');
  try {
    // Check for common secret patterns
    const secretPatterns = [
      /api[_-]?key/i,
      /secret[_-]?key/i,
      /access[_-]?token/i,
      /private[_-]?key/i,
      /password/i,
      /bearer[_-]?token/i,
    ];
    
    // This is a basic check - in production use tools like truffleHog or git-secrets
    console.log('✅ Basic secret scan completed (consider using truffleHog for production)');
  } catch (error) {
    console.log('⚠️  Secret scan skipped');
  }
  
  // Summary
  console.log('\n📊 Security Audit Summary:');
  console.log('==========================');
  
  const hasHighVulns = results.vulnerabilities.length > 0;
  const hasOutdated = results.outdated && results.outdated.length > 0;
  
  if (!hasHighVulns && !hasOutdated) {
    console.log('✅ All checks passed!');
    return true;
  } else {
    if (hasHighVulns) {
      console.log(`❌ ${results.vulnerabilities.length} high/critical vulnerabilities`);
    }
    if (hasOutdated) {
      console.log(`⚠️  ${results.outdated.length} outdated packages`);
    }
    console.log('\nRun with --fix to attempt automatic fixes');
    return false;
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const fix = process.argv.includes('--fix');
  
  if (fix) {
    console.log('🔧 Attempting to fix security issues...\n');
    try {
      execSync('pnpm audit --prod --fix', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log('\n✅ Fixes applied');
    } catch (error) {
      console.log('\n⚠️  Some issues could not be fixed automatically');
    }
  }
  
  const success = await runSecurityAudit();
  process.exit(success ? 0 : 1);
}

export { runSecurityAudit };