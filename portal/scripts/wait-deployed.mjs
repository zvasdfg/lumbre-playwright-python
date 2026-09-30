const baseUrl = process.argv[2];
if (!baseUrl || !baseUrl.startsWith("https://")) {
  throw new Error("An HTTPS deployment URL is required");
}

// Deployment acknowledgement does not guarantee that every edge serves it yet.
// Wait only for readiness, then execute acceptance tests once without retries.
const deadline = Date.now() + 120_000;
let consecutiveReady = 0;
while (Date.now() < deadline) {
  try {
    const health = await fetch(new URL(`/api/health?readiness=${Date.now()}`, baseUrl), {
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    const body = await health.json();
    if (health.ok && body.status === "ok" && body.database?.status === "ready") {
      consecutiveReady += 1;
      if (consecutiveReady === 2) {
        console.log("Deployment readiness confirmed; acceptance tests may start.");
        process.exit(0);
      }
    } else {
      consecutiveReady = 0;
      console.log(`Waiting for deployment readiness: HTTP ${health.status}`);
    }
  } catch {
    consecutiveReady = 0;
    console.log("Waiting for deployment endpoint availability.");
  }
  await new Promise((resolve) => setTimeout(resolve, 3_000));
}
throw new Error("Deployment did not become ready within 120 seconds");
