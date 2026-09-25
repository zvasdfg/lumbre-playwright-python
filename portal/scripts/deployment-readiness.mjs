import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const portalDirectory = join(scriptDirectory, "..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function bindingNames(config) {
  return unique([
    config.assets?.binding,
    ...(config.d1_databases ?? []).map(({ binding }) => binding),
    config.images?.binding,
    ...(config.ratelimits ?? []).map(({ name }) => name),
  ]);
}

export function evaluateReadiness({
  manifest,
  wrangler,
  environment,
  profileName,
  remoteSecretNames,
}) {
  const environmentContract = manifest.environments[environment];
  const profile = manifest.profiles[profileName];
  if (!environmentContract) throw new Error(`Unknown environment: ${environment}`);
  if (!profile) throw new Error(`Unknown deployment profile: ${profileName}`);

  const environmentConfig =
    environmentContract.wranglerEnvironment === null
      ? wrangler
      : wrangler.env?.[environmentContract.wranglerEnvironment];
  if (!environmentConfig) {
    throw new Error(`Wrangler has no configuration for ${environment}`);
  }

  const configuredBindings = unique([
    ...bindingNames(wrangler),
    ...bindingNames(environmentConfig),
  ]);
  const configuredVariables = Object.keys(environmentConfig.vars ?? {});
  const declaredSecretNames = environmentConfig.secrets?.required ?? [];
  const secretNames = remoteSecretNames === null ? null : unique(remoteSecretNames);

  const missingBindings = profile.requiredBindings.filter(
    (name) => !configuredBindings.includes(name),
  );
  const missingVariables = profile.requiredVariables.filter(
    (name) => !configuredVariables.includes(name),
  );
  const missingSecrets =
    secretNames === null
      ? []
      : profile.requiredSecrets.filter((name) => !secretNames.includes(name));
  const undeclaredSecrets = profile.requiredSecrets.filter(
    (name) => !declaredSecretNames.includes(name),
  );
  const unexpectedDeclarations = declaredSecretNames.filter(
    (name) => !profile.requiredSecrets.includes(name),
  );
  const unexpectedSecrets =
    secretNames === null
      ? []
      : secretNames.filter((name) => !profile.requiredSecrets.includes(name));

  return {
    environment,
    worker: environmentContract.worker,
    profileName,
    description: profile.description,
    remoteInventoryChecked: secretNames !== null,
    configuredSecretNames: secretNames ?? [],
    missingBindings,
    missingVariables,
    missingSecrets,
    undeclaredSecrets,
    unexpectedDeclarations,
    unexpectedSecrets,
    blockers: profile.deployable ? [] : profile.blockers,
    ready:
      profile.deployable &&
      missingBindings.length === 0 &&
      missingVariables.length === 0 &&
      missingSecrets.length === 0 &&
      undeclaredSecrets.length === 0 &&
      unexpectedDeclarations.length === 0 &&
      unexpectedSecrets.length === 0,
  };
}

function parseArguments(arguments_) {
  const options = {
    environment: "staging",
    profileName: "public-demo",
    offline: false,
    inventoryPath: null,
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--offline") {
      options.offline = true;
    } else if (argument === "--environment") {
      options.environment = arguments_[index + 1];
      index += 1;
    } else if (argument === "--profile") {
      options.profileName = arguments_[index + 1];
      index += 1;
    } else if (argument === "--inventory") {
      options.inventoryPath = arguments_[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (options.offline && options.inventoryPath) {
    throw new Error("Use either --offline or --inventory, not both");
  }
  return options;
}

function remoteSecretNames(environmentContract) {
  const wranglerPath = join(portalDirectory, "node_modules", ".bin", "wrangler");
  const arguments_ = ["secret", "list", "--format", "json"];
  if (environmentContract.wranglerEnvironment) {
    arguments_.push("--env", environmentContract.wranglerEnvironment);
  }
  const result = spawnSync(wranglerPath, arguments_, {
    cwd: portalDirectory,
    encoding: "utf8",
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? "/tmp/lumbre-wrangler-logs",
    },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Wrangler could not list remote secrets");
  }
  const inventory = JSON.parse(result.stdout);
  if (!Array.isArray(inventory)) throw new Error("Unexpected Wrangler secret inventory");
  return inventory.map(({ name }) => name);
}

function printList(label, values) {
  console.log(`${label}: ${values.length === 0 ? "none" : values.join(", ")}`);
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifest = readJson(join(portalDirectory, "config", "deployment-readiness.json"));
  const wrangler = readJson(join(portalDirectory, "wrangler.jsonc"));
  const environmentContract = manifest.environments[options.environment];
  if (!environmentContract) throw new Error(`Unknown environment: ${options.environment}`);

  let secrets = null;
  if (options.inventoryPath) {
    const inventory = readJson(options.inventoryPath);
    secrets = inventory.map(({ name }) => name);
  } else if (!options.offline) {
    secrets = remoteSecretNames(environmentContract);
  }

  const result = evaluateReadiness({
    manifest,
    wrangler,
    environment: options.environment,
    profileName: options.profileName,
    remoteSecretNames: secrets,
  });

  console.log(`Deployment readiness: ${result.environment} / ${result.profileName}`);
  console.log(`Worker: ${result.worker}`);
  console.log(`Scope: ${result.description}`);
  console.log(
    `Remote secret inventory: ${
      result.remoteInventoryChecked ? "checked (names only)" : "not checked"
    }`,
  );
  printList("Configured secret names", result.configuredSecretNames);
  printList("Missing bindings", result.missingBindings);
  printList("Missing variables", result.missingVariables);
  printList("Missing secrets", result.missingSecrets);
  printList("Secrets missing from Wrangler declaration", result.undeclaredSecrets);
  printList("Unexpected Wrangler secret declarations", result.unexpectedDeclarations);
  printList("Unexpected secrets", result.unexpectedSecrets);
  printList("Activation blockers", result.blockers);
  console.log(`Result: ${result.ready ? "READY" : "BLOCKED"}`);
  process.exitCode = result.ready ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`Deployment readiness failed: ${error.message}`);
    process.exitCode = 1;
  }
}
