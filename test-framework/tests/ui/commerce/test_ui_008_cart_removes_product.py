import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-008",
    "The cart allows removing an added product",
)
def test_cart_removes_an_added_product(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    product_name = "Pinzas Forja 45"

    with test_log.step("Add a product and open the cart"):
        home.add_product(product_name)
        home.open_cart()
        expect(home.cart.root).to_be_visible()
        expect(home.cart.product_named(product_name)).to_be_visible()
        test_log.values(
            added_product=product_name,
            observed_item_count=home.cart.items.count(),
            expected_item_count=1,
        )

    with test_log.step("Remove the product from the cart"):
        home.cart.remove_product(product_name)

    with test_log.step("Validate the empty state and cart count"):
        expect(home.cart.empty_state).to_be_visible()
        expect(home.cart.product_named(product_name)).not_to_be_visible()
        expect(home.header.cart_button).to_contain_text("0")
        test_log.values(
            removed_product=product_name,
            observed_remaining_items=home.cart.items.count(),
            expected_remaining_items=0,
            observed_cart_button=home.header.cart_button.inner_text(),
            expected_product_count=0,
        )
