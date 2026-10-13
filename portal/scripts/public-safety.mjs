// Lightweight publication guards, not a complete secret scanner or penetration test.
const rules = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ["github-token", /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})/g],
  ["aws-access-id", /(?:AKIA|ASIA)[A-Z0-9]{16}/g],
  ["stripe-secret", /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}/g],
  ["slack-token", /xox[baprs]-[A-Za-z0-9-]{20,}/g],
  ["google-key", /AIza[A-Za-z0-9_-]{35}/g],
  ["credential-url", /https?:\/\/[^\s/:]+:[^\s/@]{8,}@/g],
  ["hardcoded-provider-secret", /\b(?:CLOUDFLARE_API_TOKEN|AUTH_SECRET|STRIPE_SECRET_KEY|CLIENT_SECRET)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{24,}["']/g],
  ["private-formulation-reference", /\bLMB-(?:C-00[34]|P-001)\b|codex-clipboard-[0-9a-f-]{36}/gi],
  ["personal-email", /[A-Za-z0-9._%+-]+@(?:hotmail|gmail|outlook|yahoo)\.com/gi],
  ["personal-filesystem-path", /\/(?:Users|home)\/[A-Za-z][A-Za-z0-9_.-]+\//g],
];
export function contentFindings(name, content) {
  const findings = [];
  for (const [rule, pattern] of rules) {
    for (const match of content.matchAll(new RegExp(pattern))) {
      findings.push({ path: name, rule, line: content.slice(0, match.index).split("\n").length });
    }
  }
  if (name.endsWith("data/production-products.ts") && /\b(?:percent|porcentaje|grams|gramos|amounts|proportions|proporciones)\s*:/.test(content)) {
    findings.push({ path: name, rule: "production-quantities", line: 1 });
  }
  if (/^docs\/lab-.*\.json$/.test(name) && /"family_starting_weights"\s*:/.test(content)) {
    findings.push({ path: name, rule: "retired-formulation-metadata", line: 1 });
  }
  return findings; // Never return a matched value or credential.
}
export function allowedPublicFile(name) {
  return name === "index.html" || name === "_headers" ||
    /^assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(name) ||
    /^(?:brand|editorial)\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|svg)$/.test(name);
}
export function forbiddenTrackedFile(name) {
  return /(?:^|\/)(?:\.env(?:\..+)?|\.dev\.vars(?:\..+)?|auth\.json|storage[-_]state\.json)$/.test(name) &&
    !/\.(?:example|sample)$/.test(name) ||
    /(?:^|\/)(?:node_modules|\.venv|\.wrangler|\.d1-backups|\.npm-cache|\.mypy_cache|\.pytest_cache|\.ruff_cache|reports|test-results|playwright-report|private)(?:\/|$)/.test(name) ||
    /\.(?:pem|key|p12|pfx|sqlite3?|db|har|log|tar|gz|zip)$/.test(name);
}
