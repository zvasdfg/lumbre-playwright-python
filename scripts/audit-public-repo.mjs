import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { contentFindings, forbiddenTrackedFile } from "../portal/scripts/public-safety.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root }).toString().split("\0").filter(Boolean);
const additional = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: root }).toString().split("\0").filter(Boolean);
const findings = [];
let checked = 0;
const types = new Set([".md", ".json", ".jsonc", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".yml", ".yaml", ".toml", ".txt", ".html", ".css", ".svg", ".sh", ".sql"]);
for (const name of new Set([...tracked, ...additional])) {
  if (!existsSync(resolve(root, name))) continue; // Worktree deletions, before commit.
  checked++;
  if (forbiddenTrackedFile(name)) findings.push({ path: name, rule: "private-file", line: 1 });
  if (types.has(extname(name)) || [".npmrc", ".env", ".env.example", "_headers"].includes(name.split("/").at(-1))) {
    findings.push(...contentFindings(name, readFileSync(resolve(root, name), "utf8")));
  }
}
if (findings.length) {
  for (const finding of findings) console.error(`${finding.rule}: ${finding.path}:${finding.line}`);
  process.exitCode = 1;
} else console.log(`PASS: ${checked} existing tracked/new non-ignored files checked; no publication-policy findings.`);
console.log("Scope: current worktree/text patterns only. History, image metadata, remote artifacts and provider credentials need separate review.");
