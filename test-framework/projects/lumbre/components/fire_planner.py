from __future__ import annotations

from playwright.sync_api import Locator, Page


class FirePlanner:
    """Actions and locators for the embedded fire-planning tool."""

    def __init__(self, page: Page) -> None:
        self.root = page.get_by_test_id("fire-planner")
        self.guests_input = self.root.get_by_label("Personas")
        self.cooking_style_select = self.root.get_by_label("Tipo de cocción")
        self.duration_select = self.root.get_by_label("Duración estimada")
        self.fuel_select = self.root.locator('select[name="fuelType"]')
        self.equipment_select = self.root.get_by_label("Equipo")
        self.weather_select = self.root.get_by_label("Condición exterior")
        self.serving_time_input = self.root.get_by_label("Hora de servicio")
        self.vegetable_reserve_checkbox = self.root.get_by_label(
            "Incluir una reserva para vegetales"
        )
        self.calculate_button = self.root.get_by_role(
            "button",
            name="Construir plan de fuego",
        )
        self.recommendation_status = self.root.get_by_role(
            "status",
            name="Recomendación de combustible",
        )
        self.preset_name_input = self.root.get_by_label("Nombre del preset")
        self.save_preset_button = self.root.get_by_role(
            "button",
            name="Guardar preset",
        )
        self.preset_library = self.root.get_by_test_id("fire-presets")
        self.storage_scope = self.root.get_by_test_id("preset-storage-scope")
        self.preset_message = self.root.locator(".preset-message")

    def configure(
        self,
        *,
        guests: int,
        cooking_style: str,
        duration_hours: int,
        include_vegetables: bool = False,
        fuel: str = "carbon",
        equipment: str = "kettle",
        weather: str = "templado",
        serving_time: str = "15:00",
    ) -> None:
        self.guests_input.fill(str(guests))
        self.cooking_style_select.select_option(cooking_style)
        self.duration_select.select_option(str(duration_hours))
        self.fuel_select.select_option(fuel)
        self.equipment_select.select_option(equipment)
        self.weather_select.select_option(weather)
        self.serving_time_input.fill(serving_time)
        self.vegetable_reserve_checkbox.set_checked(include_vegetables)

    def calculate(self) -> None:
        self.calculate_button.click()

    def save_preset(self, name: str) -> None:
        self.preset_name_input.fill(name)
        self.save_preset_button.click()

    def preset(self, name: str) -> Locator:
        return self.preset_library.locator("article").filter(has_text=name)

    def load_preset(self, name: str) -> None:
        self.preset(name).get_by_role("button", name="Cargar").click()

    def delete_preset(self, name: str) -> None:
        self.preset(name).get_by_role("button", name="Eliminar").click()
