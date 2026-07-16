import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case("UI-005", "Adding a product updates feedback and the cart count")
def test_product_can_be_added_to_cart(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Add Pinzas Forja 45 to the cart"):
        product_name = "Pinzas Forja 45"
        home.add_product(product_name)
        test_log.values(added_product=product_name)

    with test_log.step("Validate the confirmation message"):
        expected_message = "se agregó a tu canasta"
        expect(home.toast.root).to_contain_text(expected_message)
        test_log.values(
            observed_message=home.toast.root.inner_text(),
            expected_message_contains=expected_message,
        )

    with test_log.step("Validate the cart count"):
        expect(home.header.cart_button).to_contain_text("1")
        test_log.values(
            observed_cart_button=home.header.cart_button.inner_text(),
            expected_product_count=1,
        )
