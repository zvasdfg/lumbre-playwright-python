import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-025",
    "The demonstration checkout communicates its observable completion state",
)
def test_checkout_communicates_completion(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Add a product and open the cart"):
        product_name = "Pinzas Forja 45"
        home.add_product(product_name)
        home.open_cart()
        expect(home.cart.product_named(product_name)).to_be_visible()
        expect(home.cart.checkout_button).to_be_enabled()
        test_log.values(selected_product=product_name)

    with test_log.step("Continue the demonstration purchase"):
        home.cart.checkout()

    with test_log.step("Validate the completion feedback"):
        expected_message = "El proceso de compra de demostración está listo"
        expect(home.status_message).to_contain_text(expected_message)
        test_log.values(
            observed_message=home.status_message.inner_text(),
            expected_message_contains=expected_message,
        )
