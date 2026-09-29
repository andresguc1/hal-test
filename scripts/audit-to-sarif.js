#!/usr/bin/env node

/**
 * Convert a `pnpm audit --json` report into a valid SARIF 2.1.0 file so it can
 * be uploaded with github/codeql-action/upload-sarif.
 *
 * Handles both shapes pnpm can emit:
 *   - npm-legacy report: top-level `advisories` keyed by advisory id
 *   - pnpm map report:   top-level `vulnerabilities` keyed by package name
 *
 * Usage:
 *   node scripts/audit-to-sarif.js <audit-report.json> <output.sarif>
 */

import fs from "fs";

const SEVERITY_LEVEL = {
  critical: "error",
  high: "error",
  moderate: "warning",
  low: "note",
};

function normalize(report) {
  const entries = [];

  if (report.vulnerabilities && typeof report.vulnerabilities === "object") {
    for (const [name, vuln] of Object.entries(report.vulnerabilities)) {
      const via = Array.isArray(vuln.via) ? vuln.via : [];
      for (const advisory of via) {
        if (typeof advisory === "object" && advisory.title) {
          entries.push({
            name,
            range: vuln.range,
            severity: vuln.severity,
            title: advisory.title,
            url: advisory.url,
            advisoryId: advisory.id ?? null,
            paths: Array.isArray(vuln.nodes) ? vuln.nodes.slice(0, 5) : [],
          });
        }
      }
    }
  }

  if (report.advisories && typeof report.advisories === "object") {
    for (const advisory of Object.values(report.advisories)) {
      const paths = Array.isArray(advisory.findings)
        ? advisory.findings.flatMap((f) => f.paths ?? [])
        : [];
      entries.push({
        name: advisory.module_name,
        range: advisory.vulnerable_versions,
        severity: advisory.severity,
        title: advisory.title,
        url: advisory.url,
        advisoryId: advisory.github_advisory_id ?? advisory.id ?? null,
        paths: paths.slice(0, 5),
      });
    }
  }

  return entries;
}

function buildRules(entries) {
  const rules = [];
  const seen = new Set();

  for (const entry of entries) {
    const id = `npm-audit:${entry.name}@${entry.range}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rules.push({
      id,
      name: entry.title,
      shortDescription: { text: entry.title },
      fullDescription: {
        text: `${entry.title} in ${entry.name} (${entry.range})`,
      },
      helpUri: entry.url || undefined,
      help: {
        text: `Affects ${entry.name}${entry.range ? ` ${entry.range}` : ""}.`,
      },
      defaultConfiguration: {
        level: SEVERITY_LEVEL[entry.severity] || "warning",
      },
      properties: { tags: ["security", entry.severity] },
    });
  }

  return rules;
}

function buildResults(entries, rules) {
  const ruleIndex = new Map(rules.map((r, i) => [r.id, i]));
  return entries.map((entry) => {
    const id = `npm-audit:${entry.name}@${entry.range}`;
    const paths = entry.paths.length
      ? ` Import paths: ${entry.paths.join(", ")}.`
      : "";
    return {
      ruleId: id,
      ruleIndex: ruleIndex.get(id),
      level: SEVERITY_LEVEL[entry.severity] || "warning",
      message: {
        text: `${entry.title} in ${entry.name}${entry.range ? ` ${entry.range}` : ""}.${paths}`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: "pnpm-lock.yaml" },
            region: { startLine: 1 },
          },
        },
      ],
      partialFingerprints: {
        primaryLocationLineHash: `npm-audit:${entry.name}:${entry.range}:${entry.advisoryId ?? entry.title}`,
      },
      properties: { tags: ["security", entry.severity] },
    };
  });
}

function convert(inputPath, outputPath) {
  const raw = fs.existsSync(inputPath)
    ? fs.readFileSync(inputPath, "utf8")
    : "";
  const report = raw.trim() ? JSON.parse(raw) : {};
  const entries = normalize(report);

  const rules = buildRules(entries);
  const results = buildResults(entries, rules);

  const severityCounts = Object.fromEntries(
    Object.keys(SEVERITY_LEVEL).map((s) => [
      s,
      entries.filter((e) => e.severity === s).length,
    ]),
  );

  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "pnpm-audit",
            informationUri: "https://pnpm.io/cli/audit",
            version: report.auditReportVersion
              ? String(report.auditReportVersion)
              : undefined,
            rules: rules.length ? rules : undefined,
          },
        },
        results,
        properties: {
          summary: {
            ...severityCounts,
            total: entries.length,
          },
        },
      },
    ],
  };

  fs.writeFileSync(outputPath, JSON.stringify(sarif, null, 2));
  console.log(
    `✅ SARIF written to ${outputPath} (${results.length} result(s))`,
  );
}

// CLI handling
if (process.argv[1] && process.argv[1].endsWith("audit-to-sarif.js")) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error(
      "Usage: node scripts/audit-to-sarif.js <input.json> <output.sarif>",
    );
    process.exit(1);
  }
  try {
    convert(input, output);
  } catch (error) {
    console.error("❌ Failed to convert audit report:", error.message);
    process.exit(1);
  }
}

export { convert };
