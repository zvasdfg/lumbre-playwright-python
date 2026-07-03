from __future__ import annotations

from playwright.sync_api import Page


class MembershipModal:
    """Actions and locators for the membership dialog."""

    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("dialog", name="Enciende tu primera brasa.")
        self.name_input = self.root.get_by_label("Nombre completo")
        self.email_input = self.root.get_by_label("Correo electrónico")
        self.experience_select = self.root.get_by_label("Experiencia")
        self.terms_checkbox = self.root.get_by_label("Acepto recibir novedades del club.")
        self.submit_button = self.root.get_by_role("button", name="Unirme al club")
        self.close_button = self.root.get_by_role("button", name="Cerrar")
        self.backdrop = page.locator(".modal-backdrop").filter(has=self.root)

    def complete(
        self,
        *,
        name: str,
        email: str,
        experience: str = "intermedio",
    ) -> None:
        self.name_input.fill(name)
        self.email_input.fill(email)
        self.experience_select.select_option(experience)

    def accept_terms(self) -> None:
        self.terms_checkbox.check()

    def submit(self) -> None:
        self.submit_button.click()

    def close_by_button(self) -> None:
        self.close_button.click()

    def close_by_backdrop(self) -> None:
        self.backdrop.click(position={"x": 8, "y": 8})

    def close(self, method: str) -> None:
        if method == "button":
            self.close_by_button()
        elif method == "backdrop":
            self.close_by_backdrop()
        else:
            raise ValueError(f"Unknown close method: {method}")
