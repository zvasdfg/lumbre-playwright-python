import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-047",
    "An administrator product update reaches the public store without reloading",
)
def test_product_update_reaches_public_catalog(
    administrator_home: HomePage,
    test_log: TestLogger,
) -> None:
    product_id = 111
    product_name = "Blend LHC-003 · SPG clásico"
    updated_price = 275

    with test_log.step("Open catalog administration and select a product"):
        administrator_home.open_admin_catalog()
        admin = administrator_home.admin_catalog
        expect(admin.root).to_be_visible()
        expect(admin.product(product_id)).to_be_visible()
        admin.select_product(product_id)
        expect(admin.product_price_input).to_have_value("260")
        test_log.values(
            product_id=product_id,
            product_name=product_name,
            original_price=admin.product_price_input.input_value(),
        )

    with test_log.step("Save a new product price through the administrative UI"):
        admin.update_product_price(updated_price)
        expect(admin.message).to_have_text("Producto actualizado.")
        test_log.values(
            updated_price=updated_price,
            observed_confirmation=admin.message.inner_text(),
        )

    with test_log.step("Validate the refreshed price in the public store"):
        admin.close()
        product_card = administrator_home.product_named(product_name)
        expect(product_card).to_contain_text("$275")
        test_log.values(
            observed_product_card=product_card.inner_text(),
            expected_price="$275",
        )
