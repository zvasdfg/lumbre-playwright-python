from __future__ import annotations

from playwright.sync_api import Page


class FirePlannerModal:
    """Actions and locators for the fire planner dialog."""

    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role(
            "dialog",
            name="Calcula tu fuego.",
        )
        self.guests_input = self.root.get_by_label("Personas")
        self.cooking_style_select = self.root.get_by_label("Tipo de cocción")
        self.duration_select = self.root.get_by_label("Duración estimada")
        self.vegetable_reserve_checkbox = self.root.get_by_label(
            "Incluir una reserva para vegetales"
        )
        self.calculate_button = self.root.get_by_role(
            "button",
            name="Calcular combustible",
        )
        self.recommendation_status = self.root.get_by_role(
            "status",
            name="Recomendación de combustible",
        )

    def configure(
        self,
        *,
        guests: int,
        cooking_style: str,
        duration_hours: int,
        include_vegetables: bool = False,
    ) -> None:
        self.guests_input.fill(str(guests))
        self.cooking_style_select.select_option(cooking_style)
        self.duration_select.select_option(str(duration_hours))
        self.vegetable_reserve_checkbox.set_checked(include_vegetables)

    def calculate(self) -> None:
        self.calculate_button.click()
