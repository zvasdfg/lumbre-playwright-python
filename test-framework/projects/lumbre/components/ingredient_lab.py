"""Ingredient-family interactions without assertions or calculation logic."""


class IngredientLab:
    def __init__(self, page):
        self.page = page

    def open(self):
        self.page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()

    def card(self, ingredient_id):
        return self.page.get_by_test_id("ingredient-card").filter(
            has=self.page.locator(f'[data-ingredient-id="{ingredient_id}"]')
        )

    def family(self, card):
        return self.page.locator("details.ingredient-family-group").filter(has=card)

    def expand(self, group):
        if group.get_attribute("open") is None:
            group.locator("summary").click()

    def add(self, ingredient_id):
        card = self.card(ingredient_id)
        self.expand(self.family(card))
        card.get_by_role("button", name="Agregar", exact=True).click()

    def save(self, title):
        self.page.get_by_label("Nombre de tu blend", exact=True).fill(title)
        self.page.get_by_role("button", name="Guardar en esta sesión", exact=True).click()

    def close_sheet(self):
        self.page.get_by_role("button", name="Cerrar ficha técnica", exact=True).click()

    def set_grams(self, ingredient_id, value):
        name = self.card(ingredient_id).locator("h3").text_content()
        self.page.get_by_label(f"Gramos de {name}", exact=True).fill(str(value))
