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
        self.preferences = self.root.get_by_test_id("membership-preferences")
        self.preferred_fuel_select = self.preferences.get_by_label("Combustible favorito")
        self.equipment_select = self.preferences.get_by_label("Equipo habitual")
        self.cooking_style_select = self.preferences.get_by_label(
            "Estilo de cocción favorito",
        )
        self.default_guests_input = self.preferences.get_by_label("Personas habituales")
        self.newsletter_checkbox = self.preferences.get_by_label(
            "Recibir novedades del club por correo.",
        )
        self.save_preferences_button = self.preferences.get_by_role(
            "button",
            name="Guardar preferencias",
        )
        self.preference_status = self.preferences.get_by_role("status")

    def request_magic_link(self, *, name: str, email: str) -> None:
        self.name_input.fill(name)
        self.email_input.fill(email)
        self.request_link_button.click()

    def update_preferences(
        self,
        *,
        preferred_fuel: str,
        equipment: str,
        cooking_style: str,
        default_guests: int,
        newsletter_consent: bool,
    ) -> None:
        self.preferred_fuel_select.select_option(preferred_fuel)
        self.equipment_select.select_option(equipment)
        self.cooking_style_select.select_option(cooking_style)
        self.default_guests_input.fill(str(default_guests))
        self.newsletter_checkbox.set_checked(newsletter_consent)
        self.save_preferences_button.click()
