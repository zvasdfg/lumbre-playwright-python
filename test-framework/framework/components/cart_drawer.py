from __future__ import annotations

from playwright.sync_api import Locator, Page


class CartDrawer:
    """Actions and locators for the shopping cart drawer."""

    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("dialog", name="Tu canasta")
        self.items = self.root.locator("li")
        self.total = self.root.locator(".cart-total strong")
        self.empty_state = self.root.get_by_text("Todavía no agregas nada. El fuego puede esperar.")
        self.checkout_button = self.root.get_by_role("button", name="Continuar compra")

    def product_named(self, product_name: str) -> Locator:
        return self.root.get_by_text(product_name, exact=True)

    def remove_product(self, product_name: str) -> None:
        self.root.get_by_role(
            "button",
            name=f"Eliminar {product_name}",
        ).click()

    def checkout(self) -> None:
        self.checkout_button.click()
