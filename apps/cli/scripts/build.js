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

// 4. Generate unified package.json and extract externals for esbuild
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

// 5. Bundle backend using esbuild
console.log("   🏗️  Bundling backend with esbuild...");

// Bundle app.js, marking all dependencies as external
const externalArgs = Object.keys(mergedDeps)
  .map((dep) => `--external:${dep}`)
  .join(" ");
execSync(
  `npx esbuild apps/backend/app.js --bundle --platform=node --target=node20 --format=esm --outfile=apps/cli/dist/backend/app.js ${externalArgs}`,
  { cwd: MONOREPO_ROOT, stdio: "inherit" },
);

// Copy necessary static backend directories
const staticDirs = ["locales", "public", "swagger", "scripts"];
for (const dir of staticDirs) {
  const srcPath = path.join(BACKEND_ROOT, dir);
  if (fs.existsSync(srcPath)) {
    copyDirSync(srcPath, path.join(DIST_BACKEND, dir));
  }
}

// Create an empty storage folder for the backend migration compatibility
fs.mkdirSync(path.join(DIST_BACKEND, "storage", "runs"), { recursive: true });

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
