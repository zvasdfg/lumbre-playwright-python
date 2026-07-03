from __future__ import annotations

from playwright.sync_api import Page


class Header:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.join_button = page.get_by_role("button", name="Únete al fuego")
        self.cart_button = page.get_by_role("button", name=r"Abrir canasta")

    def open_membership(self) -> None:
        self.join_button.click()

    def open_cart(self) -> None:
        self.cart_button.click()
