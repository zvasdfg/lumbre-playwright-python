from urllib.parse import urljoin

import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-037",
    "A visitor signs in through the passwordless account experience",
)
def test_visitor_signs_in_with_magic_link(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    name = "Ana Fogata"
    email = "ana.fogata@example.test"

    with test_log.step("Request an account access link"):
        home.open_account()
        home.account.request_magic_link(name=name, email=email)
        expect(home.account.link_sent_status).to_contain_text("Revisa tu correo")
        test_log.values(
            submitted_name=name,
            submitted_email=email,
            observed_status=home.account.link_sent_status.inner_text(),
        )

    with test_log.step("Open the deterministic link in the same browser context"):
        delivery = home.page.request.get(
            urljoin(home.page.url, "/api/local/auth/magic-link"),
            params={"email": email},
        )
        magic_link = delivery.json()["data"]["url"]
        home.page.goto(magic_link)
        expect(home.page.locator("main")).to_have_attribute("data-app-ready", "true")
        test_log.values(
            observed_delivery_status=delivery.status,
            magic_link_was_delivered=bool(magic_link),
        )

    with test_log.step("Validate the authenticated account in the portal"):
        account_button = home.page.get_by_role("button", name="Ana", exact=True)
        expect(account_button).to_be_visible()
        account_button.click()
        expect(home.account.root).to_contain_text(name)
        expect(home.account.root).to_contain_text(email)
        expect(home.account.root).to_contain_text("Perfil: cliente")
        test_log.values(
            observed_account_name=name,
            observed_account_email=email,
            observed_role="cliente",
        )
