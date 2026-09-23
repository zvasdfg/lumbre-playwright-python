import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-027",
    "An anonymous cart becomes the authenticated account cart after sign-in",
)
def test_anonymous_cart_merges_into_account(api: LumbreApi, test_log: TestLogger) -> None:
    email = "canasta@example.test"

    with test_log.step("Create an anonymous cart before authentication"):
        response = api.add_cart_item({"productId": 101, "quantity": 2})
        anonymous_cart = response.json()["data"]
        test_log.values(
            observed_status=response.status,
            observed_total_quantity=anonymous_cart["totalQuantity"],
            observed_total=anonymous_cart["total"],
        )
        assert anonymous_cart["totalQuantity"] == 2

    with test_log.step("Authenticate the same HTTP client"):
        assert api.request_magic_link({"name": "Sol Carbón", "email": email}).status == 200
        delivery = api.latest_local_magic_link(email)
        assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200
        account = api.account()["data"]
        test_log.values(
            observed_account_email=account["email"],
            observed_role=account["role"],
        )

    with test_log.step("Validate that the cart is retained under account ownership"):
        account_cart = api.cart()["data"]
        test_log.values(
            observed_items=account_cart["items"],
            observed_total_quantity=account_cart["totalQuantity"],
            observed_total=account_cart["total"],
            expected_total=1480,
        )
        assert account_cart == anonymous_cart
