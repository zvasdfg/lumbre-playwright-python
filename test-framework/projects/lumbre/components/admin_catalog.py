from __future__ import annotations

from playwright.sync_api import Locator, Page


class AdminCatalog:
    """Administrator-only catalog actions and observable UI state."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.root = page.get_by_role("dialog", name="Administración del catálogo.")
        self.reload_button = self.root.get_by_role("button", name="Recargar catálogo")
        self.message = self.root.get_by_role("status")
        self.product_form = self.root.get_by_test_id("admin-product-form")
        self.product_name_input = self.product_form.get_by_label("Nombre del producto")
        self.product_category_select = self.product_form.get_by_label("Categoría")
        self.product_price_input = self.product_form.get_by_label("Precio en MXN")
        self.product_stock_input = self.product_form.get_by_label("Existencias disponibles")
        self.product_badge_input = self.product_form.get_by_label("Distintivo")
        self.product_active_checkbox = self.product_form.get_by_label(
            "Producto visible en la tienda.",
        )
        self.save_product_button = self.product_form.get_by_role(
            "button",
            name="Guardar producto",
        )
        self.event_form = self.root.get_by_test_id("admin-event-form")
        self.event_capacity_input = self.event_form.get_by_label("Capacidad")
        self.event_active_checkbox = self.event_form.get_by_label(
            "Encuentro visible en la agenda.",
        )
        self.save_event_button = self.event_form.get_by_role(
            "button",
            name="Guardar encuentro",
        )
        self.close_button = self.root.get_by_role(
            "button",
            name="Cerrar administración",
        )

    def product(self, product_id: int) -> Locator:
        return self.root.get_by_test_id(f"admin-product-{product_id}")

    def event(self, event_id: int) -> Locator:
        return self.root.get_by_test_id(f"admin-event-{event_id}")

    def select_product(self, product_id: int) -> None:
        self.product(product_id).click()

    def update_product_price(self, price: int) -> None:
        self.product_price_input.fill(str(price))
        self.save_product_button.click()

    def update_product_stock(self, stock: int) -> None:
        self.product_stock_input.fill(str(stock))
        self.save_product_button.click()

    def select_event(self, event_id: int) -> None:
        self.event(event_id).click()

    def set_event_active(self, active: bool) -> None:
        self.event_active_checkbox.set_checked(active)
        self.save_event_button.click()

    def close(self) -> None:
        self.close_button.click()
