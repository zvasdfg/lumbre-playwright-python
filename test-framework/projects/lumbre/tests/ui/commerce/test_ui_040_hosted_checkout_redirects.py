import re

import pytest
from playwright.sync_api import Route, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-040",
    "An authenticated shopper is redirected to the provider-hosted Checkout Session",
)
def test_hosted_checkout_redirects(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    provider_session = "cs_test_lumbre_ui_040"
    checkout_url = f"{authenticated_home.base_url}/?checkout=sandbox&session_id={provider_session}"

    def hosted_checkout_response(route: Route) -> None:
        route.fulfill(
            status=201,
            json={
                "data": {
                    "orderId": "00000000-0000-4000-8000-000000000040",
                    "provider": "stripe",
                    "providerSessionId": provider_session,
                    "checkoutUrl": checkout_url,
                    "status": "open",
                },
                "created": True,
            },
        )

    authenticated_home.page.route(
        "**/api/orders/*/checkout-session",
        hosted_checkout_response,
    )

    with test_log.step("Prepare an authenticated order for hosted checkout"):
        authenticated_home.add_product("Blend LHC-003 · SPG clásico")
        authenticated_home.open_cart()
        authenticated_home.cart.checkout()
        expect(authenticated_home.checkout.root).to_be_visible()
        test_log.values(observed_checkout_visible=True, expected_cart_total="$260")

    with test_log.step("Request the hosted Checkout Session from the browser"):
        with authenticated_home.page.expect_request(
            lambda request: "/checkout-session" in request.url,
        ) as request_info:
            authenticated_home.checkout.hosted_checkout_button.click()
        request = request_info.value
        test_log.values(
            observed_request_method=request.method,
            observed_request_url=request.url,
            observed_provider_session=provider_session,
            provider="stripe",
        )
        assert request.method == "POST"

    with test_log.step("Validate navigation uses the provider URL returned by the API"):
        expect(authenticated_home.page).to_have_url(
            re.compile(rf"\?checkout=sandbox&session_id={re.escape(provider_session)}$")
        )
        test_log.values(
            observed_redirect_url=authenticated_home.page.url,
            expected_provider_session=provider_session,
        )
