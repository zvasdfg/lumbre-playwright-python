from __future__ import annotations

from playwright.sync_api import Page


class FireAlmanac:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.trigger = page.get_by_role("button", name="Almanaque 15 notas de campo")
        self.dialog = page.get_by_role("dialog", name="Almanaque de fuego")
        self.page_selector = self.dialog.get_by_label("Ir a una página del almanaque")
        self.page_surface = self.dialog.get_by_test_id("almanac-page")
        self.page_status = self.dialog.get_by_test_id("almanac-page-status")
        self.previous_page = self.dialog.get_by_role("button", name="Página anterior")
        self.next_page = self.dialog.get_by_role("button", name="Página siguiente")
        self.zoom = self.dialog.get_by_role("button", name="Ampliar para leer")
        self.close_button = self.dialog.get_by_role("button", name="Cerrar almanaque")

    def open(self) -> None:
        self.trigger.click()

    def open_first_page(self) -> None:
        self.dialog.get_by_role("button", name="Abrir el almanaque").click()

    def go_to_document(self, document: str, title: str) -> None:
        self.page_selector.select_option(label=f"{document} · {title}")

    def close_with_keyboard(self) -> None:
        self.page.keyboard.press("Escape")
