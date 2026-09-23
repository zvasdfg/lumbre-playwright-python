import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-022",
    "An anonymous cart uses a protected cookie and persists for the session",
)
def test_anonymous_cart_session_is_persistent(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Initialize an anonymous cart session"):
        response = api.cart_response()
        initial_cart = response.json()["data"]
        set_cookie = response.headers.get("set-cookie", "")
        test_log.values(
            observed_status=response.status,
            observed_initial_cart=initial_cart,
            cookie_is_http_only="HttpOnly" in set_cookie,
            cookie_same_site_lax="SameSite=Lax" in set_cookie,
            cookie_has_path="Path=/" in set_cookie,
            cookie_has_max_age="Max-Age=" in set_cookie,
        )

    with test_log.step("Add a catalog product to the session cart"):
        mutation = api.add_cart_item({"productId": 101, "quantity": 1})
        mutated_cart = mutation.json()["data"]
        test_log.values(
            observed_status=mutation.status,
            observed_product=mutated_cart["items"][0]["name"],
            observed_total_quantity=mutated_cart["totalQuantity"],
        )

    with test_log.step("Read the cart again with the same session"):
        persisted_cart = api.cart()["data"]
        test_log.values(
            observed_items=persisted_cart["items"],
            observed_total=persisted_cart["total"],
            expected_total=740,
        )

        assert response.status == 200
        assert initial_cart == {"items": [], "totalQuantity": 0, "total": 0}
        assert "HttpOnly" in set_cookie
        assert "SameSite=Lax" in set_cookie
        assert "Path=/" in set_cookie
        assert "Max-Age=" in set_cookie
        assert mutation.status == 201
        assert persisted_cart == mutated_cart
        assert persisted_cart["total"] == 740
