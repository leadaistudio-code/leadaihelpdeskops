#!/usr/bin/env node
/**
 * Dependency audit gate for CI.
 *
 *   node scripts/audit-deps.mjs
 *
 * Why this exists rather than a bare `npm audit --audit-level=high`:
 *
 * Some advisories have no fixed release. Next.js currently has nine high
 * advisories whose only npm-suggested "fix" is downgrading to 9.3.3 — there is
 * no patched 16.x. A gate that cannot go green gets switched off within a week,
 * and then nobody is scanning at all, which is exactly the state the security
 * audit found the project in (OWASP A06: "no scanning in CI").
 *
 * So: fail on high or critical in the PRODUCTION dependency tree, but allow
 * explicit, dated, reasoned waivers in `audit-allowlist.json`. A waiver is a
 * decision recorded in git, not a disabled check. Expired waivers fail the
 * build, so they cannot rot quietly — someone has to look again and either
 * upgrade or consciously re-date it.
 *
 * Dev-only dependencies are excluded (`--omit=dev`): a vulnerability in vitest
 * or esbuild does not ship to customers. Track them, but do not block a release
 * on them.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const allowlistPath = path.join(root, "audit-allowlist.json");

const BLOCKING = new Set(["high", "critical"]);

function runAudit() {
  try {
    // npm exits non-zero when it finds anything, so the throw is expected and
    // the JSON we want is on stdout either way.
    return JSON.parse(
      execFileSync("npm", ["audit", "--omit=dev", "--json"], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        shell: process.platform === "win32",
      })
    );
  } catch (e) {
    if (e.stdout) return JSON.parse(e.stdout);
    throw e;
  }
}

function loadAllowlist() {
  if (!existsSync(allowlistPath)) return [];
  const parsed = JSON.parse(readFileSync(allowlistPath, "utf8"));
  return Array.isArray(parsed.allow) ? parsed.allow : [];
}

const today = new Date().toISOString().slice(0, 10);
const allow = loadAllowlist();

const expired = allow.filter((a) => a.expires < today);
const active = new Map(allow.filter((a) => a.expires >= today).map((a) => [a.package, a]));

const audit = runAudit();
const found = Object.entries(audit.vulnerabilities ?? {}).filter(([, v]) => BLOCKING.has(v.severity));

const blocked = [];
const waived = [];
for (const [name, v] of found) {
  const waiver = active.get(name);
  if (waiver) waived.push({ name, v, waiver });
  else blocked.push({ name, v });
}

const counts = audit.metadata?.vulnerabilities ?? {};
console.log(
  `Production dependencies: ${counts.critical ?? 0} critical, ${counts.high ?? 0} high, ` +
    `${counts.moderate ?? 0} moderate, ${counts.low ?? 0} low.\n`
);

if (waived.length > 0) {
  console.log("Waived (recorded in audit-allowlist.json):");
  for (const { name, v, waiver } of waived) {
    console.log(`  · ${name} (${v.severity}) — ${waiver.reason}`);
    console.log(`    review by ${waiver.expires}`);
  }
  console.log("");
}

let failed = false;

if (expired.length > 0) {
  failed = true;
  console.error("Waivers have expired. Upgrade, or re-date them with a fresh justification:");
  for (const a of expired) console.error(`  · ${a.package} — expired ${a.expires} — ${a.reason}`);
  console.error("");
}

if (blocked.length > 0) {
  failed = true;
  console.error("Unwaived high/critical advisories in production dependencies:");
  for (const { name, v } of blocked) {
    const fix = v.fixAvailable;
    const hint =
      fix === true
        ? "run `npm audit fix`"
        : fix && typeof fix === "object"
          ? `upgrade ${fix.name} to ${fix.version}${fix.isSemVerMajor ? " (MAJOR)" : ""}`
          : "no fix published yet — waive it in audit-allowlist.json with a reason and a review date";
    console.error(`  · ${name} (${v.severity}) — ${hint}`);
    for (const via of (v.via ?? []).filter((x) => typeof x === "object")) {
      console.error(`      ${via.title}`);
    }
  }
  console.error("");
}

if (failed) process.exit(1);
console.log("No unwaived high or critical advisories in the production dependency tree.");
