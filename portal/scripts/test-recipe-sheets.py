"""Exercise every static recipe at desktop/mobile and export print QA samples."""
from browser_test_options import browser_launch_options
from pathlib import Path
import re
from playwright.sync_api import expect, sync_playwright

OUTPUT = Path("/tmp/lumbre-recipe-qa")
OUTPUT.mkdir(exist_ok=True)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(**browser_launch_options())
    for width in (1440, 390):
        context = browser.new_context(viewport={"width": width, "height": 900})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:3001/#recetas")
        expect(page.locator('[data-app-ready="true"]')).to_be_visible()
        titles = set()
        blend_count = 0
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
                assert sheet.locator(".recipe-ingredients li").count() >= (3 if sheet.locator(".recipe-blend").count() else 4)
                assert sheet.locator(".recipe-sources a").count() >= 3
                expect(sheet).to_contain_text("todavía no probada en cocina")
                has_blend = sheet.locator(".recipe-blend").count() == 1
                if has_blend:
                    blend_count += 1
                    blend_code = re.search(r"LMB-F-00[1-4]", sheet.locator(".recipe-blend h3").inner_text()).group()
                    expect(sheet.locator(".recipe-blend")).to_contain_text("no están documentadas")
                    expect(sheet.locator(".recipe-blend")).to_contain_text(blend_code)
                    page.emulate_media(media="print")
                    expect(sheet.locator(".recipe-blend-link")).to_be_hidden()
                    expect(sheet.locator(".recipe-blend")).to_be_visible()
                    page.emulate_media(media="screen")
                assert sheet.evaluate("e => e.scrollWidth <= e.clientWidth"), title
                sheet.locator(".recipe-sources").scroll_into_view_if_needed()
                expect(sheet.get_by_role("button", name="Imprimir ficha", exact=True)).to_be_in_viewport()
                if width == 1440:
                    page.emulate_media(media="print")
                    page.pdf(path=str(OUTPUT / f"recipe-{len(titles):03}.pdf"), prefer_css_page_size=True, print_background=True)
                    page.emulate_media(media="screen")
                if len(titles) in (1, 67, 100):
                    page.screenshot(path=str(OUTPUT / f"recipe-{len(titles):03}-{width}.png"))
                page.keyboard.press("Escape")
                expect(sheet).to_have_count(0)
                expect(trigger).to_be_focused()
                if has_blend:
                    trigger.click()
                    sheet.get_by_role("button", name=f"Ver ficha de {blend_code}", exact=True).click()
                    expect(sheet).to_have_count(0)
                    product = page.get_by_role("dialog")
                    expect(product).to_have_count(1)
                    expect(product).to_contain_text(blend_code)
                    if blend_code == "LMB-F-002":
                        expect(product).to_contain_text("Ajo granulado")
                    page.keyboard.press("Escape")
                    expect(product).to_have_count(0)
            if batch < 16:
                page.get_by_role("navigation", name="Páginas de recetas").get_by_role("button", name="Siguiente").click()
                expect(page.get_by_test_id("recipe-page-status")).to_contain_text(f"{(batch + 1) * 6 + 1}–")
        assert len(titles) == 100
        assert blend_count == 73
        assert not errors, errors
        print(f"PASS {width}px: all 100 sheets, complete instructions, source links, print toolbar, focus and overflow", flush=True)
        context.close()
    browser.close()
