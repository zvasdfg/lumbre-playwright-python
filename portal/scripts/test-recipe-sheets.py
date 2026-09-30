"""Exercise every static recipe at desktop/mobile and export print QA samples."""
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

OUTPUT = Path("/tmp/lumbre-recipe-qa")
OUTPUT.mkdir(exist_ok=True)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    for width in (1440, 390):
        context = browser.new_context(viewport={"width": width, "height": 900})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:3001/#recetas")
        expect(page.locator('[data-app-ready="true"]')).to_be_visible()
        titles = set()
        for batch in range(17):
            cards = page.get_by_test_id("recipe-card")
            for index in range(cards.count()):
                card = cards.nth(index)
                title = card.locator("h3").inner_text()
                assert title not in titles, title
                titles.add(title)
                trigger = card.get_by_role("button")
                trigger.click()
                sheet = page.get_by_role("dialog", name=title, exact=True)
                expect(sheet.locator(".recipe-method li")).to_have_count(4)
                assert sheet.locator(".recipe-ingredients li").count() >= 4
                assert sheet.locator(".recipe-sources a").count() >= 3
                expect(sheet).to_contain_text("todavía no probada en cocina")
                assert sheet.evaluate("e => e.scrollWidth <= e.clientWidth"), title
                sheet.locator(".recipe-sources").scroll_into_view_if_needed()
                expect(sheet.get_by_role("button", name="Imprimir ficha", exact=True)).to_be_in_viewport()
                if width == 1440:
                    page.pdf(path=str(OUTPUT / f"recipe-{len(titles):03}.pdf"), prefer_css_page_size=True, print_background=True)
                if len(titles) in (1, 67, 100):
                    page.screenshot(path=str(OUTPUT / f"recipe-{len(titles):03}-{width}.png"))
                page.keyboard.press("Escape")
                expect(sheet).to_have_count(0)
                expect(trigger).to_be_focused()
            if batch < 16:
                page.get_by_role("navigation", name="Páginas de recetas").get_by_role("button", name="Siguiente").click()
                expect(page.get_by_test_id("recipe-page-status")).to_contain_text(f"{(batch + 1) * 6 + 1}–")
        assert len(titles) == 100
        assert not errors, errors
        print(f"PASS {width}px: all 100 sheets, complete instructions, source links, print toolbar, focus and overflow", flush=True)
        context.close()
    browser.close()
