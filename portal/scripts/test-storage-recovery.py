"""Isolated contexts: corrupt/denied storage must never crash the public portal."""
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    scenarios = [
        "localStorage.setItem('lumbre.fire-planner.presets.v1', '[{}]')",
        "sessionStorage.setItem('lumbre.ingredient-lab.session-blends.v1', '[{\"id\":\"SES-001\",\"title\":\"test\",\"protocol\":{\"firma\":\"test\"}}]')",
        "localStorage.setItem('lumbre.fire-planner.presets.v1', '{broken')",
        "Storage.prototype.getItem = () => { throw new DOMException('Denied', 'SecurityError'); }",
        "Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }",
    ]
    for scenario in scenarios:
        context = browser.new_context()
        context.add_init_script(scenario)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:3001/")
        page.get_by_role("button", name="Comida directa", exact=False).click()
        expect(page.get_by_role("region", name="Plan de fuego", exact=True)).to_be_visible()
        if "setItem =" in scenario:
            page.get_by_label("Nombre del preset", exact=True).fill("Prueba sin espacio")
            page.get_by_role("button", name="Guardar preset", exact=True).click()
            expect(page.get_by_role("status").filter(has_text="No se pudo guardar")).to_be_visible()
            expect(page.get_by_test_id("fire-presets").locator("article")).to_have_count(0)
        assert not errors, errors
        context.close()
    browser.close()
print("PASS: corrupt storage, denied reads and quota failures")
