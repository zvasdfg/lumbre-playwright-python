import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


def sign_in(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    link = api.latest_local_magic_link(email).json()["data"]["url"]
    assert api.follow_magic_link(link).status == 200


@pytest.mark.api
@pytest.mark.case(
    "API-068",
    "An account cannot observe or cancel another account's order",
)
def test_order_cancellation_is_owner_scoped(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Create an order owned by the first account"):
        sign_in(api, name="Primera Cuenta", email="primer.pedido@example.test")
        api.add_cart_item({"productId": 112, "quantity": 1})
        order = api.create_order(
            {
                "customerName": "Primera Cuenta",
                "customerEmail": "primer.pedido@example.test",
            },
            "private-order",
        ).json()["data"]
        assert api.logout().status == 200

    with test_log.step("Reject cancellation without an authenticated account"):
        anonymous = api.cancel_order(order["id"], "anonymous-cancellation")
        test_log.values(observed_status=anonymous.status, expected_status=401)
        assert anonymous.status == 401

    with test_log.step("Sign in as a different account and attempt cancellation"):
        sign_in(api, name="Segunda Cuenta", email="segundo.pedido@example.test")
        read = api.order(order["id"])
        cancellation = api.cancel_order(order["id"], "foreign-cancellation")
        test_log.values(
            foreign_order_id=order["id"],
            observed_read_status=read.status,
            observed_cancellation_status=cancellation.status,
        )
        assert read.status == 404
        assert cancellation.status == 404
