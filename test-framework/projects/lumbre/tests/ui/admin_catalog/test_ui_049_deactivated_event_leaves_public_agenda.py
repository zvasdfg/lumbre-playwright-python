import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-049",
    "Deactivating an event removes it from the public agenda",
)
def test_deactivated_event_leaves_public_agenda(
    administrator_home: HomePage,
    test_log: TestLogger,
) -> None:
    event_id = 203
    event_title = "Humo y fermentos"

    with test_log.step("Select an active event in catalog administration"):
        expect(administrator_home.events.event_named(event_title)).to_be_visible()
        administrator_home.open_admin_catalog()
        admin = administrator_home.admin_catalog
        expect(admin.event(event_id)).to_be_visible()
        admin.select_event(event_id)
        expect(admin.event_active_checkbox).to_be_checked()
        test_log.values(
            event_id=event_id,
            event_title=event_title,
            observed_active=True,
        )

    with test_log.step("Deactivate and save the selected event"):
        admin.set_event_active(False)
        expect(admin.message).to_have_text("Encuentro actualizado.")
        expect(admin.event(event_id)).to_contain_text("Inactivo")
        test_log.values(
            observed_confirmation=admin.message.inner_text(),
            observed_record=admin.event(event_id).inner_text(),
        )

    with test_log.step("Validate that the refreshed public agenda excludes the event"):
        admin.close()
        expect(administrator_home.events.event_named(event_title)).to_have_count(0)
        test_log.values(
            observed_public_event_count=administrator_home.events.event_named(
                event_title,
            ).count(),
            expected_public_event_count=0,
        )
