from __future__ import annotations

from playwright.sync_api import Page

from projects.lumbre.pages.base_page import BasePage


class PrivacyPage(BasePage):
    path = "/privacidad"

    def __init__(self, page: Page, base_url: str) -> None:
        super().__init__(page, base_url)
        self.heading = page.get_by_role("heading", name="Privacidad clara, sin humo.")
        self.status = page.locator(
            "dl[aria-label='Estado de privacidad de la demostración']",
        )
        self.anonymous_cart_section = page.get_by_test_id("anonymous-cart-privacy")
        self.operational_logs_section = page.get_by_test_id("operational-logs-privacy")
        self.disabled_features = page.get_by_role(
            "heading",
            name="Lo que esta demostración no procesa.",
        )
