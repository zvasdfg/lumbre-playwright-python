import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-033",
    "A saved fire-planner preset can be restored after a page reload",
)
def test_fire_planner_presets_persist(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    planner = home.fire_planner
    preset_name = "Asado de prueba"

    with test_log.step("Configure and save a named fire plan"):
        home.open_fire_planner()
        planner.configure(
            guests=10,
            cooking_style="dos_zonas",
            duration_hours=4,
            include_vegetables=True,
            fuel="briquetas",
            equipment="kettle",
            weather="viento",
            serving_time="16:30",
        )
        planner.save_preset(preset_name)
        expect(planner.preset(preset_name)).to_be_visible()
        test_log.values(
            saved_preset=preset_name,
            guests=10,
            cooking_style="dos_zonas",
            fuel="briquetas",
            weather="viento",
        )

    with test_log.step("Change the planner and restore the saved preset"):
        planner.configure(
            guests=2,
            cooking_style="directo",
            duration_hours=2,
        )
        planner.load_preset(preset_name)
        expect(planner.guests_input).to_have_value("10")
        expect(planner.cooking_style_select).to_have_value("dos_zonas")
        expect(planner.duration_select).to_have_value("4")
        expect(planner.fuel_select).to_have_value("briquetas")
        expect(planner.weather_select).to_have_value("viento")
        expect(planner.serving_time_input).to_have_value("16:30")
        expect(planner.vegetable_reserve_checkbox).to_be_checked()

    with test_log.step("Reload and validate browser-local persistence"):
        home.page.reload(wait_until="domcontentloaded")
        expect(planner.preset(preset_name)).to_be_visible()
        test_log.values(
            persisted_preset=preset_name,
            storage_scope="current browser",
        )
