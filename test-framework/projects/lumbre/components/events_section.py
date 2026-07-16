from __future__ import annotations

from playwright.sync_api import Locator, Page


class EventsSection:
    """Actions and locators for the list of outdoor events."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.root = page.locator("#agenda")

    def event_named(self, event_title: str) -> Locator:
        heading = self.page.get_by_role("heading", name=event_title, exact=True)
        return self.root.locator("article").filter(has=heading)

    def reserve_event(self, event_title: str) -> None:
        self.event_named(event_title).get_by_role(
            "button",
            name="Reservar lugar",
        ).click()
