console.error("Deployment paused: Lumbre is moving to a static artifact. Run npm run build:static and npm run preview:static for local acceptance. Do not deploy the legacy backend.");
process.exitCode = 1;
