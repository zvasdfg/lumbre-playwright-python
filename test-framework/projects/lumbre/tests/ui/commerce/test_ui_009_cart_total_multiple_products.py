import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-009",
    "The cart correctly totals multiple products",
)
def test_cart_total_sums_multiple_products(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    product_names = (
        "Pinzas Forja 45",
        "Mandil Lumbre 01",
    )
    expected_total = "$2,030"

    with test_log.step("Add two products to the cart"):
        for product_name in product_names:
            home.add_product(product_name)

        expect(home.header.cart_button).to_contain_text("2")
        test_log.values(
            added_products=product_names,
            observed_cart_button=home.header.cart_button.inner_text(),
            expected_product_count=2,
        )

    with test_log.step("Open the cart and validate its products"):
        home.open_cart()
        expect(home.cart.root).to_be_visible()
        expect(home.cart.items).to_have_count(2)

        for product_name in product_names:
            expect(home.cart.product_named(product_name)).to_be_visible()

        test_log.values(
            observed_item_count=home.cart.items.count(),
            expected_item_count=2,
        )

    with test_log.step("Validate the cart total"):
        expect(home.cart.total).to_have_text(expected_total)
        test_log.values(
            observed_total=home.cart.total.inner_text(),
            expected_total=expected_total,
        )
