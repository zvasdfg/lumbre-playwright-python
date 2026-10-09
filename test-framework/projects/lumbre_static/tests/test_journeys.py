"""Current static journeys. Each parameter has a fresh browser context."""
import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression]


@pytest.fixture(params=[390, 1440], ids=["mobile", "desktop"])
def portal(page, app_url, request):
    page.set_viewport_size({"width": request.param, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(app_url)
    expect(page.locator('[data-app-ready="true"]')).to_be_visible()
    yield page
    assert not errors, errors
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.mark.parametrize("name,target", [("Método", "metodo"),
    ("Planificador", "planificador"), ("Recetas", "recetas"),
    ("Laboratorio", "laboratorio"), ("Provisiones", "tienda")])
@pytest.mark.case("STATIC-UI-001", "First section navigation reaches the correct anchor")
def test_first_navigation(portal, name, target):
    page = portal
    if page.viewport_size["width"] < 700:
        page.locator(".mobile-nav summary").click()
        page.locator(f'.mobile-nav a[href="#{target}"]').click()
        expect(page.locator(".mobile-nav")).not_to_have_attribute("open", "")
    else:
        page.get_by_role("navigation", name="Navegación principal").get_by_role(
            "link", name=name, exact=True).click()
    page.wait_for_function("""id => {
        const e = document.getElementById(id);
        return e && !e.hasAttribute('aria-busy') &&
          Math.abs(e.getBoundingClientRect().top - parseFloat(getComputedStyle(e).scrollMarginTop)) < 5;
    }""", arg=target)
    assert page.url.endswith("#" + target)


@pytest.mark.parametrize("goal,temperature", [("asar", "220"), ("ahumar", "120"), ("hornear", "180")])
@pytest.mark.case("STATIC-UI-002", "Planner defaults, persistence and stale print invalidation")
def test_planner_defaults_and_saved_round_trip(portal, goal, temperature):
    page = portal
    page.get_by_label("Objetivo de cocción", exact=True).select_option(goal)
    expect(page.get_by_label("Temperatura de trabajo", exact=True)).to_have_value(temperature)
    page.get_by_label("Horas de cocción", exact=True).fill("2.5")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.locator(".planner-result")).to_contain_text("2.5 h")
    page.get_by_label("Nombre del plan", exact=True).fill("Round trip")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.reload()
    page.get_by_role("button", name="Editar plan Round trip", exact=True).click()
    expect(page.get_by_label("Objetivo de cocción", exact=True)).to_have_value(goal)
    expect(page.get_by_label("Horas de cocción", exact=True)).to_have_value("2.5")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    page.get_by_role("button", name="Imprimir / PDF", exact=True).click()
    expect(page.get_by_role("dialog")).to_contain_text("2.5 h")
    page.get_by_role("button", name="Cerrar plan imprimible", exact=True).click()
    page.get_by_label("Horas de cocción", exact=True).fill("3")
    expect(page.get_by_role("button", name="Imprimir / PDF", exact=True)).to_have_count(0)


@pytest.mark.case("STATIC-UI-003", "Recipe pagination and blend return preserve context")
def test_recipe_pagination_and_modal_return(portal):
    page = portal
    first = page.get_by_test_id("recipe-card").first.locator("h3").inner_text()
    page.get_by_role("button", name="Ir a página 2", exact=True).click()
    expect(page.get_by_test_id("recipe-page-status")).to_contain_text("7–12")
    page.get_by_role("button", name="Ir a página 1", exact=True).click()
    expect(page.get_by_test_id("recipe-card").first.locator("h3")).to_have_text(first)
    card = page.get_by_test_id("recipe-card").first
    card.get_by_role("button").click()
    recipe = page.get_by_role("dialog", name=first, exact=True)
    recipe.locator(".recipe-blend-link").click()
    expect(page.get_by_role("dialog")).to_have_count(1)
    page.get_by_role("button", name="Volver a la receta", exact=False).click()
    expect(recipe).to_be_visible()
    expect(recipe.locator(".recipe-blend-link")).to_be_focused()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)


