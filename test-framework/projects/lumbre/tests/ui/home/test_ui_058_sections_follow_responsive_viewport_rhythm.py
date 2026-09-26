import pytest
from playwright.sync_api import Page, ViewportSize, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-058",
    "Primary sections preserve viewport rhythm and mobile navigation",
)
def test_sections_follow_responsive_viewport_rhythm(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    section_selectors = [
        "#inicio",
        "#metodo",
        "#planificador",
        "#recetas",
        "#laboratorio",
        "#tienda",
    ]

    with test_log.step("Validate the desktop viewport rhythm"):
        viewport_height = page.evaluate("window.innerHeight")
        header_height = page.locator(".site-header").evaluate(
            "element => element.getBoundingClientRect().height"
        )
        section_heights = {
            selector: page.locator(selector).evaluate(
                "element => element.getBoundingClientRect().height"
            )
            for selector in section_selectors
        }
        test_log.values(
            viewport_height=viewport_height,
            header_height=header_height,
            section_heights=section_heights,
        )
        assert all(
            height >= viewport_height - header_height - 1
            for height in section_heights.values()
        )
        expect(page.locator("section.intro")).to_have_count(0)

    with test_log.step("Open the complete navigation at a mobile viewport"):
        viewport: ViewportSize = {"width": 390, "height": 844}
        page.set_viewport_size(viewport)
        mobile_navigation = page.locator("details.mobile-nav")
        mobile_navigation.locator("summary").click()
        expect(mobile_navigation).to_have_attribute("open", "")
        expect(mobile_navigation.get_by_role("link", name="Método")).to_be_visible()
        expect(mobile_navigation.get_by_role("link", name="Laboratorio")).to_be_visible()
        expect(mobile_navigation.get_by_role("button", name="Canasta")).to_be_visible()
        expect(mobile_navigation.get_by_role("button", name="Entrar")).to_be_visible()
        test_log.values(
            viewport=viewport,
            observed_mobile_menu_open=True,
            observed_navigation_items=7,
        )

    with test_log.step("Validate the mobile viewport rhythm and horizontal fit"):
        mobile_viewport_height = page.evaluate("window.innerHeight")
        mobile_header_height = page.locator(".site-header").evaluate(
            "element => element.getBoundingClientRect().height"
        )
        mobile_section_heights = {
            selector: page.locator(selector).evaluate(
                "element => element.getBoundingClientRect().height"
            )
            for selector in section_selectors
        }
        layout_widths = page.locator("html").evaluate(
            "element => ({scrollWidth: element.scrollWidth, clientWidth: element.clientWidth})"
        )
        test_log.values(
            mobile_viewport_height=mobile_viewport_height,
            mobile_header_height=mobile_header_height,
            mobile_section_heights=mobile_section_heights,
            observed_scroll_width=layout_widths["scrollWidth"],
            observed_client_width=layout_widths["clientWidth"],
        )
        assert all(
            height >= mobile_viewport_height - mobile_header_height - 1
            for height in mobile_section_heights.values()
        )
        assert layout_widths["scrollWidth"] <= layout_widths["clientWidth"]
