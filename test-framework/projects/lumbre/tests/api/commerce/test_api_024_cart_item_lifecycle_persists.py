import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-024",
    "Repeated adds, quantity updates, and removal persist in the anonymous cart",
)
def test_cart_item_lifecycle_persists(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Add the same product twice to the anonymous cart"):
        first_response = api.add_cart_item({"productId": 101, "quantity": 1})
        second_response = api.add_cart_item({"productId": 101, "quantity": 2})
        cart_after_repeated_adds = second_response.json()["data"]
        test_log.values(
            observed_first_status=first_response.status,
            observed_second_status=second_response.status,
            observed_items=cart_after_repeated_adds["items"],
            observed_total_quantity=cart_after_repeated_adds["totalQuantity"],
            expected_total_quantity=3,
        )

        assert first_response.status == 201
        assert second_response.status == 201
        assert len(cart_after_repeated_adds["items"]) == 1
        assert cart_after_repeated_adds["items"][0]["quantity"] == 3

    with test_log.step("Replace the persisted line-item quantity"):
        update_response = api.update_cart_item(101, 4)
        updated_cart = update_response.json()["data"]
        test_log.values(
            observed_status=update_response.status,
            observed_quantity=updated_cart["items"][0]["quantity"],
            observed_line_total=updated_cart["items"][0]["lineTotal"],
            observed_cart_total=updated_cart["total"],
            expected_cart_total=2960,
        )

        assert update_response.status == 200
        assert updated_cart["items"][0]["quantity"] == 4
        assert updated_cart["items"][0]["lineTotal"] == 2960
        assert api.cart()["data"] == updated_cart

    with test_log.step("Remove the persisted line item"):
        remove_response = api.remove_cart_item(101)
        removed_cart = remove_response.json()["data"]
        persisted_cart = api.cart()["data"]
        test_log.values(
            observed_status=remove_response.status,
            observed_removed_cart=removed_cart,
            observed_persisted_cart=persisted_cart,
        )

        assert remove_response.status == 200
        assert removed_cart == {"items": [], "totalQuantity": 0, "total": 0}
        assert persisted_cart == removed_cart