@pytest.mark.case("STATIC-UI-004", "Lab search, quantities, radar, alias and deletion")
def test_lab_search_recalculation_and_alias(portal):
    page = portal
    page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()
    search = page.get_by_role("searchbox", name="Buscar componente", exact=True)
    search.fill("zz-no-ingredient-zz")
    expect(page.get_by_test_id("ingredient-card")).to_have_count(0)
    search.fill("")
    for ingredient in ("sal_kosher", "pimienta_negra", "ajo_granulado"):
        card = page.get_by_test_id("ingredient-card").filter(
            has=page.locator(f'[data-ingredient-id="{ingredient}"]'))
        group = page.locator("details.ingredient-family-group").filter(has=card)
        if group.get_attribute("open") is None:
            group.locator("summary").click()
        card.get_by_role("button", name="Agregar", exact=True).click()
        expect(group.locator("summary")).to_contain_text("1 seleccionados")
    expect(page.get_by_label("Gramos de sal kosher", exact=True)).to_have_value("67.5")
    expect(page.get_by_label("Gramos de pimienta negra", exact=True)).to_have_value("60")
    expect(page.get_by_label("Gramos de ajo granulado", exact=True)).to_have_value("22.5")
    radar = page.locator(".experiment-bench .lab-radar svg")
    expect(radar.locator("text")).to_have_text(["Salado", "Dulce", "Ácido", "Amargo", "Umami"])
    previous = radar.locator("title").text_content()
    page.get_by_label("Gramos de sal kosher", exact=True).fill("1")
    expect(radar.locator("title")).not_to_have_text(previous)
    page.get_by_role("button", name="Retirar ajo granulado", exact=True).click()
    expect(page.get_by_label("Gramos de sal kosher", exact=True)).to_have_value("75")
    expect(page.get_by_label("Gramos de pimienta negra", exact=True)).to_have_value("75")
    page.get_by_label("Nombre de tu blend", exact=True).fill("Prueba pimientas")
    page.get_by_role("button", name="Guardar en esta sesión", exact=True).click()
    sheet = page.get_by_test_id("hypothesis-print-preview")
    expect(sheet.locator("#hypothesis-sheet-title")).to_have_text("Prueba pimientas")
    expect(sheet.locator(".lab-sheet-quantities tbody tr")).to_have_count(2)
    expect(sheet.locator(".lab-sheet-quantities")).not_to_contain_text("%")
    expect(sheet).not_to_contain_text("codex-clipboard")
    page.get_by_role("button", name="Cerrar ficha técnica", exact=True).click()
    page.reload()
    page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()
    expect(page.get_by_test_id("session-blends")).to_contain_text("Prueba pimientas")
    page.get_by_role("button", name="Eliminar blend Prueba pimientas", exact=True).click()
    expect(page.get_by_test_id("session-blends")).to_have_count(0)


@pytest.mark.parametrize("filter_name", ["Fuego directo", "Lento y ahumado", "Vegetales"])
@pytest.mark.case("STATIC-UI-005", "Recipe filters and search recover from empty results")
def test_recipe_search_and_filters(portal, filter_name):
    page = portal
    button = page.get_by_role("button", name=filter_name, exact=True)
    button.click()
    expect(button).to_have_attribute("aria-pressed", "true")
    expect(page.get_by_test_id("recipe-card").first).to_be_visible()
    title = page.get_by_test_id("recipe-card").first.locator("h3").inner_text()
    search = page.get_by_placeholder("Buscar receta...", exact=True)
    search.fill("zz-no-recipe-zz")
    expect(page.get_by_test_id("recipe-card")).to_have_count(0)
    search.fill(title)
    expect(page.get_by_test_id("recipe-card").first.locator("h3")).to_have_text(title)
    search.fill("")
    page.get_by_role("button", name="Todas", exact=True).click()
    expect(page.get_by_test_id("recipe-card")).to_have_count(6)


@pytest.mark.case("STATIC-UI-006", "Almanac boundary controls and image loading")
def test_almanac_boundaries(portal):
    page = portal
    page.get_by_role("button", name="Almanaque", exact=False).click()
    index = page.get_by_label("Ir a una página del almanaque")
    expect(index).to_be_visible()
    count = index.locator("option").count()
    assert count > 1
    index.select_option(index=count - 1)
    expect(page.get_by_role("button", name="Página siguiente", exact=True)).to_be_disabled()
    image = page.get_by_test_id("almanac-page").locator("img")
    expect(image).to_have_js_property("naturalWidth", 1254)
    index.select_option(index=0)
    expect(page.get_by_role("button", name="Página anterior", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Cerrar almanaque", exact=True).click()
    expect(index).to_have_count(0)
