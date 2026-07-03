# Lumbre Playwright Learning Lab

Local learning environment for modern test automation with Python, Pytest,
Playwright, Page Object Model, API testing, structured logs, and HTML reports.

The product UI remains in Spanish because it represents the Lumbre brand. The
automation code and project documentation are written in English. Locators and
expected values preserve the original Spanish product copy whenever they must
match what a user sees.

## Repository layout

```text
POM_Automation/
├── portal/             Lumbre web application and API
├── test-framework/     Python test automation framework
├── docs/               Strategy, Playwright notes, snippets, and reporting
├── scripts/            Local orchestration scripts
└── .vscode/            Run configurations and Python snippets
```

## Current automated coverage

- 6 API test files: `API-001` through `API-006`.
- 11 UI test files: `UI-001` through `UI-011`.
- 18 Pytest executions because `UI-011` has two parameterized variants.
- Chromium is the default browser.
- Every test has case metadata, structured steps, and diagnostic values.
- Every UI step automatically captures a viewport screenshot for the HTML report.
- Failure diagnostics include a full-page screenshot and Playwright trace.

See [Test strategy and learning guide](docs/TEST_STRATEGY_AND_PLAYWRIGHT_GUIDE.md)
for the complete inventory and risk matrix.

## Prerequisites

- Node.js `>=22.13.0`
- Python `>=3.11`
- macOS, Linux, or another environment supported by Playwright

## One-time setup

Install the portal:

```bash
cd portal
npm ci
cd ..
```

Install the test framework:

```bash
cd test-framework
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
playwright install chromium
cp .env.example .env
cd ..
```

## Run locally

From the project root:

```bash
# Start the portal, run the complete suite, and stop the portal
./scripts/test-local.sh -q

# Run the complete suite and generate the self-contained HTML report
./scripts/report-local.sh

# Open the latest report on macOS
open test-framework/reports/lumbre-report.html
```

The orchestration scripts use port `3100` by default. Override it when needed:

```bash
PORT=3200 ./scripts/test-local.sh -q
```

Additional arguments are forwarded to Pytest:

```bash
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m ui --headed --slowmo 500
./scripts/report-local.sh tests/api/test_api_006_member_created_with_valid_data.py
```

## Documentation

- [Test strategy and learning guide](docs/TEST_STRATEGY_AND_PLAYWRIGHT_GUIDE.md)
- [Key Playwright notes](docs/KEY_PLAYWRIGHT_NOTES.md)
- [Playwright Python snippets](docs/PLAYWRIGHT_PYTHON_SNIPPETS.md)
- [HTML reporting guide](docs/HTML_REPORTING.md)
- [Portal reference](portal/README.md)
- [Framework reference](test-framework/README.md)

## Local-first scope

The current workflow is intentionally local. It does not require GitHub,
continuous integration, or a hosted deployment. Remote execution can be added
later by setting `BASE_URL`, but it is not part of the current learning path.
