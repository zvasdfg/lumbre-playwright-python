"""State transitions and production recommendation boundaries in the real UI."""
import pytest
from math import floor
from playwright.sync_api import expect
from projects.lumbre_static.components.laboratory import Laboratory
from projects.lumbre_static.data.cases import INGREDIENTS

pytestmark = [pytest.mark.ui, pytest.mark.regression]


@pytest.fixture(params=[390, 1440], ids=["mobile", "desktop"])
def lab(page, app_url, request):
    page.set_viewport_size({"width": request.param, "height": 900})
    page.goto(app_url)
    component = Laboratory(page)
    component.open()
    yield component
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.mark.case("LAB-STATE-001", "Twelfth ingredient blocks additions; removal restores capacity")
def test_selection_capacity(lab):
    ids = ["sal_mar_gruesa", "pimienta_negra", "ajo_granulado", "azucar_morena",
           "chile_pasilla", "comino", "sumac", "shiitake_seco", "romero",
           "cafe_molido", "cacao_puro", "pimienta_blanca"]
    for ingredient in ids:
        lab.add(ingredient)
    page = lab.page
    selected = page.get_by_role("list", name="Componentes seleccionados").locator("li:not(.empty-slot)")
    expect(selected).to_have_count(12)
    thirteenth = lab.card("pimienta_verde")
    lab.expand(lab.family(thirteenth))
    expect(thirteenth.get_by_role("button", name="Agregar", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Retirar pimienta blanca", exact=True).click()
    expect(selected).to_have_count(11)
    expect(thirteenth.get_by_role("button", name="Agregar", exact=True)).to_be_enabled()
    thirteenth.get_by_role("button", name="Agregar", exact=True).click()
    expect(selected).to_have_count(12)
    expect(lab.family(thirteenth).locator("summary")).to_contain_text("2 seleccionados")


@pytest.mark.case("LAB-STATE-002", "Duplicate formula reopens original; variant preserves saved amounts")
def test_duplicate_and_variant(lab):
    page = lab.page
    lab.add("sal_mar_gruesa")
    lab.add("pimienta_negra")
    lab.save("Original")
    lab.close_sheet()
    lab.save("Otro nombre")
    expect(page.locator("#hypothesis-sheet-title")).to_have_text("Original")
    lab.close_sheet()
    cards = page.get_by_test_id("session-blends").locator("article")
    expect(cards).to_have_count(1)
    cards.get_by_role("button", name="Crear variante", exact=True).click()
    expect(page.get_by_label("Nombre de tu blend", exact=True)).to_have_value("Original · variante")
    page.get_by_label("Gramos de sal mar gruesa", exact=True).fill("60")
    page.get_by_label("Gramos de pimienta negra", exact=True).fill("90")
    lab.save("Variante")
    lab.close_sheet()
    expect(cards).to_have_count(2)
    page.reload()
    lab.open()
    original = cards.filter(has=page.get_by_role("heading", name="Original", exact=True))
    variant = cards.filter(has=page.get_by_role("heading", name="Variante", exact=True))
    expect(original).to_contain_text("75 g")
    expect(variant).to_contain_text("60 g")
    expect(variant).to_contain_text("90 g")


@pytest.mark.case("LAB-STATE-003", "Changing cooking heat creates an independent saved formula")
def test_heat_transition(lab):
    page = lab.page
    lab.add("sal_mar_gruesa")
    lab.add("pimienta_negra")
    lab.save("Directo")
    lab.close_sheet()
    salt = page.get_by_label("Gramos de sal mar gruesa", exact=True)
    before = salt.input_value()
    page.get_by_label("Primero, el fuego", exact=True).select_option("indirecto")
    expect(salt).to_have_value(before)
    lab.save("Indirecto")
    lab.close_sheet()
    cards = page.get_by_test_id("session-blends").locator("article")
    expect(cards).to_have_count(2)
    expect(cards.filter(has=page.get_by_role("heading", name="Directo", exact=True))).to_contain_text("Fuego directo")
    expect(cards.filter(has=page.get_by_role("heading", name="Indirecto", exact=True))).to_contain_text("Fuego indirecto")


@pytest.mark.case("LAB-STATE-004", "Four peppers contribute to the radar by their recorded grams")
def test_multiple_peppers(lab):
    ids = ["sal_mar_gruesa", "pimienta_negra", "pimienta_blanca", "pimienta_rosa", "pimienta_verde"]
    catalog = {item["id"]: item for item in INGREDIENTS}
    amounts = {ingredient: (75 if ingredient == "sal_mar_gruesa" else 18.75) for ingredient in ids}
    for ingredient in ids:
        lab.add(ingredient)
    page = lab.page
    group = lab.family(lab.card("pimienta_verde"))
    expect(group.locator("summary")).to_contain_text("4 seleccionados")
    for ingredient, grams in amounts.items():
        page.get_by_label("Gramos de " + catalog[ingredient]["nombre"], exact=True).fill(str(grams))
    axes = [("salado", "Salado"), ("dulce", "Dulce"), ("acido", "Ácido"),
            ("amargo", "Amargo"), ("umami", "Umami")]
    raw = [sum(catalog[i]["perfil_sensorial"][axis] * amounts[i] for i in ids) / 150 for axis, _ in axes]
    title = page.locator(".experiment-bench .lab-radar svg title")
    for (_, label), value in zip(axes, raw):
        expect(title).to_contain_text(f"{label} {floor(value / max(raw) * 100 + .5)}% del máximo")
    previous = title.text_content()
    page.get_by_label("Gramos de pimienta negra", exact=True).fill("1")
    expect(title).not_to_have_text(previous)
    page.get_by_role("button", name="Retirar pimienta blanca", exact=True).click()
    expect(group.locator("summary")).to_contain_text("3 seleccionados")
    expect(page.get_by_label("Gramos de pimienta blanca", exact=True)).to_have_count(0)


@pytest.mark.case("LAB-MATCH-001", "Production recommendation threshold is visible in the customer sheet")
@pytest.mark.parametrize("count,percent", [(3, None), (4, "80%"), (5, "100%")])
def test_production_threshold(lab, count, percent):
    # Independent LMB-F-004 identity contract; no production weights are used.
    ids = ["sal_mar_gruesa", "pimienta_negra", "ajo_granulado", "comino", "sumac"]
    for ingredient in ids[:count]:
        lab.add(ingredient)
    lab.save("Prueba umbral")
    recommendations = lab.page.locator(".lab-product-recommendations article")
    chicken = recommendations.filter(has_text="LMB-F-004")
    if percent is None:
        expect(chicken).to_have_count(0)
    else:
        expect(chicken).to_contain_text(percent + " de similitud")
        chicken.get_by_role("button", name="Ver ficha de LMB-F-004", exact=True).click()
        expect(lab.page.get_by_role("dialog").last).to_contain_text("Sazonador para carne de pollo")
