#!/usr/bin/env node

/**
 * Automated Rollback Script
 * Handles application and database rollback based on health checks
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const { RenderClient } = require('./render-client.js');
const { createBackup, listBackups, restoreBackup } = require('./db-backup.js');

class RollbackManager {
  constructor(options = {}) {
    this.renderApiKey = options.renderApiKey || process.env.RENDER_API_KEY;
    this.renderClient = this.renderApiKey ? new RenderClient(this.renderApiKey) : null;
    this.productionServiceId = options.productionServiceId || process.env.RENDER_PRODUCTION_SERVICE_ID;
    this.stagingServiceId = options.stagingServiceId || process.env.RENDER_STAGING_SERVICE_ID;
    this.dryRun = options.dryRun || false;
  }

  async checkProductionHealth() {
    const urls = [
      'https://haltest.com/api/status',
      'https://haltest.com/app/',
      'https://haltest.com/',
    ];

    const results = [];
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        results.push({
          url,
          status: response.status,
          healthy: response.status === 200,
        });
      } catch (error) {
        results.push({
          url,
          status: 0,
          healthy: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async evaluateHealth(results) {
    const failed = results.filter(r => !r.healthy);
    const criticalFailed = failed.filter(r => 
      r.url.includes('/api/status') || r.url.includes('/app/')
    );
    
    return {
      healthy: failed.length === 0,
      criticalFailure: criticalFailed.length > 0,
      totalChecks: results.length,
      failedChecks: failed.length,
      details: results,
    };
  }

  async triggerAppRollback() {
    if (!this.renderClient || !this.productionServiceId) {
      throw new Error('Render client not configured');
    }

    console.log('🔄 Triggering application rollback via Render API...');
    
    // Get previous successful deploy
    const previousDeploy = await this.renderClient.getPreviousSuccessfulDeploy(
      this.productionServiceId
    );

    if (!previousDeploy) {
      throw new Error('No previous successful deploy found for rollback');
    }

    console.log(`   Rolling back to deploy: ${previousDeploy.id} (${previousDeploy.createdAt})`);
    
    if (!this.dryRun) {
      await this.renderClient.rollbackDeploy(this.productionServiceId, previousDeploy.id);
      console.log('   ✅ Rollback triggered');
      
      // Wait for rollback to complete
      await this.renderClient.waitForDeploy(
        this.productionServiceId,
        previousDeploy.id,
        300000 // 5 minutes
      );
      console.log('   ✅ Rollback completed');
    } else {
      console.log('   (DRY RUN - rollback not actually triggered)');
    }

    return previousDeploy;
  }

  async triggerDatabaseRollback(backupName) {
    console.log(`🗄️  Triggering database rollback to: ${backupName}`);
    
    if (!this.dryRun) {
      await restoreBackup(backupName);
      console.log('   ✅ Database restored');
    } else {
      console.log('   (DRY RUN - database not actually restored)');
    }
  }

  async runFullRollback(backupName) {
    console.log('\n🚨 INITIATING FULL ROLLBACK\n');
    console.log('================================');

    // 1. Application rollback
    console.log('\n1️⃣  Application Rollback');
    const previousDeploy = await this.triggerAppRollback();

    // 2. Database rollback (if backup provided)
    if (backupName) {
      console.log('\n2️⃣  Database Rollback');
      await this.triggerDatabaseRollback(backupName);
    } else {
      console.log('\n2️⃣  Database Rollback - SKIPPED (no backup specified)');
      console.log('   ⚠️  Database schema may be incompatible with rolled-back app');
    }

    // 3. Verify health after rollback
    console.log('\n3️⃣  Post-Rollback Health Check');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for app to stabilize
    
    const healthResults = await this.checkProductionHealth();
    const evaluation = await this.evaluateHealth(healthResults);
    
    console.log('\n   Health Check Results:');
    healthResults.forEach(r => {
      console.log(`   ${r.healthy ? '✅' : '❌'} ${r.url} (${r.status})`);
    });

    if (!evaluation.healthy) {
      console.log('\n❌ ROLLBACK VERIFICATION FAILED');
      console.log('   Manual intervention required');
      process.exit(1);
    }

    console.log('\n✅ ROLLBACK COMPLETED SUCCESSFULLY');
    console.log(`   Rolled back to deploy: ${previousDeploy.id}`);
    if (backupName) console.log(`   Database restored from: ${backupName}`);
    
    return {
      success: true,
      previousDeploy,
      backupName,
    };
  }

  async autoRollbackOnFailure() {
    console.log('🔍 Running automated health check for rollback decision...\n');
    
    const healthResults = await this.checkProductionHealth();
    const evaluation = await this.evaluateHealth(healthResults);
    
    console.log('Health Check Results:');
    healthResults.forEach(r => {
      console.log(`   ${r.healthy ? '✅' : '❌'} ${r.url} (${r.status})`);
    });
    
    if (evaluation.criticalFailure) {
      console.log('\n🚨 CRITICAL FAILURE DETECTED - Initiating auto-rollback');
      
      // Find latest backup
      const backups = await listBackups();
      const latestBackup = backups[0]?.name;
      
      if (latestBackup) {
        console.log(`\n📦 Using latest backup: ${latestBackup}`);
        return this.runFullRollback(latestBackup);
      } else {
        console.log('\n⚠️  No database backup available - rolling back app only');
        return this.runFullRollback();
      }
    } else if (!evaluation.healthy) {
      console.log('\n⚠️  Non-critical failures detected - alerting but not rolling back');
      return { success: true, rollbackTriggered: false };
    } else {
      console.log('\n✅ All systems healthy - no rollback needed');
      return { success: true, rollbackTriggered: false };
    }
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg = process.argv[3];

  const manager = new RollbackManager({
    dryRun: process.env.DRY_RUN === 'true',
  });

  switch (command) {
    case 'check':
      manager.autoRollbackOnFailure()
        .then(() => process.exit(0))
        .catch(e => { console.error(e); process.exit(1); });
      break;
    case 'rollback':
      manager.runFullRollback(arg)
        .then(() => process.exit(0))
        .catch(e => { console.error(e); process.exit(1); });
      break;
    case 'app-rollback':
      manager.triggerAppRollback()
        .then(() => process.exit(0))
        .catch(e => { console.error(e); process.exit(1); });
      break;
    case 'db-rollback':
      if (!arg) {
        console.error('Usage: node rollback.js db-rollback <backup-name>');
        process.exit(1);
      }
      manager.triggerDatabaseRollback(arg)
        .then(() => process.exit(0))
        .catch(e => { console.error(e); process.exit(1); });
      break;
    case 'health':
      manager.checkProductionHealth()
        .then(results => {
          console.log('Health Check Results:');
          results.forEach(r => console.log(`   ${r.healthy ? '✅' : '❌'} ${r.url} (${r.status})`));
          process.exit(0);
        })
        .catch(e => { console.error(e); process.exit(1); });
      break;
    default:
      console.log('Usage:');
      console.log('  node rollback.js check           - Run health check and auto-rollback if needed');
      console.log('  node rollback.js rollback <backup> - Full rollback (app + db)');
      console.log('  node rollback.js app-rollback    - Rollback app only via Render');
      console.log('  node rollback.js db-rollback <backup> - Restore database from backup');
      console.log('  node rollback.js health          - Check production health');
      console.log('\nEnvironment variables:');
      console.log('  RENDER_API_KEY                   - Render API key');
      console.log('  RENDER_PRODUCTION_SERVICE_ID     - Production service ID');
      console.log('  RENDER_STAGING_SERVICE_ID        - Staging service ID');
      console.log('  DRY_RUN=true                     - Simulate without making changes');
      process.exit(1);
  }
}

export { RollbackManager };