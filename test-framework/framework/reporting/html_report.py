from __future__ import annotations

import base64
import html
import os
import platform
from pathlib import Path
from typing import Any

import pytest
import pytest_html  # type: ignore[import-untyped]
from playwright.sync_api import Error, Page
from pytest_metadata.plugin import metadata_key  # type: ignore[import-untyped]

from framework.config import settings
from framework.reporting.test_logger import TestLogger


def _case_metadata(item: pytest.Item) -> tuple[str, str]:
    marker = item.get_closest_marker("case")
    if marker is None or len(marker.args) < 2:
        return "UNDEFINED", "Missing @pytest.mark.case metadata"
    return str(marker.args[0]), str(marker.args[1])


def _trace_link(item: pytest.Item) -> str | None:
    funcargs: dict[str, Any] = getattr(item, "funcargs", {})
    output_path = funcargs.get("output_path")
    html_path = getattr(item.config.option, "htmlpath", None)
    if output_path is None or html_path is None:
        return None

    trace_path = Path(str(output_path)) / "trace.zip"
    report_directory = Path(str(html_path)).resolve().parent
    relative_path = os.path.relpath(trace_path, start=report_directory)
    href = html.escape(relative_path.replace(os.sep, "/"), quote=True)
    label = html.escape(str(trace_path), quote=False)
    return (
        '<div class="lumbre-artifact">'
        f'<strong>Playwright trace:</strong> <a href="{href}">{label}</a>'
        "</div>"
    )


def pytest_configure(config: pytest.Config) -> None:
    metadata = config.stash[metadata_key]
    metadata["Application"] = "Lumbre"
    metadata["Base URL"] = settings.base_url
    metadata["Python"] = platform.python_version()
    metadata["Platform"] = platform.platform()
    metadata["Report mode"] = "Incremental after each test"


def pytest_html_report_title(report: Any) -> None:
    report.title = "Lumbre · Playwright Test Report"


def pytest_html_results_summary(
    prefix: list[str],
    summary: list[str],
    postfix: list[str],
) -> None:
    prefix.append(
        '<div class="lumbre-report-intro">'
        "<strong>Lumbre QA Lab</strong> · Pytest + Playwright · "
        "The file is updated after every completed test."
        "</div>"
    )


def pytest_html_results_table_header(cells: list[str]) -> None:
    cells.insert(2, '<th class="sortable" data-column-type="case">Case</th>')
    cells.insert(3, "<th>Behavior</th>")


def pytest_html_results_table_row(report: Any, cells: list[str]) -> None:
    case_id = html.escape(getattr(report, "case_id", "UNDEFINED"))
    behavior = html.escape(getattr(report, "behavior", ""))
    cells.insert(2, f'<td class="col-case">{case_id}</td>')
    cells.insert(3, f'<td class="col-behavior">{behavior}</td>')


@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(
    item: pytest.Item,
    call: pytest.CallInfo[None],
):
    outcome = yield
    report = outcome.get_result()
    setattr(item, f"report_{report.when}", report)

    case_id, behavior = _case_metadata(item)
    report.case_id = case_id
    report.behavior = behavior

    if report.when != "call":
        return

    extras = list(getattr(report, "extras", []))
    extras.append(
        pytest_html.extras.json(
            {"case_id": case_id, "behavior": behavior},
            name="Case metadata",
        )
    )

    funcargs: dict[str, Any] = getattr(item, "funcargs", {})
    captured_log = getattr(report, "caplog", "")
    if captured_log:
        extras.append(
            pytest_html.extras.text(
                captured_log,
                name="Steps and values",
            )
        )

    test_logger = funcargs.get("test_log")
    if isinstance(test_logger, TestLogger):
        for evidence in test_logger.step_evidence:
            image = base64.b64encode(evidence.screenshot).decode("ascii")
            extras.append(
                pytest_html.extras.png(
                    image,
                    name=(f"STEP {evidence.number:02d} {evidence.status} · {evidence.name}"),
                )
            )

    page = funcargs.get("page")
    if isinstance(page, Page):
        extras.append(pytest_html.extras.url(page.url, name="Final URL"))

        if report.failed:
            try:
                screenshot = page.screenshot(full_page=True)
            except Error:
                screenshot = None
            if screenshot:
                extras.append(
                    pytest_html.extras.png(
                        base64.b64encode(screenshot).decode("ascii"),
                        name="Failure screenshot",
                    )
                )

    if report.failed:
        trace_link = _trace_link(item)
        if trace_link:
            extras.append(pytest_html.extras.html(trace_link))

    report.extras = extras
