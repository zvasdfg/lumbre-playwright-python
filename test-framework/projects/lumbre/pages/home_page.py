from __future__ import annotations

from playwright.sync_api import Locator, Page

from projects.lumbre.components.account_modal import AccountModal
from projects.lumbre.components.cart_drawer import CartDrawer
from projects.lumbre.components.checkout_modal import CheckoutModal
from projects.lumbre.components.event_reservation_modal import EventReservationModal
from projects.lumbre.components.events_section import EventsSection
from projects.lumbre.components.fire_planner import FirePlanner
from projects.lumbre.components.header import Header
from projects.lumbre.components.ingredient_lab import IngredientLab
from projects.lumbre.components.membership_modal import MembershipModal
from projects.lumbre.components.toast_notification import ToastNotification
from projects.lumbre.pages.base_page import BasePage


class HomePage(BasePage):
    path = "/"

    def __init__(self, page: Page, base_url: str) -> None:
        super().__init__(page, base_url)
        self.header = Header(page)
        self.account = AccountModal(page)
        self.cart = CartDrawer(page)
        self.checkout = CheckoutModal(page)
        self.events = EventsSection(page)
        self.event_reservation = EventReservationModal(page)
        self.membership = MembershipModal(page)
        self.ingredient_lab = IngredientLab(page)
        self.toast = ToastNotification(page)
        self.hero_title = page.get_by_role("heading", name="El fuego nos reúne.")
        self.recipe_cards = page.get_by_test_id("recipe-card")
        self.recipe_art = self.recipe_cards.locator(".recipe-art")
        self.recipe_images = self.recipe_cards.locator(".recipe-art img")
        self.recipe_search = page.get_by_placeholder("Buscar receta...")
        self.product_cards = page.get_by_test_id("product-card")
        self.product_images = self.product_cards.locator(".product-art img")
        self.fire_planner = FirePlanner(page)

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

    def open_account(self) -> None:
        self.header.open_account()

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
