import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-049",
    "Deactivating an event removes it from the retained public event catalog",
)
def test_deactivated_event_leaves_public_agenda(
    administrator_home: HomePage,
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    event_id = 203
    event_title = "Humo y fermentos"

    with test_log.step("Select an active event in catalog administration"):
        public_event_ids = [item["id"] for item in administrator_api.events()["data"]]
        assert event_id in public_event_ids
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

    with test_log.step("Validate that the public API projection excludes the event"):
        admin.close()
        public_event_ids = [item["id"] for item in administrator_api.events()["data"]]
        test_log.values(
            public_event_ids=public_event_ids,
            removed_event_id=event_id,
        )
        assert event_id not in public_event_ids
