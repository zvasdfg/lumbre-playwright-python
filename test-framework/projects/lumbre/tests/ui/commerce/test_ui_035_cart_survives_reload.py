import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-035",
    "The anonymous cart is restored after a page reload",
)
def test_anonymous_cart_survives_reload(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    product_name = "Pinzas Forja 45"

    with test_log.step("Add a product to the anonymous cart"):
        home.add_product(product_name)
        expect(home.header.cart_button).to_contain_text("1")
        test_log.values(
            added_product=product_name,
            observed_cart_button=home.header.cart_button.inner_text(),
        )

    with test_log.step("Reload the portal with the same browser session"):
        home.page.reload()
        expect(home.page.locator("main")).to_have_attribute("data-app-ready", "true")
        expect(home.header.cart_button).to_contain_text("1")
        test_log.values(
            observed_cart_button_after_reload=home.header.cart_button.inner_text(),
            expected_product_count=1,
        )

    with test_log.step("Validate the restored product and server total"):
        home.open_cart()
        expect(home.cart.product_named(product_name)).to_be_visible()
        expect(home.cart.total).to_have_text("$740")
        test_log.values(
            observed_product=home.cart.product_named(product_name).inner_text(),
            observed_total=home.cart.total.inner_text(),
            expected_total="$740",
        )
