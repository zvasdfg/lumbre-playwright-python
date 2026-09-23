import pytest
from playwright.sync_api import Browser, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-036",
    "Independent browser contexts receive isolated anonymous carts",
)
def test_anonymous_cart_is_isolated_between_contexts(
    home: HomePage,
    browser: Browser,
    app_url: str,
    test_log: TestLogger,
) -> None:
    product_name = "Pinzas Forja 45"

    with test_log.step("Add a product in the primary browser context"):
        home.add_product(product_name)
        expect(home.header.cart_button).to_contain_text("1")
        test_log.values(
            primary_product=product_name,
            primary_cart_count=home.header.cart_button.inner_text(),
        )

    secondary_context = browser.new_context(
        locale="es-MX",
        viewport={"width": 1440, "height": 1000},
    )
    try:
        with test_log.step("Open the portal in an independent browser context"):
            secondary_page = secondary_context.new_page()
            secondary_page.goto(app_url)
            expect(secondary_page.locator("main")).to_have_attribute(
                "data-app-ready",
                "true",
            )
            secondary_cart_button = secondary_page.get_by_role(
                "button",
                name="Abrir canasta",
            )
            test_log.values(
                primary_context_cookie_count=len(home.page.context.cookies()),
                secondary_context_cookie_count=len(secondary_context.cookies()),
            )

        with test_log.step("Validate that the second context has an empty cart"):
            expect(secondary_cart_button).to_contain_text("0")
            secondary_cart_button.click()
            expect(
                secondary_page.get_by_text(
                    "Todavía no agregas nada. El fuego puede esperar.",
                ),
            ).to_be_visible()
            expect(home.header.cart_button).to_contain_text("1")
            test_log.values(
                observed_secondary_cart=secondary_cart_button.inner_text(),
                observed_primary_cart=home.header.cart_button.inner_text(),
                expected_isolation=True,
            )
    finally:
        secondary_context.close()
