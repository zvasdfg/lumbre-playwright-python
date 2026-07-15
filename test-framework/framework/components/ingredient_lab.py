from __future__ import annotations

from playwright.sync_api import Locator, Page


class IngredientLab:
    """Actions and locators for the ingredient experiment laboratory."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.root = page.locator("#laboratorio")
        self.search_input = self.root.get_by_label("Buscar componente")
        self.family_select = self.root.get_by_label("Familia")
        self.catalog_status = self.root.locator(".catalog-status")
        self.catalog = self.root.get_by_test_id("ingredient-catalog")
        self.ingredient_cards = self.catalog.get_by_test_id("ingredient-card")
        self.selected_ingredients = self.root.get_by_role(
            "list",
            name="Componentes seleccionados",
        )
        self.selected_items = self.selected_ingredients.locator("li:not(.empty-slot)")
        self.objective_select = self.root.get_by_label("Objetivo de la prueba")
        self.create_protocol_button = self.root.get_by_role(
            "button",
            name="Crear protocolo",
        )
        self.selection_limit = self.root.locator(".bench-limit")
        self.protocol_result = self.root.locator(".protocol-result")
        self.registry = self.root.get_by_test_id("hypothesis-registry")
        self.hypothesis_cards = self.registry.locator("article.hypothesis-card")

    def search(self, text: str) -> None:
        self.search_input.fill(text)

    def filter_by_family(self, family: str) -> None:
        self.family_select.select_option(family)

    def ingredient_card(self, ingredient_name: str) -> Locator:
        return self.ingredient_cards.filter(
            has=self.page.get_by_role("heading", name=ingredient_name, exact=True)
        )

    def open_ingredient(self, ingredient_name: str) -> None:
        self.ingredient_card(ingredient_name).get_by_role(
            "button",
            name=f"Inspeccionar {ingredient_name}",
        ).click()

    def ingredient_dialog(self, ingredient_name: str) -> Locator:
        return self.page.get_by_role("dialog").filter(
            has=self.page.get_by_role("heading", name=ingredient_name, exact=True)
        )

    def add_ingredient(self, ingredient_name: str) -> None:
        self.ingredient_card(ingredient_name).get_by_role(
            "button",
            name="Agregar",
            exact=True,
        ).click()

    def add_open_ingredient_to_formula(self, ingredient_name: str) -> None:
        self.ingredient_dialog(ingredient_name).get_by_role(
            "button",
            name="Agregar a la fórmula",
        ).click()

    def selected_ingredient(self, ingredient_name: str) -> Locator:
        return self.selected_ingredients.get_by_role("listitem").filter(has_text=ingredient_name)

    def remove_selected_ingredient(self, ingredient_name: str) -> None:
        self.selected_ingredient(ingredient_name).get_by_role(
            "button",
            name=f"Retirar {ingredient_name}",
        ).click()

    def select_objective(self, objective: str) -> None:
        self.objective_select.select_option(label=objective)

    def create_protocol(self) -> None:
        self.create_protocol_button.click()

    def hypothesis_card(self, hypothesis_id: str) -> Locator:
        return self.hypothesis_cards.filter(has=self.page.get_by_text(hypothesis_id, exact=True))

    def open_hypothesis(self, hypothesis_id: str) -> None:
        self.hypothesis_card(hypothesis_id).get_by_role(
            "button",
            name="Abrir ficha",
        ).click()

    def hypothesis_dialog(self, hypothesis_id: str) -> Locator:
        return self.page.get_by_role("dialog").filter(
            has=self.page.get_by_role("heading", name=hypothesis_id, exact=True)
        )
