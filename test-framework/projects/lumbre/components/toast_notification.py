from playwright.sync_api import Page


class ToastNotification:
    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("status")
        self.close_button = self.root.get_by_role(
            "button",
            name="Cerrar mensaje",
        )

    def dismiss(self) -> None:
        self.close_button.click()
