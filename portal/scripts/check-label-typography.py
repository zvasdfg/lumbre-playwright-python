"""Screen typography regression: run against the local static preview."""
from playwright.sync_api import sync_playwright

AUDIT = """() => [...document.querySelectorAll('body *')].flatMap(e => {
  if (!e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') return [];
  const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  if (!hasText && !e.matches('input,select,textarea')) return [];
  return [null, '::before', '::after', ...(e.matches('input,textarea') ? ['::placeholder'] : [])].flatMap(p => {
    const s = getComputedStyle(e,p);
    if (p && p !== '::placeholder' && ['none','normal','""'].includes(s.content)) return [];
    return s.fontFamily.includes('ui-monospace') && s.fontStyle === 'normal' ? [] :
      [{tag:e.tagName, text:e.textContent.slice(0,70), pseudo:p, font:s.fontFamily, style:s.fontStyle}];
  });
})"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (390, 1440):
        page = browser.new_page(viewport={"width": width, "height": 900})
        page.goto("http://127.0.0.1:3001", wait_until="networkidle")

        def audit(state, printable=False):
            issues = page.evaluate(AUDIT)
            assert not issues, (width, state, issues)
            if printable:
                page.emulate_media(media="print")
                issues = page.evaluate(AUDIT)
                assert not issues, (width, state, "print", issues)
                page.emulate_media(media=None)
            print(f"PASS {width}: {state}", flush=True)

        audit("all page text and controls")
        page.get_by_role("button", name="Construir plan de fuego").click()
        audit("generated fire plan")
        for i in range(4):
            page.locator(".product-card-open").nth(i).click()
            audit(f"product sheet {i + 1} and SVG taste labels", printable=True)
            page.get_by_role("button", name="Cerrar ficha de producto", exact=True).click()
        recipe_count = 0
        while True:
            for button in page.locator(".recipe-card button").all():
                button.click()
                recipe_count += 1
                audit(f"recipe sheet {recipe_count}", printable=True)
                page.keyboard.press("Escape")
            next_page = page.locator(".recipe-pagination").get_by_role("button", name="Siguiente →")
            if next_page.is_disabled():
                break
            next_page.click()
        for heading in page.locator(".family-group-heading").all():
            if not heading.evaluate("e => e.parentElement.open"):
                heading.click()
        for i, button in enumerate(page.locator(".ingredient-actions button").filter(has_text="Ficha").all()):
            button.click()
            audit(f"ingredient sheet {i + 1}")
            page.get_by_role("button", name="Cerrar ficha", exact=True).click()
        for ingredient in ("ajo_granulado", "pimienta_negra", "sal_mar_gruesa"):
            card = page.get_by_test_id("ingredient-card").filter(has=page.locator(f'[data-ingredient-id="{ingredient}"]'))
            card.get_by_role("button", name="Agregar", exact=True).click()
        page.get_by_label("Nombre de tu blend", exact=True).fill("Auditoría tipográfica")
        page.get_by_role("button", name="Guardar en esta sesión", exact=True).click()
        audit("custom experiment sheet", printable=True)
        page.get_by_role("button", name="Cerrar ficha técnica", exact=True).click()
        page.get_by_label("Nombre del preset", exact=True).fill("Auditoría de fuego")
        page.get_by_role("button", name="Guardar preset", exact=True).click()
        page.get_by_role("button", name="Imprimir plan Auditoría de fuego", exact=True).click()
        audit("saved fire plan sheet", printable=True)
        page.screenshot(path=f"/tmp/lumbre-fire-plan-fonts-{width}.png")
        if width == 1440:
            page.pdf(path="/tmp/lumbre-fire-plan-fonts.pdf", prefer_css_page_size=True, print_background=True)
        page.get_by_role("button", name="Cerrar plan imprimible", exact=True).click()
        page.locator(".almanac-trigger").click()
        audit("almanac cover and controls")
        page.get_by_label("Ir a una página del almanaque").select_option("1")
        audit("almanac page controls (image text excluded)")
        page.close()
    browser.close()
