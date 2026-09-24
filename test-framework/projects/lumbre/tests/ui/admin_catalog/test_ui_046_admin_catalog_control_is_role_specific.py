import pytest
from playwright.sync_api import Browser, StorageState, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-046",
    "Catalog administration is visible to administrators but not customers",
)
def test_admin_catalog_control_is_role_specific(
    administrator_home: HomePage,
    authenticated_storage_state: StorageState,
    browser: Browser,
    app_url: str,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open the account as an administrator"):
        administrator_home.open_account()
        expect(administrator_home.account.admin_catalog_button).to_be_visible()
        test_log.values(
            administrator_control_visible=True,
            expected_accessible_name="Administrar catálogo",
        )

    customer_context = browser.new_context(
        storage_state=authenticated_storage_state,
        locale="es-MX",
        viewport={"width": 1440, "height": 1000},
    )
    try:
        with test_log.step("Open the same account surface as a customer"):
            customer_page = customer_context.new_page()
            customer_home = HomePage(customer_page, app_url)
            customer_home.open()
            customer_home.open_account()

        with test_log.step("Validate that the customer receives no administration control"):
            expect(customer_home.account.admin_catalog_button).to_have_count(0)
            test_log.values(
                customer_control_count=customer_home.account.admin_catalog_button.count(),
                expected_control_count=0,
            )
    finally:
        customer_context.close()
