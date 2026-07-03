from __future__ import annotations

from collections.abc import Callable, Iterator

import pytest
from playwright.sync_api import APIRequestContext, Page, Playwright

from framework.api.lumbre_api import LumbreApi
from framework.config import settings
from framework.pages.home_page import HomePage
from framework.reporting import TestLogger

pytest_plugins = ("framework.reporting.html_report",)


@pytest.fixture(scope="session")
def app_url() -> str:
    return settings.base_url


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args: dict) -> dict:
    return {
        **browser_context_args,
        "locale": "es-MX",
        "viewport": {"width": 1440, "height": 1000},
    }


@pytest.fixture(scope="session")
def api_request_context(playwright: Playwright, app_url: str) -> Iterator[APIRequestContext]:
    context = playwright.request.new_context(base_url=app_url)
    yield context
    context.dispose()


@pytest.fixture
def api(api_request_context: APIRequestContext) -> LumbreApi:
    return LumbreApi(api_request_context)


@pytest.fixture
def home(page: Page, app_url: str) -> HomePage:
    home_page = HomePage(page, app_url)
    home_page.open()
    return home_page


@pytest.fixture
def test_log(request: pytest.FixtureRequest) -> Iterator[TestLogger]:
    case = request.node.get_closest_marker("case")
    if case is None or len(case.args) < 2:
        raise RuntimeError("Every test must declare @pytest.mark.case(case_id, behavior)")

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


@pytest.fixture(autouse=True)
def reset_scenario(api: LumbreApi) -> None:
    api.reset_demo_data()
