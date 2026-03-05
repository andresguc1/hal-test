import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function copyEnvFile(appPath) {
    const envPath = path.join(rootDir, appPath, '.env');
    const examplePath = fs.existsSync(path.join(rootDir, appPath, '.env-example'))
        ? path.join(rootDir, appPath, '.env-example')
        : path.join(rootDir, appPath, '.env.production.example');

    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(examplePath)) {
            console.log(`Creating ${appPath}/.env from example...`);
            fs.copyFileSync(examplePath, envPath);
        } else {
            console.warn(`No env example found for ${appPath}`);
        }
    } else {
        console.log(`${appPath}/.env already exists.`);
    }
}

async function setup() {
    try {
        console.log('--- Starting HAL-TEST Setup ---');

        // 1. Setup Env files
        console.log('\n[1/3] Setting up environment files...');
        copyEnvFile('apps/backend');
        copyEnvFile('apps/frontend');

        // 2. Initialize Database
        console.log('\n[2/3] Initializing database...');
        try {
            execSync('pnpm --filter @halt-test/backend db:init', { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.error('Failed to initialize database. Make sure dependencies are installed.');
            process.exit(1);
        }

        // 3. Install Playwright Dependencies
        console.log('\n[3/3] Installing Playwright and system dependencies...');
        try {
            // Try to find playwright in the backend's node_modules or globalily via pnpm
            execSync('pnpm --filter @halt-test/backend exec playwright install --with-deps', { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.warn('Playwright installation failed or was partially successful. You might need to run it with sudo.');
        }

        console.log('\n--- Setup Complete! ---');
        console.log('You can now run the project with: pnpm run dev');
    } catch (error) {
        console.error('\nSetup failed:', error);
        process.exit(1);
    }
}

setup();
