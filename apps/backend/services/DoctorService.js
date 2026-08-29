import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_BROWSERS = ['chromium', 'firefox', 'webkit'];

// Minimum Playwright version required per OS to run all three browsers.
// Ubuntu 26.04 (and derivatives) landed official support in Playwright 1.61.0.
const OS_MIN_PLAYWRIGHT = {
    ubuntu2604: '1.61.0',
    ubuntu2404: '1.32.0',
    ubuntu2204: '1.29.0',
    ubuntu2004: '1.17.0',
    debian12: '1.29.0',
    debian11: '1.29.0',
    macos: '1.17.0',
    win32: '1.17.0',
};

class DoctorService {
    constructor() {
        this._cached = null;
    }

    detectOs() {
        const platform = os.platform();
        if (platform !== 'linux') {
            return {
                platform,
                distro: null,
                version: null,
                key: platform,
                hostPlatform: platform === 'darwin' ? 'macos' : platform,
            };
        }

        let distro = null;
        let version = null;
        try {
            const content = fs.readFileSync('/etc/os-release', 'utf8');
            const name = (content.match(/^ID=(.*)$/m) || [])[1];
            const pretty = (content.match(/^VERSION_ID="?([^"\n]+)"?$/m) || [])[1];
            distro = name ? name.replace(/"/g, '') : null;
            version = pretty ? pretty.replace(/"/g, '') : null;
        } catch {
            // Non-problem: not a systemd/os-release based distro
        }

        const family = distro || 'linux';
        const key = version ? `${family}${version.replace(/\./g, '')}` : family.toLowerCase();
        const arch = os.arch() === 'arm64' ? 'arm64' : 'x64';
        return {
            platform,
            distro,
            version,
            key,
            hostPlatform: version ? `${family}${version}-${arch}` : `${family}-${arch}`,
        };
    }

    readPlaywrightVersion() {
        try {
            const pkg = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, '..', 'node_modules', 'playwright', 'package.json'),
                    'utf8',
                ),
            );
            return pkg.version || null;
        } catch {
            return null;
        }
    }

    getBrowserCacheDir() {
        return (
            process.env.PLAYWRIGHT_BROWSERS_PATH ||
            path.join(os.homedir(), '.cache', 'ms-playwright')
        );
    }

    detectInstalledBrowsers() {
        const installed = {};
        try {
            const dir = this.getBrowserCacheDir();
            if (!fs.existsSync(dir)) {
                return { installed: {}, cacheDir: dir };
            }
            const entries = fs.readdirSync(dir);
            for (const browser of REQUIRED_BROWSERS) {
                installed[browser] = entries.some((e) => e.startsWith(`${browser}-`));
            }
            return { installed, cacheDir: dir };
        } catch {
            return { installed: {}, cacheDir: this.getBrowserCacheDir() };
        }
    }

    compareVersions(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
            const va = pa[i] || 0;
            const vb = pb[i] || 0;
            if (va !== vb) return va - vb;
        }
        return 0;
    }

    check() {
        if (this._cached) return this._cached;

        const osInfo = this.detectOs();
        const playwrightVersion = this.readPlaywrightVersion();
        const { installed, cacheDir } = this.detectInstalledBrowsers();

        const minPlaywright =
            OS_MIN_PLAYWRIGHT[osInfo.key] || OS_MIN_PLAYWRIGHT[osInfo.platform] || '1.17.0';
        const versionSupported = playwrightVersion
            ? this.compareVersions(playwrightVersion, minPlaywright) >= 0
            : false;

        const missing = REQUIRED_BROWSERS.filter((b) => !installed[b]);
        const allBrowsersInstalled = missing.length === 0;

        const ok = versionSupported && allBrowsersInstalled;

        const guidance = [];
        if (!allBrowsersInstalled) {
            guidance.push(
                `Faltan binarios de navegador (${missing.join(', ')}). Instáalos con: npx playwright install ${REQUIRED_BROWSERS.join(' ')}`,
            );
        }
        if (playwrightVersion && !versionSupported) {
            guidance.push(
                `La versión de Playwright (${playwrightVersion}) es menor a la mínima requerida para ${osInfo.key} (${minPlaywright}). Actualizá con: pnpm install playwright@latest`,
            );
        }
        if (!allBrowsersInstalled || (playwrightVersion && !versionSupported)) {
            guidance.push(
                'Si faltan dependencias del sistema, ejecutá: sudo npx playwright install-deps',
            );
        }

        this._cached = {
            ok,
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                version: osInfo.version,
                key: osInfo.key,
                hostPlatform: osInfo.hostPlatform,
            },
            playwright: playwrightVersion,
            minPlaywrightForOs: minPlaywright,
            versionSupported,
            browsers: installed,
            cacheDir,
            missing,
            allBrowsersInstalled,
            guidance,
        };
        return this._cached;
    }

    async runStartupCheck() {
        const report = this.check();
        if (report.ok) {
            console.log(
                `[Doctor] ✅ Playwright ${report.playwright} con ${REQUIRED_BROWSERS.filter((b) => report.browsers[b]).join(', ')} listo en ${report.os.key}.`,
            );
            return report;
        }

        console.warn('[Doctor] ⚠️ Compatibilidad de navegadores incompleta:');
        for (const line of report.guidance) {
            console.warn(`  - ${line}`);
        }
        return report;
    }
}

export const doctorService = new DoctorService();
