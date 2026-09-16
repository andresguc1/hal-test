import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

function getGitInfo() {
  try {
    const commit = execSync("git rev-parse HEAD", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
    }).trim();
    const shortCommit = execSync("git rev-parse --short HEAD", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
    }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
    }).trim();
    const tag = execSync(
      'git describe --tags --exact-match 2>/dev/null || echo ""',
      { cwd: ROOT_DIR, encoding: "utf-8" },
    ).trim();
    const isDirty =
      execSync("git status --porcelain", {
        cwd: ROOT_DIR,
        encoding: "utf-8",
      }).trim() !== "";
    const commitDate = execSync("git log -1 --format=%cI", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
    }).trim();

    return {
      commit,
      shortCommit,
      branch,
      tag: tag || null,
      isDirty,
      commitDate,
    };
  } catch (e) {
    return {
      commit: "unknown",
      shortCommit: "unknown",
      branch: "unknown",
      tag: null,
      isDirty: false,
      commitDate: new Date().toISOString(),
    };
  }
}

function getPackageVersions() {
  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf-8"),
  );
  const cliPkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT_DIR, "apps", "cli", "package.json"),
      "utf-8",
    ),
  );
  const frontendPkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT_DIR, "apps", "frontend", "package.json"),
      "utf-8",
    ),
  );
  const webPkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT_DIR, "apps", "web", "package.json"),
      "utf-8",
    ),
  );
  const backendPkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT_DIR, "apps", "backend", "package.json"),
      "utf-8",
    ),
  );

  return {
    root: rootPkg.version,
    cli: cliPkg.version,
    frontend: frontendPkg.version,
    web: webPkg.version,
    backend: backendPkg.version,
  };
}

function generateMetadata() {
  const git = getGitInfo();
  const versions = getPackageVersions();
  const buildId = process.env.BUILD_ID || `local-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const metadata = {
    version: versions.cli,
    versions,
    git,
    buildId,
    timestamp,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  return metadata;
}

function writeMetadata(outputDir, metadata) {
  const outputPath = path.join(outputDir, "RELEASE_METADATA.json");
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`✅ Release metadata written to ${outputPath}`);
  console.log(JSON.stringify(metadata, null, 2));
  return outputPath;
}

function injectIntoBackend(metadata) {
  const backendPublicDir = path.join(ROOT_DIR, "apps", "backend", "public");
  if (fs.existsSync(backendPublicDir)) {
    const outputPath = path.join(backendPublicDir, "RELEASE_METADATA.json");
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(
      `✅ Release metadata copied to backend/public for runtime access`,
    );
  }
}

function injectIntoCliDist(metadata) {
  const cliDistDir = path.join(ROOT_DIR, "apps", "cli", "dist");
  if (fs.existsSync(cliDistDir)) {
    const outputPath = path.join(cliDistDir, "RELEASE_METADATA.json");
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`✅ Release metadata copied to cli/dist for npm package`);
  }
}

function injectIntoCliRoot(metadata) {
  const cliRootDir = path.join(ROOT_DIR, "apps", "cli");
  const outputPath = path.join(cliRootDir, "RELEASE_METADATA.json");
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`✅ Release metadata copied to cli/root for dev mode`);
}

const metadata = generateMetadata();
const outputDir = process.argv[2] || path.join(ROOT_DIR, "release-artifacts");
fs.mkdirSync(outputDir, { recursive: true });
writeMetadata(outputDir, metadata);
injectIntoBackend(metadata);
injectIntoCliDist(metadata);
injectIntoCliRoot(metadata);

export { generateMetadata, writeMetadata };
