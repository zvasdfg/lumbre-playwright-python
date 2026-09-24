import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-071",
    "An administrator advances paid fulfillment without skipping or replaying transitions",
)
def test_fulfillment_advances_in_order(
    administrator_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    administrator_api.add_cart_item({"productId": 112, "quantity": 1})
    order = administrator_api.create_order(
        {
            "customerName": "Administración Lumbre",
            "customerEmail": "admin@lumbre.example.test",
        },
        "fulfillment-order",
    ).json()["data"]
    assert administrator_api.pay_order(
        order["id"],
        "success",
        "fulfillment-payment",
    ).status == 200

    with test_log.step("Reject a fulfillment state that skips preparation"):
        skipped = administrator_api.update_order_fulfillment(order["id"], "fulfilled")
        test_log.values(observed_status=skipped.status, observed_error=skipped.json()["error"])
        assert skipped.status == 409

    with test_log.step("Advance through preparation with replay safety"):
        processing = administrator_api.update_order_fulfillment(order["id"], "processing")
        replay = administrator_api.update_order_fulfillment(order["id"], "processing")
        test_log.values(
            first_changed=processing.json()["changed"],
            replay_changed=replay.json()["changed"],
            observed_status=replay.json()["data"]["fulfillmentStatus"],
        )
        assert processing.status == 200
        assert processing.json()["changed"] is True
        assert replay.json()["changed"] is False
        assert replay.json()["data"]["fulfillmentStatus"] == "processing"

    with test_log.step("Complete fulfillment and validate its audit evidence"):
        fulfilled = administrator_api.update_order_fulfillment(order["id"], "fulfilled")
        body = fulfilled.json()
        audit = [
            event
            for event in administrator_api.administrative_audit_events().json()["data"]
            if event["resourceType"] == "order" and event["resourceId"] == order["id"]
        ]
        test_log.values(
            observed_fulfillment_status=body["data"]["fulfillmentStatus"],
            fulfilled_at=body["data"]["fulfilledAt"],
            observed_audit=audit,
        )
        assert body["data"]["fulfillmentStatus"] == "fulfilled"
        assert body["data"]["fulfilledAt"] is not None
        assert [event["after"]["fulfillmentStatus"] for event in reversed(audit)] == [
            "processing",
            "fulfilled",
        ]
        openapi_contract.validate_response(
            "/api/admin/orders/{id}/fulfillment",
            "patch",
            fulfilled.status,
            body,
        )
