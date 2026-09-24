import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-039",
    "An authenticated customer completes checkout and sees the persisted order",
)
def test_authenticated_checkout_persists_order(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    product_name = "Blend LHC-003 · SPG clásico"

    with test_log.step("Add a blend and open the authenticated checkout"):
        authenticated_home.add_product(product_name)
        authenticated_home.open_cart()
        observed_total = authenticated_home.cart.total.inner_text()
        authenticated_home.cart.checkout()
        expect(authenticated_home.checkout.root).to_be_visible()
        test_log.values(added_product=product_name, observed_server_cart_total=observed_total)

    with test_log.step("Submit valid delivery details through the approved payment scenario"):
        authenticated_home.checkout.complete_customer(
            name="Cliente Fixture",
            email="fixture.customer@example.test",
            notes="Entregar junto al portón.",
        )
        authenticated_home.checkout.select_payment_scenario("success")
        authenticated_home.checkout.submit()
        expect(authenticated_home.checkout.confirmation).to_contain_text("Compra confirmada")
        expect(authenticated_home.header.cart_button).to_contain_text("0")
        test_log.values(
            observed_confirmation=authenticated_home.checkout.confirmation.inner_text(),
            observed_cart_count=authenticated_home.header.cart_button.inner_text(),
        )

    with test_log.step("Open the account and verify the paid order in persisted history"):
        authenticated_home.checkout.root.get_by_role("button", name="Cerrar", exact=True).click()
        authenticated_home.open_account()
        expect(authenticated_home.account.order_history).to_contain_text("Pagado")
        expect(authenticated_home.account.order_history).to_contain_text("$260")
        test_log.values(
            observed_order_history=authenticated_home.account.order_history.inner_text(),
            expected_status="Pagado",
            expected_total="$260",
        )
