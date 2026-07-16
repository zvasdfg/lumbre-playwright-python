from __future__ import annotations

from collections.abc import Callable, Iterator

import pytest
from playwright.sync_api import APIRequestContext, Playwright

from automation.core.config import settings
from automation.core.reporting import TestLogger


@pytest.fixture(scope="session")
def app_url() -> str:
    return settings.base_url


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args: dict) -> dict:
    return {
        **browser_context_args,
        "locale": settings.locale,
        "viewport": {
            "width": settings.viewport_width,
            "height": settings.viewport_height,
        },
    }


@pytest.fixture(scope="session")
def api_request_context(playwright: Playwright, app_url: str) -> Iterator[APIRequestContext]:
    context = playwright.request.new_context(base_url=app_url)
    yield context
    context.dispose()


@pytest.fixture
def test_log(request: pytest.FixtureRequest) -> Iterator[TestLogger]:
    case = request.node.get_closest_marker("case")
    if case is None or len(case.args) < 2:
        raise RuntimeError("Every test using test_log must declare @pytest.mark.case")

    capture_screenshot: Callable[[], bytes] | None = None
    if request.node.get_closest_marker("ui") is not None:
        page = request.getfixturevalue("page")

        def capture_page() -> bytes:
            return page.screenshot(full_page=False, animations="disabled")

        capture_screenshot = capture_page

    test_logger = TestLogger(
        case_id=str(case.args[0]),
        behavior=str(case.args[1]),
        capture_screenshot=capture_screenshot,
    )
    test_logger.start()
    yield test_logger

    report = getattr(request.node, "report_call", None)
    if report is None:
        test_logger.finish("NOT-RUN")
    elif report.passed:
        test_logger.finish("PASS")
    elif report.skipped:
        test_logger.finish("SKIP")
    else:
        test_logger.finish("FAIL")
