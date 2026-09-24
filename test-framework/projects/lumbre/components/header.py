from __future__ import annotations

from playwright.sync_api import Page


class Header:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.join_button = page.get_by_role("button", name="Únete al fuego")
        self.cart_button = page.get_by_role("button", name=r"Abrir canasta")
        self.cart_quantity = self.cart_button.locator("span")
        self.account_button = page.get_by_test_id("account-button")

    def open_membership(self) -> None:
        self.join_button.click()

    def open_cart(self) -> None:
        self.cart_button.click()

    def open_account(self) -> None:
        self.account_button.click()

    def open_membership_with_keyboard(self) -> None:
        self.join_button.focus()
        self.join_button.press("Enter")
