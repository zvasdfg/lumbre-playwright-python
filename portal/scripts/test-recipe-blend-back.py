"""Recipe -> blend -> same recipe; isolated from store product navigation."""
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (1440, 390):
        page = browser.new_page(viewport={"width": width, "height": 900})
        page.goto("http://127.0.0.1:3001/#recetas")
        for index in (0, 2, 3, 4):
            card = page.get_by_test_id("recipe-card").nth(index)
            title = card.locator("h3").inner_text()
            card.get_by_role("button").click()
            for _ in range(2):
                recipe = page.get_by_role("dialog", name=title, exact=True)
                link = recipe.locator(".recipe-blend-link")
                link.scroll_into_view_if_needed()
                scroll = recipe.evaluate("e => e.scrollTop")
                link.click()
                expect(page.get_by_role("dialog")).to_have_count(1)
                back = page.get_by_role("button", name="Volver a la receta", exact=False)
                expect(back).to_be_visible()
                assert page.get_by_role("dialog").evaluate("e => e.scrollWidth <= e.clientWidth")
                page.emulate_media(media="print")
                expect(back).to_be_hidden()
                page.emulate_media(media="screen")
                back.click()
                expect(recipe).to_be_visible()
                expect(page.get_by_role("dialog")).to_have_count(1)
                expect(link).to_be_focused()
                assert abs(recipe.evaluate("e => e.scrollTop") - scroll) < 3
                expect(recipe.get_by_role("button", name="Volver a la receta", exact=False)).to_have_count(0)
            page.keyboard.press("Escape")
            expect(page.get_by_role("dialog")).to_have_count(0)
        page.get_by_role("button", name="Ver ficha de Sazonador multiuso", exact=True).click()
        expect(page.get_by_role("button", name="Volver a la receta", exact=False)).to_have_count(0)
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)
        print(f"PASS {width}px: all four blends, repeated back, same recipe/scroll/focus, print and store isolation", flush=True)
        page.close()
    browser.close()
