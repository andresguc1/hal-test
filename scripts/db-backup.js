'use strict';

/**
 * Database Backup Script
 * Creates timestamped backups before migrations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import sequelize from '../apps/backend/database/index.js';
import { STORAGE_DIR } from '../apps/backend/config/paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(STORAGE_DIR, 'backups');

async function createBackup() {
  console.log('📦 Creating database backup...\n');
  
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const isProduction = sequelize.getDialect() === 'postgres';
  
  let backupPath;
  
  if (isProduction) {
    // PostgreSQL backup using pg_dump
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not set for PostgreSQL backup');
    }
    
    backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
    
    console.log(`🐘 Backing up PostgreSQL database...`);
    try {
      execSync(`pg_dump "${databaseUrl}" > "${backupPath}"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`pg_dump failed: ${error.message}`);
    }
  } else {
    // SQLite backup - copy the database file
    const dbPath = path.join(STORAGE_DIR, 'database.sqlite');
    
    if (!fs.existsSync(dbPath)) {
      throw new Error(`SQLite database not found at ${dbPath}`);
    }
    
    backupPath = path.join(BACKUP_DIR, `database.sqlite.${timestamp}.bak`);
    
    console.log(`📁 Backing up SQLite database...`);
    fs.copyFileSync(dbPath, backupPath);
  }
  
  // Verify backup
  const stats = fs.statSync(backupPath);
  console.log(`✅ Backup created: ${backupPath}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Rotate old backups (keep last 10)
  await rotateBackups(10);
  
  return backupPath;
}

async function rotateBackups(keep = 10) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') || f.startsWith('database.sqlite.'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > keep) {
      const toRemove = files.slice(keep);
      for (const file of toRemove) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Removed old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Backup rotation failed:', error.message);
  }
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups found');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') || f.startsWith('database.sqlite.'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        path: path.join(BACKUP_DIR, f),
        size: stats.size,
        created: stats.mtime,
      };
    })
    .sort((a, b) => b.created - a.created);
  
  if (files.length === 0) {
    console.log('No backups found');
    return [];
  }
  
  console.log('\n📋 Available backups:');
  files.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
    console.log(`     Size: ${(f.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`     Created: ${f.created.toISOString()}`);
  });
  
  return files;
}

async function restoreBackup(backupName) {
  console.log(`🔄 Restoring backup: ${backupName}\n`);
  
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupName}`);
  }
  
  const isProduction = sequelize.getDialect() === 'postgres';
  
  if (isProduction) {
    // PostgreSQL restore
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not set for PostgreSQL restore');
    }
    
    console.log(`🐘 Restoring PostgreSQL database...`);
    console.log('⚠️  This will overwrite the current database!');
    
    // Terminate existing connections
    await sequelize.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = current_database()
      AND pid <> pg_backend_pid();
    `);
    
    try {
      execSync(`psql "${databaseUrl}" < "${backupPath}"`, { stdio: 'inherit' });
      console.log('✅ PostgreSQL database restored');
    } catch (error) {
      throw new Error(`psql restore failed: ${error.message}`);
    }
  } else {
    // SQLite restore
    const dbPath = path.join(STORAGE_DIR, 'database.sqlite');
    
    // Close existing connections
    await sequelize.close();
    
    console.log(`📁 Restoring SQLite database...`);
    console.log('⚠️  This will overwrite the current database!');
    
    // Backup current first
    const currentBackup = path.join(BACKUP_DIR, `database.sqlite.pre-restore-${Date.now()}.bak`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackup);
      console.log(`   Current DB backed up to: ${currentBackup}`);
    }
    
    fs.copyFileSync(backupPath, dbPath);
    console.log('✅ SQLite database restored');
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'create':
      createBackup().then(path => { console.log(`\n✅ Backup saved to: ${path}`); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
      break;
    case 'list':
      listBackups().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
      break;
    case 'restore':
      if (!arg) {
        console.error('Usage: node db-backup.js restore <backup-name>');
        process.exit(1);
      }
      restoreBackup(arg).then(() => { console.log('\n✅ Restore completed'); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
      break;
    default:
      console.log('Usage:');
      console.log('  node db-backup.js create      - Create new backup');
      console.log('  node db-backup.js list        - List available backups');
      console.log('  node db-backup.js restore <name> - Restore from backup');
      process.exit(1);
  }
}

export { createBackup, listBackups, restoreBackup, rotateBackups };