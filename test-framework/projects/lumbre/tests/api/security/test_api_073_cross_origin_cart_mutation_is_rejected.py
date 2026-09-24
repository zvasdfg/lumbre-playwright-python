import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-073",
    "Cross-site browser mutations cannot create cart state",
)
def test_cross_origin_cart_mutation_is_rejected(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Submit a cart mutation from a cross-site browser context"):
        response = api.add_cart_item(
            {"productId": 101, "quantity": 1},
            headers={
                "Sec-Fetch-Site": "cross-site",
            },
        )
        payload = response.json()
        test_log.values(
            observed_status=response.status,
            observed_error=payload["error"],
            observed_request_id=response.headers.get("x-request-id"),
            observed_set_cookie=response.headers.get("set-cookie"),
        )

    with test_log.step("Confirm no anonymous cart was allocated"):
        cart_response = api.cart_response()
        test_log.values(
            observed_cart=cart_response.json()["data"],
            observed_set_cookie=cart_response.headers.get("set-cookie"),
        )

        assert response.status == 403
        assert payload["error"] == "Cross-origin mutation rejected"
        assert payload["requestId"] == response.headers["x-request-id"]
        assert response.headers.get("set-cookie") is None
        assert cart_response.json()["data"] == {
            "items": [],
            "totalQuantity": 0,
            "total": 0,
        }
        assert cart_response.headers.get("set-cookie") is None
