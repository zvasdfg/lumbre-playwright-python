# Lumbre HTML Reporting Guide

The framework uses `pytest-html` to produce a local, self-contained report with
Mochawesome-style diagnostics while keeping tests written as standard Pytest
functions.

## Generate the complete report

From the project root:

```bash
./scripts/report-local.sh
```

The script:

1. starts the Lumbre portal on port `3100` by default;
2. waits for `/api/health`;
3. runs Pytest with the HTML plugin and Lumbre CSS;
4. stops the portal even when tests fail;
5. preserves the Pytest exit code;
6. writes the report to:

```text
test-framework/reports/lumbre-report.html
```

Open it on macOS:

```bash
open test-framework/reports/lumbre-report.html
```

The current complete suite produces 19 result rows and 39 UI step screenshots.
Counts will change as tests and steps are added.

## Incremental updates

`pyproject.toml` configures:

```toml
generate_report_on_test = true
render_collapsed = ""
```

The HTML file is regenerated after every completed Pytest execution. It is not
updated after each `test_log.step()`. While a longer suite is running, refresh
the open report to see completed tests. Successful results are expanded by
default so logs and evidence are immediately visible.

## Selective reports

Arguments after `report-local.sh` are forwarded to Pytest:

```bash
# One API test
./scripts/report-local.sh \
  tests/api/test_api_006_member_created_with_valid_data.py

# One UI test file; UI-011 produces two parameterized executions
./scripts/report-local.sh \
  tests/ui/test_ui_011_membership_modal_closes.py

# One route-mocking UI test with five step screenshots
./scripts/report-local.sh \
  tests/ui/test_err_001_membership_server_error.py

# One parameterized variant; quote brackets in zsh
./scripts/report-local.sh \
  'tests/ui/test_ui_011_membership_modal_closes.py::test_membership_modal_closes[chromium-close-button]'

# Markers and keyword selection
./scripts/report-local.sh -m smoke
./scripts/report-local.sh -m api
./scripts/report-local.sh -k membership_modal
```

Headed mode and slow motion can be combined with reporting:

```bash
./scripts/report-local.sh \
  tests/ui/test_ui_011_membership_modal_closes.py \
  --headed --slowmo 500
```

## Report contents

Every result includes:

- Pytest result and duration;
- test node ID and parameters;
- case ID from `@pytest.mark.case`;
- observable behavior description;
- environment metadata and configured base URL;
- captured logs, including `[STEP]` and `[VALUES]`;
- case metadata as JSON.

UI results also include:

- final browser URL;
- one viewport screenshot after every completed `test_log.step()`;
- screenshot name containing step number, result, and description.

Use the left and right controls in the media gallery to navigate step images.
Screenshots are embedded as Base64, so the report remains a single portable
HTML file. More UI steps increase the report file size.

API tests do not produce screenshots because they use `APIRequestContext` and
do not create a browser `Page`.

## Failure evidence

When a UI test fails, the report also attempts to include:

- the screenshot captured at the end of the failed step;
- a full-page failure screenshot;
- the Playwright final URL;
- a local link to the retained `trace.zip`.

Original Playwright artifacts remain under:

```text
test-framework/test-results/
```

Open a trace:

```bash
cd test-framework
.venv/bin/playwright show-trace test-results/<test-directory>/trace.zip
```

The trace link is relative to the HTML report. If the report is moved without
its `test-results` directory, embedded screenshots still work but the trace
link may no longer resolve.

## Run against an already-started portal

```bash
cd test-framework

BASE_URL=http://localhost:3000 .venv/bin/pytest -q \
  --html=reports/lumbre-report.html \
  --self-contained-html \
  --css=framework/reporting/lumbre_report.css
```

You can append a path, marker, or node ID to that command.

## Report implementation

- `framework/reporting/test_logger.py` owns step timing and evidence capture.
- `framework/reporting/html_report.py` implements Pytest and pytest-html hooks.
- `framework/reporting/lumbre_report.css` provides readable Lumbre styling.
- `tests/conftest.py` enables the plugin and connects `Page` screenshots to
  `TestLogger` for UI-marked tests.

The report intentionally uses standard Pytest hooks; test files do not import
or manipulate `pytest-html` directly.

## Exit codes and file lifecycle

`report-local.sh` returns the same exit code as Pytest. Generating a report does
not turn a failing suite into a successful command.

`lumbre-report.html` is replaced by the next reporting run. Copy it to a
different name before the next run if a specific execution must be retained.

Reference: [pytest-html user guide](https://pytest-html.readthedocs.io/en/latest/user_guide.html).
