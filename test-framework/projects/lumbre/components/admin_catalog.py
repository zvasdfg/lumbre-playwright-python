from __future__ import annotations

from playwright.sync_api import Locator, Page


class AdminCatalog:
    """Administrator-only catalog actions and observable UI state."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.root = page.get_by_role("dialog", name="Administración del catálogo.")
        self.reload_button = self.root.get_by_role("button", name="Recargar catálogo")
        self.message = self.root.get_by_role("status").or_(self.root.get_by_role("alert"))
        self.new_product_button = self.root.get_by_role(
            "button", name="Nuevo sazonador", exact=True
        )
        self.product_form = self.root.get_by_test_id("admin-product-form")
        self.product_name_input = self.product_form.get_by_label("Nombre del producto")
        self.product_code_input = self.product_form.get_by_label("Código del sazonador")
        self.product_description_input = self.product_form.get_by_label("Descripción del sazonador")
        self.product_image_alt_input = self.product_form.get_by_label("Descripción de la imagen")
        self.save_draft_button = self.product_form.get_by_role("button", name="Guardar borrador")
        self.preview_button = self.product_form.get_by_role(
            "button", name="Vista previa", exact=True
        )
        self.publish_product_button = self.product_form.get_by_role(
            "button", name="Publicar en tienda y laboratorio"
        )
        self.product_preview = self.root.get_by_test_id("admin-product-preview")
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
        self.blend_review_list = self.root.get_by_test_id("admin-blend-review-list")
        self.blend_review = self.root.get_by_test_id("admin-blend-review")
        self.moderation_note = self.blend_review.get_by_label("Nota editorial")
        self.approve_blend_button = self.blend_review.get_by_role(
            "button",
            name="Aprobar y publicar",
        )
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

    def create_draft(self, name: str, code: str, description: str, ingredients: list[str]) -> None:
        self.new_product_button.click()
        self.product_name_input.fill(name)
        self.product_code_input.fill(code)
        self.product_description_input.fill(description)
        self.product_image_alt_input.fill("Frasco de muestra para pruebas locales")
        for ingredient in ingredients:
            self.product_form.get_by_role("checkbox", name=ingredient, exact=True).check()
        self.save_draft_button.click()

    def event(self, event_id: int) -> Locator:
        return self.root.get_by_test_id(f"admin-event-{event_id}")

    def blend(self, blend_id: str) -> Locator:
        return self.root.get_by_test_id(f"admin-blend-{blend_id}")

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

    def approve_blend(self, blend_id: str, note: str = "") -> None:
        self.blend(blend_id).click()
        if note:
            self.moderation_note.fill(note)
        self.approve_blend_button.click()

    def close(self) -> None:
        self.close_button.click()
