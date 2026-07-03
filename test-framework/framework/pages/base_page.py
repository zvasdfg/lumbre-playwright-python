from __future__ import annotations

from playwright.sync_api import Page


class BasePage:
    """Shared browser behavior, without business-specific assertions."""

    path = "/"

    def __init__(self, page: Page, base_url: str) -> None:
        self.page = page
        self.base_url = base_url.rstrip("/")

    def open(self) -> None:
        self.page.goto(f"{self.base_url}{self.path}", wait_until="domcontentloaded")
        self.page.locator("main[data-app-ready='true']").wait_for(state="attached")
