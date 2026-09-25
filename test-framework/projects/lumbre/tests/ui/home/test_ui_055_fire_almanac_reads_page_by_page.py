import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-055",
    "The floating fire almanac opens on its cover and supports page-by-page reading",
)
def test_fire_almanac_reads_page_by_page(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    almanac = home.fire_almanac

    with test_log.step("Validate that Agenda is hidden and the Almanac remains available"):
        expect(home.page.locator("#agenda")).to_have_count(0)
        expect(home.page.get_by_role("link", name="Agenda", exact=True)).to_have_count(0)
        expect(almanac.trigger).to_be_visible()
        test_log.values(
            observed_agenda_sections=home.page.locator("#agenda").count(),
            observed_almanac_trigger=almanac.trigger.inner_text(),
        )

    with test_log.step("Open the Almanac on its branded cover"):
        almanac.open()
        expect(almanac.dialog).to_be_visible()
        expect(almanac.page_status).to_have_text("PORTADA")
        expect(almanac.previous_page).to_be_disabled()
        test_log.values(
            observed_page=almanac.page_status.inner_text(),
            observed_cover_page=almanac.page_surface.get_attribute("data-page"),
        )

    with test_log.step("Open the first note and turn to the next page"):
        almanac.open_first_page()
        expect(almanac.page_status).to_have_text("DOC. 001 · Prepara tu asador")
        expect(
            almanac.dialog.get_by_role(
                "img",
                name="Infografía para preparar, limpiar y encender un asador",
            )
        ).to_be_visible()
        almanac.next_page.click()
        expect(almanac.page_status).to_have_text("DOC. 002 · Selección de carbón")
        test_log.values(observed_page_after_turn=almanac.page_status.inner_text())

    with test_log.step("Jump to the final document and enable reading zoom"):
        almanac.go_to_document("015", "Tamaño de partícula")
        expect(almanac.page_status).to_have_text("DOC. 015 · Tamaño de partícula")
        expect(almanac.next_page).to_be_disabled()
        almanac.zoom.click()
        expect(almanac.dialog.get_by_role("button", name="Ajustar página")).to_have_attribute(
            "aria-pressed", "true"
        )
        test_log.values(
            observed_final_page=almanac.page_status.inner_text(),
            observed_zoom_enabled=True,
        )

    with test_log.step("Close with Escape and return focus to the floating trigger"):
        almanac.close_with_keyboard()
        expect(almanac.dialog).to_have_count(0)
        expect(almanac.trigger).to_be_focused()
