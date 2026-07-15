from __future__ import annotations

from playwright.sync_api import Locator, Page

from framework.components.cart_drawer import CartDrawer
from framework.components.event_reservation_modal import EventReservationModal
from framework.components.events_section import EventsSection
from framework.components.fire_planner_modal import FirePlannerModal
from framework.components.header import Header
from framework.components.ingredient_lab import IngredientLab
from framework.components.membership_modal import MembershipModal
from framework.pages.base_page import BasePage


class HomePage(BasePage):
    path = "/"

    def __init__(self, page: Page, base_url: str) -> None:
        super().__init__(page, base_url)
        self.header = Header(page)
        self.cart = CartDrawer(page)
        self.events = EventsSection(page)
        self.event_reservation = EventReservationModal(page)
        self.membership = MembershipModal(page)
        self.ingredient_lab = IngredientLab(page)
        self.hero_title = page.get_by_role("heading", name="El fuego nos reúne.")
        self.recipe_cards = page.get_by_test_id("recipe-card")
        self.recipe_search = page.get_by_placeholder("Buscar receta...")
        self.status_message = page.get_by_role("status")
        self.fire_planner = FirePlannerModal(page)

    def filter_recipes(self, label: str) -> None:
        self.page.get_by_role("button", name=label, exact=True).click()

    def search_recipes(self, text: str) -> None:
        self.recipe_search.fill(text)

    def add_product(self, product_name: str) -> None:
        self.page.get_by_role("button", name=f"Agregar {product_name} a la canasta").click()

    def open_membership(self) -> None:
        self.header.open_membership()

    def open_cart(self) -> None:
        self.header.open_cart()

    def register_member(self, *, name: str, email: str, experience: str = "intermedio") -> None:
        self.open_membership()
        self.membership.complete(name=name, email=email, experience=experience)
        self.membership.accept_terms()
        self.membership.submit()

    def recipe_named(self, name: str) -> Locator:
        return self.recipe_cards.filter(has=self.page.get_by_role("heading", name=name))

    def view_recipe(self, name: str) -> None:
        self.recipe_named(name).get_by_role("button", name=f"Ver receta {name}").click()

    def open_fire_planner(self) -> None:
        self.page.get_by_role(
            "button",
            name="Planear mi fuego",
        ).click()

    def open_membership_with_keyboard(self) -> None:
        self.header.open_membership_with_keyboard()
