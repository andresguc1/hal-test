#!/usr/bin/env node

/**
 * Commit Signature Verification
 * Verifies that all commits in a range are GPG signed
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { execSync } = require("child_process");

function verifySignatures() {
  const args = process.argv.slice(2);

  // Default: verify last 50 commits or all commits since last tag
  let commitRange = args[0] || "HEAD~50..HEAD";

  if (args.includes("--all")) {
    // Find the last tag
    try {
      const lastTag = execSync("git describe --tags --abbrev=0", {
        encoding: "utf-8",
      }).trim();
      commitRange = `${lastTag}..HEAD`;
      console.log(`🔍 Verifying signatures from tag ${lastTag} to HEAD`);
    } catch {
      console.log("🔍 No tags found, verifying last 50 commits");
    }
  }

  console.log(`🔐 Verifying commit signatures in range: ${commitRange}\n`);

  try {
    const commits = execSync(
      `git log --pretty=format:"%H" --no-merges ${commitRange}`,
      { encoding: "utf-8" },
    ).trim();

    if (!commits) {
      console.log("No commits to verify");
      return true;
    }

    const commitList = commits.split("\n");
    let unsigned = 0;
    let verified = 0;

    for (const commit of commitList) {
      try {
        execSync(`git verify-commit ${commit}`, { stdio: "ignore" });
        console.log(`✅ ${commit.substring(0, 8)} - Signed`);
        verified++;
      } catch {
        console.log(`❌ ${commit.substring(0, 8)} - UNSIGNED`);
        unsigned++;
      }
    }

    console.log(`\n📊 Results: ${verified} verified, ${unsigned} unsigned`);

    if (unsigned > 0) {
      console.log(
        "\n❌ Found unsigned commits. Please sign all commits with: git commit -S",
      );
      return false;
    }

    console.log("\n✅ All commits are properly signed!");
    return true;
  } catch (error) {
    console.error("❌ Error verifying signatures:", error.message);
    return false;
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = verifySignatures();
  process.exit(success ? 0 : 1);
}

export { verifySignatures };
