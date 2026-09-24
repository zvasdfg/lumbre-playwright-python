from __future__ import annotations

from playwright.sync_api import Page


class AccountModal:
    """Actions and locators for passwordless account access."""

    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("dialog", name="Tu lugar junto al fuego.")
        self.name_input = self.root.get_by_label("Nombre para tu cuenta")
        self.email_input = self.root.get_by_label("Correo de acceso")
        self.request_link_button = self.root.get_by_role(
            "button",
            name="Enviar enlace de acceso",
        )
        self.link_sent_status = self.root.get_by_role("status")
        self.logout_button = self.root.get_by_role("button", name="Cerrar sesión")
        self.order_history = self.root.get_by_test_id("order-history")
        self.reservation_history = self.root.get_by_test_id("reservation-history")

    def request_magic_link(self, *, name: str, email: str) -> None:
        self.name_input.fill(name)
        self.email_input.fill(email)
        self.request_link_button.click()
