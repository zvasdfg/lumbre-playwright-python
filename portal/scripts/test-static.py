"""Acceptance checks against the standalone static preview (no backend fixtures)."""
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE_URL = "http://127.0.0.1:3001"

def check_print_action(page, sheet):
    page.evaluate("() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; }")
    button = sheet.get_by_role("button", name="Imprimir ficha", exact=True)
    expect(button).to_be_in_viewport()
    button.click()
    assert page.evaluate("window.__printCalls") == 1, "Print button did not call window.print"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    for width in (1440, 390):
        context = browser.new_context(viewport={"width": width, "height": 900})
        page = context.new_page()
        errors, api_requests, failed_assets = [], [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("request", lambda request: api_requests.append(request.url)
                if "/api/" in request.url else None)
        page.on("response", lambda response: failed_assets.append(response.url)
                if response.status >= 400 else None)
        page.goto(BASE_URL)
        expect(page.locator('[data-app-ready="true"]')).to_be_visible()
        expect(page.get_by_test_id("account-button")).to_have_count(0)
        expect(page.get_by_role("button", name="Crear cuenta", exact=True)).to_have_count(0)
        expect(page.get_by_role("button", name="Entrar", exact=True)).to_have_count(0)
        expect(page.locator(".cart-button, .cart-drawer")).to_have_count(0)
        expect(page.get_by_test_id("product-card")).to_have_count(4)
        for index, name in enumerate(("Sazonador multiuso", "Sazonador para carne de res", "Sazonador para carne de cerdo", "Sazonador para carne de pollo")):
            trigger = page.get_by_role("button", name=f"Ver ficha de {name}", exact=True)
            trigger.click()
            sheet = page.get_by_role("dialog", name=name, exact=True)
            expect(sheet).to_be_visible()
            expect(sheet.get_by_role("heading", name="¿Con qué combinarlo?", exact=True)).to_be_visible()
            expect(sheet.locator(".taste-chart li")).to_have_count(5)
            expect(sheet.locator("svg.taste-radar")).to_be_visible()
            expect(sheet.locator(".radar-point")).to_have_count(5)
            expect(sheet.locator(".taste-radar text")).to_have_text(["Dulce", "Salado", "Ácido", "Amargo", "Umami"])
            expect(sheet).to_contain_text("no una medición del producto")
            expect(sheet.locator(".product-pairings li")).to_have_count(3)
            expect(sheet.get_by_role("button", name="Imprimir ficha", exact=True)).to_be_visible()
            check_print_action(page, sheet)
            content = sheet.inner_text()
            if width == 1440:
                page.pdf(path=f"/tmp/lumbre-print-product-{index + 1}.pdf", prefer_css_page_size=True, print_background=True)
            assert sheet.evaluate("e => e.scrollWidth <= e.clientWidth"), "Sheet overflow"
            if index == 0:
                sheet.locator("svg.taste-radar").scroll_into_view_if_needed()
                page.screenshot(path=str(Path("/tmp") / f"lumbre-product-sheet-{width}.png"))
                page.keyboard.press("Escape")
            else:
                sheet.get_by_role("button", name="Cerrar ficha de producto", exact=True).click()
            expect(sheet).to_have_count(0)
            expect(trigger).to_be_focused()
            registry_card = page.get_by_test_id("hypothesis-registry").locator(".hypothesis-card").nth(index)
            registry_card.get_by_role("button", name="Abrir ficha", exact=True).click()
            expect(sheet).to_be_visible()
            assert sheet.inner_text() == content, "Registry and provisions must show the same product sheet"
            sheet.get_by_role("button", name="Cerrar ficha de producto", exact=True).click()
        expect(page.get_by_test_id("recipe-card")).to_have_count(6)
        for index in range(3):
            recipe_card = page.get_by_test_id("recipe-card").nth(index)
            title = recipe_card.locator("h3").inner_text()
            recipe_trigger = recipe_card.get_by_role("button")
            recipe_trigger.click()
            recipe_sheet = page.get_by_role("dialog", name=title, exact=True)
            expect(recipe_sheet).to_be_visible()
            expect(recipe_sheet).to_contain_text("Preparación paso a paso")
            expect(recipe_sheet.locator(".recipe-method li")).to_have_count(4)
            expect(recipe_sheet).to_contain_text("todavía no probada en cocina")
            check_print_action(page, recipe_sheet)
            assert recipe_sheet.evaluate("e => e.scrollWidth <= e.clientWidth")
            if width == 1440:
                page.pdf(path=f"/tmp/lumbre-print-recipe-{index + 1}.pdf", prefer_css_page_size=True, print_background=True)
            if index == 0:
                page.screenshot(path=f"/tmp/lumbre-recipe-{width}.png")
            page.keyboard.press("Escape")
            expect(recipe_sheet).to_have_count(0)
            expect(recipe_trigger).to_be_focused()
        page.get_by_role("button", name="Ir a página 2", exact=True).click()
        expect(page.get_by_test_id("recipe-page-status")).to_contain_text("7–12")

        page.get_by_label("Personas", exact=True).fill("9")
        page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
        expect(page.get_by_role("status", name="Recomendación de combustible")).to_be_visible()
        page.get_by_label("Nombre del preset", exact=True).fill("Prueba local")
        page.get_by_role("button", name="Guardar preset", exact=True).click()
        page.reload()
        page.get_by_role("button", name="Cargar preset Prueba local", exact=True).click()
        expect(page.get_by_label("Personas", exact=True)).to_have_value("9")

        for ingredient in ("ajo_granulado", "pimienta_negra", "sal_mar_gruesa"):
            card = page.get_by_test_id("ingredient-card").filter(
                has=page.locator(f'[data-ingredient-id="{ingredient}"]')
            )
            group = page.locator("details.ingredient-family-group").filter(has=card)
            if group.get_attribute("open") is None:
                group.locator("summary").click()
            card.get_by_role("button", name="Agregar", exact=True).click()
        page.get_by_label("Nombre de tu blend", exact=True).fill("SPG local")
        page.get_by_role("button", name="Guardar en esta sesión", exact=True).click()
        expect(page.get_by_test_id("hypothesis-print-preview")).to_be_visible()
        experiment = page.get_by_test_id("hypothesis-print-preview")
        check_print_action(page, experiment)
        experiment.evaluate("e => e.scrollTop = e.scrollHeight")
        check_print_action(page, experiment)
        if width == 1440:
            page.pdf(path="/tmp/lumbre-print-experiment.pdf", prefer_css_page_size=True, print_background=True)
        page.get_by_role("button", name="Cerrar ficha técnica", exact=True).click()
        page.reload()
        expect(page.get_by_test_id("session-blends")).to_contain_text("SPG local")
        expect(page.get_by_test_id("hypothesis-registry").locator(".hypothesis-card")).to_have_count(4)

        page.get_by_role("button", name="Almanaque", exact=False).click()
        page.get_by_role("button", name="Página siguiente", exact=True).click()
        expect(page.get_by_test_id("almanac-page-status")).to_contain_text("1")
        almanac_index = page.get_by_label("Ir a una página del almanaque")
        expect(almanac_index.locator("option")).to_have_count(25)
        for number in range(16, 25):
            almanac_index.select_option(str(number))
            expect(page.get_by_test_id("almanac-page-status")).to_contain_text(f"DOC. {number:03d}")
            image = page.get_by_test_id("almanac-page").locator("img")
            expect(image).to_have_attribute("src", f"/editorial/almanac/page-{number:03d}.jpeg")
            expect(image).to_have_js_property("naturalWidth", 1254)
        expect(page.get_by_role("button", name="Página siguiente", exact=True)).to_be_disabled()
        page.get_by_role("button", name="Página anterior", exact=True).click()
        expect(page.get_by_test_id("almanac-page-status")).to_contain_text("DOC. 023")
        page.get_by_role("button", name="Cerrar almanaque", exact=True).click()
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Horizontal overflow"
        assert not api_requests, api_requests
        assert not errors, errors
        assert not failed_assets, failed_assets
        page.screenshot(path=str(Path("/tmp") / f"lumbre-static-{width}.png"))
        for route in ("/api/account", "/api/cart", "/api/auth/sign-in", "/api/orders"):
            response = context.request.get(BASE_URL + route)
            assert response.status == 404, (route, response.status)
        context.close()
        print(f"PASS {width}px: tools, static catalog, no API traffic, no accounts/cart, API routes 404")
    browser.close()
