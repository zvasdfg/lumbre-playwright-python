import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-038",
    "A prepared Playwright storage state opens the portal as an authenticated customer",
)
def test_authenticated_storage_state_restores_account(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open the account restored from Playwright storage state"):
        expect(
            authenticated_home.page.get_by_role("button", name="Cliente", exact=True),
        ).to_be_visible()
        authenticated_home.open_account()
        test_log.values(
            observed_account_button="Cliente",
            storage_state_restored=True,
        )

    with test_log.step("Validate the restored customer identity"):
        expect(authenticated_home.account.root).to_contain_text("Cliente Fixture")
        expect(authenticated_home.account.root).to_contain_text(
            "fixture.customer@example.test",
        )
        expect(authenticated_home.account.root).to_contain_text("Perfil: cliente")
        test_log.values(
            observed_name="Cliente Fixture",
            observed_email="fixture.customer@example.test",
            observed_role="cliente",
        )
