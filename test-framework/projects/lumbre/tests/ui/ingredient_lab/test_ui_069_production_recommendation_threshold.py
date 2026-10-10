import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.laboratory, pytest.mark.portal]


@pytest.mark.case("UI-069", "Production recommendation threshold is visible in the customer sheet")
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
