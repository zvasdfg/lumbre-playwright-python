"""Page composition for the current static portal; actions without assertions."""

from playwright.sync_api import Page

from projects.lumbre.components.fire_planner import FirePlanner
from projects.lumbre.components.ingredient_lab import IngredientLab


class HomePage:
    def __init__(self, page: Page, base_url: str):
        self.page = page
        self.base_url = base_url.rstrip("/")
        self.hero_title = page.get_by_role("heading", name="El fuego nos reúne.", exact=True)
        self.recipe_cards = page.get_by_test_id("recipe-card")
        self.product_cards = page.get_by_test_id("product-card")
        self.ingredient_lab = IngredientLab(page)
        self.fire_planner = FirePlanner(page)

    def open(self):
        self.page.goto(self.base_url + "/")

    def filter_recipes(self, label):
        self.page.get_by_role("button", name=label, exact=True).click()

    def search_recipes(self, text):
        self.page.get_by_placeholder("Buscar receta...", exact=True).fill(text)

    def recipe_named(self, name):
        return self.recipe_cards.filter(has=self.page.get_by_role("heading", name=name, exact=True))

    def product_named(self, name):
        return self.product_cards.filter(
            has=self.page.get_by_role("heading", name=name, exact=True)
        )
