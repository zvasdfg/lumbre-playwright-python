import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-025",
    "An anonymous shopper is guided to authentication before checkout",
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

    with test_log.step("Continue to the account-protected purchase"):
        home.cart.checkout()

    with test_log.step("Validate the authentication guidance"):
        expected_message = "Inicia sesión para proteger y consultar tus compras."
        expect(home.account.root).to_be_visible()
        expect(home.toast.root).to_contain_text(expected_message)
        test_log.values(
            observed_message=home.toast.root.inner_text(),
            expected_message_contains=expected_message,
            observed_account_dialog=True,
        )
