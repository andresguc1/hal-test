import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, "..");
const MONOREPO_ROOT = path.resolve(CLI_ROOT, "..", "..");
const BACKEND_ROOT = path.join(MONOREPO_ROOT, "apps", "backend");

const DIST_DIR = path.join(CLI_ROOT, "dist");
const DIST_BACKEND = path.join(DIST_DIR, "backend");

// Helper to copy dirs recursively
function copyDirSync(src, dest, ignoreRegex = null) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreRegex && ignoreRegex.test(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, ignoreRegex);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("📦 Starting HalTest Standalone CLI Build...");

// 1. Build monolith (frontend & web) to ensure backend/public is up to date
console.log("   🔨 Building Frontend & Web monolith...");
execSync("pnpm run build:monolith", { cwd: MONOREPO_ROOT, stdio: "inherit" });

// 2. Clean dist directory
console.log("   🧹 Cleaning dist directory...");
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 3. Copy CLI launcher files
console.log("   📄 Copying launcher files...");
copyDirSync(path.join(CLI_ROOT, "bin"), path.join(DIST_DIR, "bin"));
copyDirSync(path.join(CLI_ROOT, "src"), path.join(DIST_DIR, "src"));

// 4. Copy backend directory
console.log("   🏗️  Copying backend directory...");
// Ignore node_modules, .env files, storage files.
const ignorePattern =
  /^(node_modules|\.env.*|storage|tests?|\.git.*|.*\.config\.js|prettier.*|eslint.*)$/;
copyDirSync(BACKEND_ROOT, DIST_BACKEND, ignorePattern);

// Create an empty storage folder for the backend
fs.mkdirSync(path.join(DIST_BACKEND, "storage", "runs"), { recursive: true });

// 5. Generate unified package.json
console.log("   📝 Generating unified package.json...");
const cliPkg = JSON.parse(
  fs.readFileSync(path.join(CLI_ROOT, "package.json"), "utf8"),
);
const backendPkg = JSON.parse(
  fs.readFileSync(path.join(BACKEND_ROOT, "package.json"), "utf8"),
);

// Merge dependencies
const mergedDeps = {
  ...backendPkg.dependencies,
  ...cliPkg.dependencies,
};

// Create the standalone package.json
const distPkg = {
  name: cliPkg.name,
  version: cliPkg.version,
  description: cliPkg.description,
  main: cliPkg.main,
  type: cliPkg.type,
  bin: cliPkg.bin,
  files: ["bin", "src", "backend"],
  scripts: {},
  dependencies: mergedDeps,
  engines: cliPkg.engines,
  private: false,
};

fs.writeFileSync(
  path.join(DIST_DIR, "package.json"),
  JSON.stringify(distPkg, null, 2),
);

// 6. Copy Root README so NPM registry looks good
console.log("   📖 Copying README (if exists)...");
const rootReadme = path.join(MONOREPO_ROOT, "README.md");
if (fs.existsSync(rootReadme)) {
  fs.copyFileSync(rootReadme, path.join(DIST_DIR, "README.md"));
}

console.log("✅ Standalone bundle build complete in apps/cli/dist!");
console.log("   👉 Next: cd apps/cli/dist && npm publish");
