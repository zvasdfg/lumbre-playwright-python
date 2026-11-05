"""Reader interactions. Catalog expectations and assertions belong to the tests."""


class FireAlmanac:
    def __init__(self, page):
        self.page = page
        self.dialog = page.get_by_role("dialog", name="Almanaque de fuego", exact=True)
        self.index = page.get_by_label("Ir a una página del almanaque", exact=True)
        self.image = page.get_by_test_id("almanac-page").locator("img")
        self.status = page.get_by_test_id("almanac-page-status")

    def open(self):
        self.page.get_by_role("button", name="Almanaque", exact=False).click()

    def select(self, document):
        # Select by displayed document ID, not its potentially different ordinal.
        identifier = f"{document:03d}" if isinstance(document, int) else document
        prefix = f"{identifier} ·"
        self.index.wait_for(state="visible")
        for option in self.index.locator("option").all():
            if option.inner_text().startswith(prefix):
                self.index.select_option(option.get_attribute("value"))
                return
        raise ValueError(f"Almanac document {identifier} is unavailable")

    def close(self):
        self.page.get_by_role("button", name="Cerrar almanaque", exact=True).click()
