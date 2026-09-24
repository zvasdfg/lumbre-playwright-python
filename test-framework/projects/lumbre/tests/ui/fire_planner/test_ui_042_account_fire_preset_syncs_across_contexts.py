import pytest
from playwright.sync_api import Browser, StorageState, expect

from automation.core.reporting import TestLogger
from projects.lumbre.components.fire_planner import FirePlanner
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-042",
    "An authenticated fire preset is restored in a second browser context",
)
def test_account_fire_preset_syncs_across_contexts(
    authenticated_home: HomePage,
    authenticated_storage_state: StorageState,
    browser: Browser,
    app_url: str,
    test_log: TestLogger,
) -> None:
    preset_name = "Fuego sincronizado"

    with test_log.step("Save a fire preset to the authenticated account"):
        authenticated_home.open_fire_planner()
        planner = authenticated_home.fire_planner
        expect(planner.storage_scope).to_have_text("MEMORIA DE CUENTA")
        planner.configure(
            guests=12,
            cooking_style="lento",
            duration_hours=6,
            fuel="lena",
            equipment="ahumador",
            weather="frio",
            serving_time="18:30",
        )
        planner.save_preset(preset_name)
        expect(planner.preset(preset_name)).to_be_visible()
        expect(planner.preset_message).to_contain_text("sincronizado con tu cuenta")
        test_log.values(
            saved_preset=preset_name,
            observed_storage_scope=planner.storage_scope.inner_text(),
        )

    secondary_context = browser.new_context(
        storage_state=authenticated_storage_state,
        locale="es-MX",
        viewport={"width": 1440, "height": 1000},
    )
    try:
        with test_log.step("Open a second browser context with the same Playwright storage state"):
            secondary_page = secondary_context.new_page()
            secondary_page.goto(f"{app_url}/#planificador")
            expect(secondary_page.locator("main")).to_have_attribute("data-app-ready", "true")
            secondary_planner = FirePlanner(secondary_page)
            expect(secondary_planner.storage_scope).to_have_text("MEMORIA DE CUENTA")

        with test_log.step("Validate that the account preset is available and loadable"):
            expect(secondary_planner.preset(preset_name)).to_be_visible()
            secondary_planner.load_preset(preset_name)
            expect(secondary_planner.guests_input).to_have_value("12")
            expect(secondary_planner.cooking_style_select).to_have_value("lento")
            expect(secondary_planner.fuel_select).to_have_value("lena")
            test_log.values(
                restored_preset=preset_name,
                observed_guests=secondary_planner.guests_input.input_value(),
                observed_cooking_style=secondary_planner.cooking_style_select.input_value(),
                observed_fuel=secondary_planner.fuel_select.input_value(),
            )
    finally:
        secondary_context.close()
