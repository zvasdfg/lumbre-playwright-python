"""Acceptance checks against the standalone static preview (no backend fixtures)."""
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE_URL = "http://127.0.0.1:3001"

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
        expect(page.get_by_test_id("recipe-card")).to_have_count(6)
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
        page.get_by_role("button", name="Cerrar ficha técnica", exact=True).click()
        page.reload()
        expect(page.get_by_test_id("session-blends")).to_contain_text("SPG local")
        expect(page.get_by_test_id("hypothesis-registry").locator(".hypothesis-card")).to_have_count(4)

        page.get_by_role("button", name="Almanaque", exact=False).click()
        page.get_by_role("button", name="Página siguiente", exact=True).click()
        expect(page.get_by_test_id("almanac-page-status")).to_contain_text("1")
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
