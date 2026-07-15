import pytest
from playwright.sync_api import Page, ViewportSize, expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-028",
    "Critical content and actions remain usable at the supported mobile viewport",
)
def test_mobile_viewport_keeps_critical_content_usable(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Resize to the supported mobile viewport"):
        viewport: ViewportSize = {"width": 390, "height": 844}
        page.set_viewport_size(viewport)
        test_log.values(viewport=viewport)

    with test_log.step("Validate critical mobile content and actions"):
        planner_button = page.get_by_role("button", name="Planear mi fuego")
        recipes_link = page.get_by_role("link", name="Explorar recetas")
        expect(home.hero_title).to_be_visible()
        expect(planner_button).to_be_visible()
        expect(recipes_link).to_be_visible()
        test_log.values(
            observed_title_visible=home.hero_title.is_visible(),
            observed_planner_visible=planner_button.is_visible(),
            observed_recipes_link_visible=recipes_link.is_visible(),
        )

    with test_log.step("Validate that the layout does not overflow horizontally"):
        layout_widths = page.locator("html").evaluate(
            "element => ({scrollWidth: element.scrollWidth, clientWidth: element.clientWidth})"
        )
        test_log.values(
            observed_scroll_width=layout_widths["scrollWidth"],
            observed_client_width=layout_widths["clientWidth"],
            expected_horizontal_overflow=False,
        )
        assert layout_widths["scrollWidth"] <= layout_widths["clientWidth"]
