import re

import pytest
from playwright.sync_api import expect

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
    with test_log.step("Prepare an authenticated order for hosted checkout"):
        authenticated_home.add_product("Blend LHC-003 · SPG clásico")
        authenticated_home.open_cart()
        authenticated_home.cart.checkout()
        expect(authenticated_home.checkout.root).to_be_visible()
        test_log.values(observed_checkout_visible=True, expected_cart_total="$260")

    with test_log.step("Request the hosted Checkout Session from the browser"):
        with authenticated_home.page.expect_response(
            lambda response: "/checkout-session" in response.url and response.status == 201
        ) as response_info:
            authenticated_home.checkout.hosted_checkout_button.click()
        response = response_info.value
        provider_session = response.json()["data"]["providerSessionId"]
        test_log.values(
            observed_status=response.status,
            observed_provider_session=provider_session,
            provider="stripe",
        )
        assert provider_session.startswith("cs_test_")

    with test_log.step("Validate navigation uses the provider URL returned by the API"):
        expect(authenticated_home.page).to_have_url(
            re.compile(rf"\?checkout=sandbox&session_id={re.escape(provider_session)}$")
        )
        test_log.values(
            observed_redirect_url=authenticated_home.page.url,
            expected_provider_session=provider_session,
        )
