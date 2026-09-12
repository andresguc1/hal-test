#!/usr/bin/env node

/**
 * NPM Package Deprecation Utility
 * Handles deprecation of failed npm packages
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { execSync } = require('child_process');

class NPMPackageManager {
  constructor(registryUrl = 'https://registry.npmjs.org') {
    this.registryUrl = registryUrl;
  }

  async getPackageInfo(packageName) {
    try {
      const response = await fetch(`${this.registryUrl}/${packageName}`);
      if (!response.ok) throw new Error(`Package not found: ${packageName}`);
      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch package info: ${error.message}`);
    }
  }

  async getVersions(packageName) {
    const info = await this.getPackageInfo(packageName);
    return Object.keys(info.versions || {});
  }

  async deprecateVersion(packageName, version, message, accessToken) {
    const pkg = `${packageName}@${version}`;
    const cmd = `npm deprecate "${pkg}" "${message}" --registry=${this.registryUrl}`;
    
    if (accessToken) {
      process.env.NODE_AUTH_TOKEN = accessToken;
    }

    try {
      execSync(cmd, { stdio: 'inherit', env: process.env });
      console.log(`✅ Deprecated ${pkg}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to deprecate ${pkg}: ${error.message}`);
    }
  }

  async undeprecateVersion(packageName, version, accessToken) {
    const pkg = `${packageName}@${version}`;
    const cmd = `npm deprecate "${pkg}" "" --registry=${this.registryUrl}`;
    
    if (accessToken) {
      process.env.NODE_AUTH_TOKEN = accessToken;
    }

    try {
      execSync(cmd, { stdio: 'inherit', env: process.env });
      console.log(`✅ Undeprecated ${pkg}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to undeprecate ${pkg}: ${error.message}`);
    }
  }

  async listDeprecatedVersions(packageName) {
    const info = await this.getPackageInfo(packageName);
    const deprecated = [];
    
    for (const [version, data] of Object.entries(info.versions || {})) {
      if (data.deprecated) {
        deprecated.push({
          version,
          deprecated: data.deprecated,
          time: data.time ? data.time[version] : null,
        });
      }
    }
    
    return deprecated;
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  const manager = new NPMPackageManager();

  (async () => {
    try {
      switch (command) {
        case 'deprecate':
          if (!arg1 || !arg2) {
            console.error('Usage: node npm-deprecate.js deprecate <package>@<version> "message"');
            process.exit(1);
          }
          const [pkg, version] = arg1.split('@');
          await manager.deprecateVersion(pkg, version, arg2, process.env.NPM_TOKEN);
          break;

        case 'undeprecate':
          if (!arg1) {
            console.error('Usage: node npm-deprecate.js undeprecate <package>@<version>');
            process.exit(1);
          }
          const [pkg2, version2] = arg1.split('@');
          await manager.undeprecateVersion(pkg2, version2, process.env.NPM_TOKEN);
          break;

        case 'list':
          if (!arg1) {
            console.error('Usage: node npm-deprecate.js list <package>');
            process.exit(1);
          }
          const deprecated = await manager.listDeprecatedVersions(arg1);
          console.log(`Deprecated versions for ${arg1}:`);
          deprecated.forEach(d => {
            console.log(`  ${d.version}: ${d.deprecated} (${d.time})`);
          });
          break;

        case 'versions':
          if (!arg1) {
            console.error('Usage: node npm-deprecate.js versions <package>');
            process.exit(1);
          }
          const versions = await manager.getVersions(arg1);
          console.log(`All versions for ${arg1}:`);
          versions.forEach(v => console.log(`  ${v}`));
          break;

        default:
          console.log('Usage:');
          console.log('  node npm-deprecate.js deprecate <package>@<version> "message" - Deprecate a version');
          console.log('  node npm-deprecate.js undeprecate <package>@<version> - Remove deprecation');
          console.log('  node npm-deprecate.js list <package> - List deprecated versions');
          console.log('  node npm-deprecate.js versions <package> - List all versions');
          console.log('\nEnvironment:');
          console.log('  NPM_TOKEN - npm access token (required for deprecate/undeprecate)');
          process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      console.error('❌', error.message);
      process.exit(1);
    }
  })();
}

export { NPMPackageManager };