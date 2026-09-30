from __future__ import annotations

import json
from urllib.parse import urlsplit

from playwright.sync_api import Page


class BasePage:
    """Shared browser behavior, without business-specific assertions."""

    path = "/"

    def __init__(self, page: Page, base_url: str) -> None:
        self.page = page
        self.base_url = base_url.rstrip("/")

    def open(self) -> None:
        failures: list[str] = []
        pending: dict[int, str] = {}

        def started(request):
            if request.resource_type in {"document", "script", "fetch", "xhr"}:
                pending[id(request)] = urlsplit(request.url).path

        def finished(request):
            pending.pop(id(request), None)

        def failed(request):
            failures.append(f"{urlsplit(request.url).path}: {request.failure}")
            finished(request)

        def response_received(response):
            if response.status >= 400:
                failures.append(f"HTTP {response.status}: {urlsplit(response.url).path}")

        def page_error(error):
            failures.append(f"JavaScript: {str(error)[:500]}")

        listeners = {
            "request": started,
            "requestfinished": finished,
            "requestfailed": failed,
            "response": response_received,
            "pageerror": page_error,
        }
        for event, callback in listeners.items():
            self.page.on(event, callback)
        try:
            self.page.goto(f"{self.base_url}{self.path}", wait_until="domcontentloaded")
            self.wait_until_ready()
        except Exception as error:
            # Do not collect response bodies, cookies, or URL query strings.
            error.add_note(
                "Navigation diagnostics: "
                + json.dumps(
                    {
                        "failures": failures[-20:],
                        "pending_paths": list(pending.values())[:20],
                    }
                )
            )
            raise
        finally:
            for event, callback in listeners.items():
                self.page.remove_listener(event, callback)

    def wait_until_ready(self) -> None:
        self.page.locator("main[data-app-ready='true']").wait_for(state="attached")
