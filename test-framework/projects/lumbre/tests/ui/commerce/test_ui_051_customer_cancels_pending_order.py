import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-051",
    "A customer cancels a pending order from account history",
)
def test_customer_cancels_pending_order(
    authenticated_api: LumbreApi,
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 111, "quantity": 1})
    order = authenticated_api.create_order(
        {
            "customerName": "Cliente Fixture",
            "customerEmail": "fixture.customer@example.test",
        },
        "browser-cancellation-order",
    ).json()["data"]

    with test_log.step("Reload account history with the pending order"):
        authenticated_home.page.reload(wait_until="domcontentloaded")
        authenticated_home.wait_until_ready()
        authenticated_home.open_account()
        order_row = authenticated_home.account.order(order["id"])
        expect(order_row).to_contain_text("Pendiente")
        test_log.values(order_id=order["id"], observed_order=order_row.inner_text())

    with test_log.step("Cancel the order through its accessible action"):
        authenticated_home.account.cancel_order(order["id"])
        expect(authenticated_home.toast.root).to_contain_text(
            "Pedido cancelado. Ya no se procesará esta compra."
        )
        expect(order_row).to_contain_text("Cancelado")
        test_log.values(
            observed_feedback=authenticated_home.toast.root.inner_text(),
            observed_order=order_row.inner_text(),
        )

    with test_log.step("Validate that the cancellation action is no longer available"):
        expect(order_row.get_by_role("button", name="Cancelar pedido")).to_have_count(0)
        persisted = authenticated_api.order(order["id"]).json()["data"]
        test_log.values(
            observed_status=persisted["status"],
            observed_cancelled_at=persisted["cancelledAt"],
        )
        assert persisted["status"] == "cancelled"
        assert persisted["cancelledAt"] is not None
