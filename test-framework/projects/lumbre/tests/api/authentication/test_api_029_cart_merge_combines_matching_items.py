import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-029",
    "Signing in combines matching anonymous and account cart items without duplicate lines",
)
def test_cart_merge_combines_matching_items(api: LumbreApi, test_log: TestLogger) -> None:
    email = "fusion.canasta@example.test"

    with test_log.step("Create a persisted cart for an authenticated account"):
        assert api.request_magic_link({"name": "Fusión Brasa", "email": email}).status == 200
        first_link = api.latest_local_magic_link(email).json()["data"]["url"]
        assert api.follow_magic_link(first_link).status == 200
        account_cart = api.add_cart_item({"productId": 101, "quantity": 2}).json()["data"]
        test_log.values(
            observed_account_quantity=account_cart["totalQuantity"],
            observed_account_lines=len(account_cart["items"]),
        )

    with test_log.step("Create a matching anonymous line after logout"):
        assert api.logout().status == 200
        anonymous_cart = api.add_cart_item({"productId": 101, "quantity": 3}).json()["data"]
        test_log.values(
            observed_anonymous_quantity=anonymous_cart["totalQuantity"],
            observed_anonymous_lines=len(anonymous_cart["items"]),
        )

    with test_log.step("Sign in again and validate deterministic collision handling"):
        assert api.request_magic_link({"name": "Fusión Brasa", "email": email}).status == 200
        second_link = api.latest_local_magic_link(email).json()["data"]["url"]
        assert api.follow_magic_link(second_link).status == 200
        merged_cart = api.cart()["data"]
        test_log.values(
            observed_total_quantity=merged_cart["totalQuantity"],
            observed_line_count=len(merged_cart["items"]),
            observed_line_quantity=merged_cart["items"][0]["quantity"],
            expected_total_quantity=5,
        )
        assert merged_cart["totalQuantity"] == 5
        assert len(merged_cart["items"]) == 1
        assert merged_cart["items"][0]["quantity"] == 5
