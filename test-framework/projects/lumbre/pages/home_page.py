from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from projects.lumbre.components.account_modal import AccountModal
from projects.lumbre.components.admin_catalog import AdminCatalog
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
        self.admin_catalog = AdminCatalog(page)
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
        self.privacy_link = page.get_by_role("link", name="Privacidad y datos")
        self.fire_planner = FirePlanner(page)

    def filter_recipes(self, label: str) -> None:
        self.page.get_by_role("button", name=label, exact=True).click()

    def search_recipes(self, text: str) -> None:
        self.recipe_search.fill(text)

    def add_product(self, product_name: str) -> None:
        current_quantity = int(self.header.cart_quantity.inner_text())
        with self.page.expect_response(
            lambda response: response.request.method == "POST"
            and "/api/cart/items" in response.url
            and response.status == 201,
        ):
            self.page.get_by_role(
                "button",
                name=f"Agregar {product_name} a la canasta",
            ).click()
        expect(self.header.cart_quantity).to_have_text(str(current_quantity + 1))

    def product_named(self, product_name: str) -> Locator:
        heading = self.page.get_by_role("heading", name=product_name, exact=True)
        return self.product_cards.filter(has=heading)

    def open_membership(self) -> None:
        self.header.open_membership()

    def open_cart(self) -> None:
        self.header.open_cart()

    def open_account(self) -> None:
        self.header.open_account()

    def open_admin_catalog(self) -> None:
        self.open_account()
        self.account.admin_catalog_button.click()

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

    def open_privacy_notice(self) -> None:
        self.privacy_link.click()
