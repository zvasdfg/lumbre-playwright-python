import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-050",
    "A sold-out product is visibly unavailable and cannot be added to the cart",
)
def test_sold_out_product_is_not_actionable(
    administrator_home: HomePage,
    test_log: TestLogger,
) -> None:
    product_id = 111
    product_name = "Blend LHC-003 · SPG clásico"

    with test_log.step("Set a store product inventory to zero"):
        administrator_home.open_admin_catalog()
        admin = administrator_home.admin_catalog
        expect(admin.product(product_id)).to_be_visible()
        admin.select_product(product_id)
        admin.update_product_stock(0)
        expect(admin.message).to_have_text("Producto actualizado.")
        test_log.values(
            product_id=product_id,
            product_name=product_name,
            configured_stock=0,
        )

    with test_log.step("Return to the refreshed public store"):
        admin.close()
        product_card = administrator_home.product_named(product_name)
        expect(product_card).to_be_visible()
        expect(product_card).to_contain_text("Agotado")

    with test_log.step("Validate that the sold-out action is disabled"):
        sold_out_button = product_card.get_by_role(
            "button",
            name=f"{product_name} agotado",
        )
        expect(sold_out_button).to_be_disabled()
        test_log.values(
            observed_card=product_card.inner_text(),
            observed_action_disabled=sold_out_button.is_disabled(),
            expected_stock_state="Agotado",
        )
