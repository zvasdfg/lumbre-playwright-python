import pytest
from playwright.sync_api import Playwright, expect

from automation.core.reporting import TestLogger


@pytest.mark.cross_browser
@pytest.mark.regression
@pytest.mark.parametrize("engine_name", ["chromium", "firefox", "webkit"])
@pytest.mark.case(
    "BROWSER-001",
    "The critical home smoke contract passes in every supported browser engine",
)
def test_home_smoke_contract_across_engines(
    playwright: Playwright,
    pytestconfig: pytest.Config,
    app_url: str,
    test_log: TestLogger,
    engine_name: str,
) -> None:
    with test_log.step("Launch the requested browser engine"):
        browser_type = getattr(playwright, engine_name)
        headed = pytestconfig.getoption("--headed")
        slow_mo = pytestconfig.getoption("--slowmo")
        browser = browser_type.launch(headless=not headed, slow_mo=slow_mo)
        context = browser.new_context(
            locale="es-MX",
            viewport={"width": 1440, "height": 1000},
        )
        page = context.new_page()
        test_log.values(
            browser_engine=engine_name,
            target_url=app_url,
            headed=headed,
            slow_mo=slow_mo,
        )

    try:
        with test_log.step("Open the portal and wait for application readiness"):
            page.goto(app_url, wait_until="domcontentloaded")
            page.locator("main[data-app-ready='true']").wait_for(state="attached")

        with test_log.step("Validate the critical home smoke contract"):
            heading = page.get_by_role("heading", name="El fuego nos reúne.")
            membership_button = page.get_by_role("button", name="Únete al fuego")
            expect(heading).to_be_visible()
            expect(membership_button).to_be_enabled()
            test_log.values(
                browser_engine=engine_name,
                observed_heading=heading.inner_text(),
                observed_membership_enabled=membership_button.is_enabled(),
            )
    finally:
        context.close()
        browser.close()
