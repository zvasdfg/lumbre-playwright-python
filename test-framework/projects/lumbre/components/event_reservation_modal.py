from __future__ import annotations

from playwright.sync_api import Locator, Page


class EventReservationModal:
    """Actions and locators for the selected event dialog."""

    def __init__(self, page: Page) -> None:
        self.page = page

    def for_event(self, event_title: str) -> Locator:
        return self.page.get_by_role("dialog", name=event_title, exact=True)

    def confirm(self, event_title: str) -> None:
        self.for_event(event_title).get_by_role(
            "button",
            name="Confirmar reservación",
        ).click()
