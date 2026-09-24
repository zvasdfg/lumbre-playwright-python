from __future__ import annotations

from playwright.sync_api import Page


class CheckoutModal:
    """Customer checkout and deterministic local payment controls."""

    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("dialog", name="Confirma tus provisiones.")
        self.name_input = self.root.get_by_label("Nombre de entrega")
        self.email_input = self.root.get_by_label("Correo de confirmación")
        self.delivery_notes = self.root.get_by_label("Notas de entrega")
        self.payment_scenario = self.root.get_by_label("Resultado del simulador")
        self.submit_button = self.root.get_by_role("button", name="Crear pedido y pagar")
        self.hosted_checkout_button = self.root.get_by_role(
            "button", name="Continuar en Stripe Checkout"
        )
        self.confirmation = self.root.get_by_role("status")

    def complete_customer(self, *, name: str, email: str, notes: str = "") -> None:
        self.name_input.fill(name)
        self.email_input.fill(email)
        self.delivery_notes.fill(notes)

    def select_payment_scenario(self, scenario: str) -> None:
        self.payment_scenario.select_option(scenario)

    def submit(self) -> None:
        self.submit_button.click()
